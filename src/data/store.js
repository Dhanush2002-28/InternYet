import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "../firebase/app";
import * as demo from "./demo";
import { newId } from "../utils/format";

export async function getProfile(uid) {
  if (!isFirebaseConfigured) return demo.demoGetUser(uid);
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

export async function saveProfile(uid, patch) {
  if (!isFirebaseConfigured) {
    demo.demoUpdateUser(uid, patch);
    return;
  }
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (snap.exists()) await updateDoc(ref, patch);
  else await setDoc(ref, { uid, role: "student", createdAt: new Date().toISOString(), ...patch });
}

export async function getAllUsers() {
  if (!isFirebaseConfigured) return demo.demoGetAllUsers();
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => d.data());
}

export async function getUsersByRole(role) {
  const all = await getAllUsers();
  return all
    .filter((u) => u.role === role)
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
}

export async function getClasses() {
  if (!isFirebaseConfigured) return demo.demoGetClasses();
  const snap = await getDocs(collection(db, "classes"));
  return snap.docs.map((d) => d.data());
}

export async function saveClass(data) {
  if (!isFirebaseConfigured) return demo.demoSaveClass(data);
  await setDoc(doc(db, "classes", data.id), data);
  return data;
}

export async function updateClass(id, patch) {
  if (!isFirebaseConfigured) {
    demo.demoUpdateClass(id, patch);
    return;
  }
  await updateDoc(doc(db, "classes", id), patch);
}

export async function deleteClass(id) {
  if (!isFirebaseConfigured) {
    demo.demoDeleteClass(id);
    return;
  }
  await deleteDoc(doc(db, "classes", id));
}

export async function getApprovedMentors() {
  if (!isFirebaseConfigured) return demo.demoGetAllApproved();
  const snap = await getDocs(collection(db, "approved", "mentors"));
  return snap.docs.map((d) => ({ email: d.id, ...d.data() }));
}

export async function saveApprovedMentor(email, data) {
  if (!isFirebaseConfigured) {
    demo.demoSaveApprovedMentor({ email, ...data });
    return;
  }
  await setDoc(doc(db, "approved", "mentors", email), data);
}

export async function deleteApprovedMentor(email) {
  if (!isFirebaseConfigured) {
    demo.demoDeleteApprovedMentor(email);
    return;
  }
  await deleteDoc(doc(db, "approved", "mentors", email));
}

export function normalizeCertificateNumber(value) {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, "");
}

export async function getCertificate(number) {
  const norm = normalizeCertificateNumber(number);
  if (!norm) return null;
  if (!isFirebaseConfigured) return demo.demoGetCertificate(norm);
  const snap = await getDoc(doc(db, "certificates", norm));
  return snap.exists() ? { number: snap.id, ...snap.data() } : null;
}

export async function saveCertificateRecord(entry) {
  if (!isFirebaseConfigured) return demo.demoSaveCertificate(entry);
  await setDoc(doc(db, "certificates", entry.number), entry);
  return entry;
}

export async function revokeCertificateRecord(number) {
  const norm = normalizeCertificateNumber(number);
  if (!isFirebaseConfigured) return demo.demoRevokeCertificate(norm);
  await updateDoc(doc(db, "certificates", norm), {
    status: "revoked",
    revokedAt: new Date().toISOString()
  });
}

export async function nextCertificateNumber() {
  const year = new Date().getFullYear();
  const key = `cert-${year}`;
  if (!isFirebaseConfigured) return demo.demoNextCertificateNumber();
  const counterRef = doc(db, "counters", key);
  const snap = await getDoc(counterRef);
  let serial = (snap.exists() ? Number(snap.data().value || 0) : 0) + 1;
  for (let guard = 0; guard < 100; guard++) {
    const candidate = `CERT-${year}-${String(serial + guard).padStart(4, "0")}`;
    const check = await getDoc(doc(db, "certificates", candidate));
    if (!check.exists()) {
      serial += guard;
      break;
    }
    if (guard === 99) serial += 100;
  }
  await setDoc(counterRef, { value: serial, updatedAt: new Date().toISOString() });
  return `CERT-${year}-${String(serial).padStart(4, "0")}`;
}

function excerpt(text, max = 90) {
  const value = String(text || "").replace(/\s+/g, " ").trim();
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function makeNotification({ type, title, text, ref, fromUid }) {
  return {
    id: newId("n"),
    type,
    title,
    text: text || "",
    ref: ref || null,
    fromUid: fromUid || null,
    read: false,
    at: new Date().toISOString()
  };
}

// ---------- Community forum ----------

export async function listForumPosts() {
  if (!isFirebaseConfigured) return demo.demoListPosts();
  const snap = await getDocs(query(collection(db, "posts"), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getForumPost(postId) {
  if (!isFirebaseConfigured) return demo.demoGetPost(postId);
  const snap = await getDoc(doc(db, "posts", postId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createForumPost({ title, body, author }) {
  const post = {
    title: String(title || "").trim(),
    body: String(body || "").trim(),
    authorUid: author?.uid || "",
    authorName: author?.name || "Student",
    authorRole: author?.role || "student",
    createdAt: new Date().toISOString()
  };
  if (!isFirebaseConfigured) {
    post.id = demo.demoUid("post");
    return demo.demoSavePost(post);
  }
  const ref = await addDoc(collection(db, "posts"), post);
  return { id: ref.id, ...post };
}

export async function listForumReplies(postId) {
  if (!isFirebaseConfigured) return demo.demoListReplies(postId);
  const snap = await getDocs(query(collection(db, "posts", postId, "replies"), orderBy("createdAt")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createForumReply(postId, { body, author }) {
  const reply = {
    body: String(body || "").trim(),
    authorUid: author?.uid || "",
    authorName: author?.name || "Student",
    authorRole: author?.role || "student",
    createdAt: new Date().toISOString()
  };
  if (!isFirebaseConfigured) {
    reply.id = demo.demoUid("reply");
    demo.demoSaveReply(postId, reply);
  } else {
    const ref = await addDoc(collection(db, "posts", postId, "replies"), reply);
    reply.id = ref.id;
  }
  const post = await getForumPost(postId);
  if (post && post.authorUid && post.authorUid !== reply.authorUid) {
    await sendNotification(post.authorUid, {
      type: "forum",
      title: `${reply.authorName} replied to your discussion`,
      text: post.title,
      ref: { kind: "forum", postId },
      fromUid: reply.authorUid
    }).catch(() => {});
  }
  return reply;
}

export function subscribeForumPosts(callback) {
  if (!isFirebaseConfigured) return demo.demoSubscribe(demo.demoListPosts, callback);
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}

export function subscribeForumReplies(postId, callback) {
  if (!isFirebaseConfigured) return demo.demoSubscribe(() => demo.demoListReplies(postId), callback);
  const q = query(collection(db, "posts", postId, "replies"), orderBy("createdAt"));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}

// ---------- One-on-one conversations ----------

export function conversationIdFor(uidA, uidB) {
  const pair = [String(uidA), String(uidB)].sort();
  return `u_${pair.join("__")}`;
}

export function counterpartOf(conv, uid) {
  const otherUid = (conv.participants || []).find((p) => p !== uid);
  if (!otherUid) return null;
  return {
    uid: otherUid,
    name: conv.participantNames?.[otherUid] || "User",
    role: conv.participantRoles?.[otherUid] || "student"
  };
}

export async function listMyConversations(uid) {
  if (!isFirebaseConfigured) return demo.demoListConversations(uid);
  const snap = await getDocs(query(collection(db, "conversations"), where("participants", "array-contains", uid)));
  return sortConversations(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
}

function sortConversations(items) {
  return items.sort((a, b) =>
    String(b.lastMessage?.at || b.createdAt || "").localeCompare(String(a.lastMessage?.at || a.createdAt || ""))
  );
}

export async function getOrCreateConversation({ a, b }) {
  const id = conversationIdFor(a.uid, b.uid);
  const conv = {
    id,
    participants: [a.uid, b.uid],
    participantNames: { [a.uid]: a.name || "", [b.uid]: b.name || "" },
    participantRoles: { [a.uid]: a.role || "student", [b.uid]: b.role || "student" },
    createdAt: new Date().toISOString()
  };
  if (!isFirebaseConfigured) {
    const existing = demo.demoGetConversation(id);
    return demo.demoUpsertConversation(existing ? { ...conv, ...existing } : conv);
  }
  await setDoc(doc(db, "conversations", id), conv, { merge: true });
  return conv;
}

export async function listConversationMessages(convId) {
  if (!isFirebaseConfigured) return demo.demoListMessages(convId);
  const snap = await getDocs(query(collection(db, "conversations", convId, "messages"), orderBy("at")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function sendMessage(convId, { fromUid, fromName, body, otherUid }) {
  const text = String(body || "").trim();
  const message = {
    convId,
    fromUid,
    fromName: fromName || "User",
    body: text,
    at: new Date().toISOString()
  };
  if (!isFirebaseConfigured) {
    message.id = demo.demoUid("msg");
    demo.demoAddMessage(convId, message);
    if (otherUid) {
      demo.demoUpdateConversation(convId, {
        lastMessage: { text: excerpt(text, 140), fromUid, at: message.at },
        unread: { [fromUid]: 0, [otherUid]: 1 }
      });
      demo.demoAddNotification(
        otherUid,
        makeNotification({
          type: "chat",
          title: `New message from ${message.fromName}`,
          text: excerpt(text),
          ref: { kind: "chat", convId },
          fromUid
        })
      );
    }
    return message;
  }
  const convRef = doc(db, "conversations", convId);
  const convSnap = await getDoc(convRef);
  const current = convSnap.exists() ? convSnap.data() : {};
  const unread = {
    ...(current.unread || {}),
    [fromUid]: 0,
    [otherUid]: (Number(current.unread?.[otherUid]) || 0) + 1
  };
  const batch = writeBatch(db);
  batch.set(doc(collection(db, "conversations", convId, "messages")), message);
  batch.update(convRef, {
    lastMessage: { text: excerpt(text, 140), fromUid, at: message.at },
    unread
  });
  if (otherUid) {
    const notif = makeNotification({
      type: "chat",
      title: `New message from ${message.fromName}`,
      text: excerpt(text),
      ref: { kind: "chat", convId },
      fromUid
    });
    batch.set(doc(db, "users", otherUid, "notifications", notif.id), notif);
  }
  await batch.commit();
  return message;
}

export async function markConversationRead(convId, uid) {
  if (!isFirebaseConfigured) {
    demo.demoUpdateConversation(convId, { [`unread.${uid}`]: 0 });
    return;
  }
  await updateDoc(doc(db, "conversations", convId), { [`unread.${uid}`]: 0 });
}

export function subscribeConversations(uid, callback) {
  if (!isFirebaseConfigured) return demo.demoSubscribe(() => demo.demoListConversations(uid), callback);
  const q = query(collection(db, "conversations"), where("participants", "array-contains", uid));
  return onSnapshot(q, (snap) => callback(sortConversations(snap.docs.map((d) => ({ id: d.id, ...d.data() })))));
}

export function subscribeConversationMessages(convId, callback) {
  if (!isFirebaseConfigured) return demo.demoSubscribe(() => demo.demoListMessages(convId), callback);
  const q = query(collection(db, "conversations", convId, "messages"), orderBy("at"));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}

// ---------- Notifications ----------

export async function listMyNotifications(uid) {
  if (!isFirebaseConfigured) return demo.demoListNotifications(uid).slice(0, 25);
  const snap = await getDocs(query(collection(db, "users", uid, "notifications"), orderBy("at", "desc"), limit(25)));
  return snap.docs.map((d) => d.data());
}

export async function sendNotification(targetUid, payload) {
  if (!targetUid) return null;
  const notif = makeNotification(payload);
  if (!isFirebaseConfigured) {
    demo.demoAddNotification(targetUid, notif);
    return notif;
  }
  await setDoc(doc(db, "users", targetUid, "notifications", notif.id), notif);
  return notif;
}

export async function sendNotificationsToMany(targets, payload) {
  const unique = [...new Set(targets.filter(Boolean))];
  if (!unique.length) return;
  if (!isFirebaseConfigured) {
    unique.forEach((uid) => demo.demoAddNotification(uid, makeNotification(payload)));
    return;
  }
  const batch = writeBatch(db);
  unique.forEach((uid) => {
    const notif = makeNotification(payload);
    batch.set(doc(db, "users", uid, "notifications", notif.id), notif);
  });
  await batch.commit();
}

export async function markNotificationRead(uid, notifId) {
  if (!isFirebaseConfigured) {
    demo.demoMarkNotificationRead(uid, notifId);
    return;
  }
  await updateDoc(doc(db, "users", uid, "notifications", notifId), { read: true });
}

export async function markAllNotificationsRead(uid) {
  if (!isFirebaseConfigured) {
    demo.demoMarkAllNotificationsRead(uid);
    return;
  }
  const items = await listMyNotifications(uid);
  const unread = items.filter((n) => !n.read);
  if (!unread.length) return;
  const batch = writeBatch(db);
  unread.forEach((n) => batch.update(doc(db, "users", uid, "notifications", n.id), { read: true }));
  await batch.commit();
}

export function subscribeMyNotifications(uid, callback) {
  if (!isFirebaseConfigured) return demo.demoSubscribe(() => demo.demoListNotifications(uid).slice(0, 25), callback);
  const q = query(collection(db, "users", uid, "notifications"), orderBy("at", "desc"), limit(25));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => d.data())));
}

// ---------- Cross-feature notification triggers ----------

export async function notifyStudentsOfClass(cls, action = "created") {
  const students = await getUsersByRole("student");
  if (!students.length || !cls) return;
  await sendNotificationsToMany(students.map((s) => s.uid), {
    type: "class",
    title: action === "created" ? `New class scheduled: ${cls.title}` : `Class updated: ${cls.title}`,
    text: `${cls.date} at ${cls.time} · ${cls.mentorName || "Mentor"}`,
    ref: { kind: "class", classId: cls.id }
  });
}

// ---------- Fee payment (manual UPI verification) ----------

export async function getPaymentQrcodes() {
  if (!isFirebaseConfigured) return demo.demoGetPaymentQrcodes();
  const snap = await getDocs(collection(db, "payment", "qrcodes"));
  const codes = {};
  snap.docs.forEach((d) => {
    codes[d.id] = d.data();
  });
  return codes;
}

export async function savePaymentQrcode(slot, dataUrl) {
  if (!isFirebaseConfigured) return demo.demoSavePaymentQrcode(slot, dataUrl);
  await setDoc(doc(db, "payment", "qrcodes", slot), {
    dataUrl,
    enabled: true,
    updatedAt: new Date().toISOString()
  });
}

export async function setPaymentQrcodeEnabled(slot, enabled) {
  if (!isFirebaseConfigured) return demo.demoSetPaymentQrcodeEnabled(slot, enabled);
  await updateDoc(doc(db, "payment", "qrcodes", slot), { enabled: Boolean(enabled) });
}
export async function savePaymentQrcodeUpi(slot, upiId) {
  if (!isFirebaseConfigured) return demo.demoSavePaymentQrcodeUpi(slot, upiId);
  await updateDoc(doc(db, "payment", "qrcodes", slot), { upiId: String(upiId || "").trim() });
}

export async function getPaymentSubmission(uid) {
  if (!isFirebaseConfigured) return demo.demoGetPaymentSubmission(uid);
  const snap = await getDoc(doc(db, "payment", "submissions", uid));
  return snap.exists() ? snap.data() : null;
}

function paymentSlotList(enabledSlots) {
  const slots = Array.isArray(enabledSlots)
    ? [...new Set(enabledSlots.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n > 0))]
    : [];
  return slots.sort((a, b) => a - b);
}

async function nextRotationValue(counterRef) {
  const snap = await getDoc(counterRef);
  const value = (snap.exists() ? Number(snap.data().value || 0) : 0) + 1;
  await setDoc(counterRef, { value, updatedAt: new Date().toISOString() });
  return value;
}

export async function createPaymentSubmission(student, enabledSlots) {
  if (!isFirebaseConfigured) return demo.demoCreatePaymentSubmission(student, enabledSlots);
  const slots = paymentSlotList(enabledSlots);
  const now = new Date().toISOString();
  const counterRef = doc(db, "payment", "counters", "rotation");
  let qrSlot = 0;
  if (slots.length > 0) {
    const value = await nextRotationValue(counterRef);
    qrSlot = slots[(value - 1) % slots.length];
  }
  const submission = {
    uid: student.uid,
    name: student.name || "",
    email: student.email || "",
    qrSlot,
    status: "pending",
    assignedAt: now
  };
  await setDoc(doc(db, "payment", "submissions", student.uid), submission);
  return submission;
}

export async function assignPaymentQrSlot(uid, enabledSlots) {
  if (!isFirebaseConfigured) return demo.demoAssignPaymentQrSlot(uid, enabledSlots);
  const slots = paymentSlotList(enabledSlots);
  if (slots.length === 0) return null;
  const counterRef = doc(db, "payment", "counters", "rotation");
  const value = await nextRotationValue(counterRef);
  const qrSlot = slots[(value - 1) % slots.length];
  const ref = doc(db, "payment", "submissions", uid);
  await updateDoc(ref, { qrSlot, assignedAt: new Date().toISOString() });
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function submitPaymentDetails(uid, { payerName, payerBank, transactionRef, proofUrl }) {
  if (!isFirebaseConfigured) {
    return demo.demoSubmitPaymentDetails(uid, { payerName, payerBank, transactionRef, proofUrl });
  }
  await updateDoc(doc(db, "payment", "submissions", uid), {
    payerName: String(payerName || "").trim(),
    payerBank: String(payerBank || "").trim(),
    transactionRef: String(transactionRef || "").trim(),
    proofUrl: String(proofUrl || ""),
    status: "submitted",
    submittedAt: new Date().toISOString()
  });
}

function sortSubmissions(items) {
  return items.sort((a, b) =>
    String(b.submittedAt || b.assignedAt || "").localeCompare(String(a.submittedAt || a.assignedAt || ""))
  );
}

export async function listPaymentSubmissions() {
  if (!isFirebaseConfigured) return demo.demoListPaymentSubmissions();
  const snap = await getDocs(collection(db, "payment", "submissions"));
  return sortSubmissions(snap.docs.map((d) => d.data()));
}

export async function getPaymentVerification(uid) {
  if (!isFirebaseConfigured) return demo.demoGetPaymentVerification(uid);
  const snap = await getDoc(doc(db, "payment", "verifications", uid));
  return snap.exists() ? snap.data() : null;
}

export async function verifyPayment(uid, verifiedBy) {
  if (!isFirebaseConfigured) return demo.demoVerifyPayment(uid, verifiedBy);
  await setDoc(doc(db, "payment", "verifications", uid), {
    verified: true,
    verifiedAt: new Date().toISOString(),
    verifiedBy: verifiedBy || "Admin"
  });
}

export function subscribePaymentSubmissions(callback) {
  if (!isFirebaseConfigured) {
    return demo.demoSubscribe(() => demo.demoListPaymentSubmissions(), callback);
  }
  return onSnapshot(collection(db, "payment", "submissions"), (snap) =>
    callback(sortSubmissions(snap.docs.map((d) => d.data())))
  );
}

export function subscribePaymentVerification(uid, callback) {
  if (!isFirebaseConfigured) {
    return demo.demoSubscribe(() => demo.demoGetPaymentVerification(uid), callback);
  }
  return onSnapshot(doc(db, "payment", "verifications", uid), (snap) =>
    callback(snap.exists() ? snap.data() : null)
  );
}
export async function getPaymentSettings() {
  if (!isFirebaseConfigured) return demo.demoGetPaymentSettings();
  const snap = await getDoc(doc(db, "payment", "settings"));
  return snap.exists() ? snap.data() : { accepting: true };
}

export async function setPaymentAccepting(accepting) {
  if (!isFirebaseConfigured) return demo.demoSetPaymentAccepting(accepting);
  await setDoc(doc(db, "payment", "settings"), {
    accepting: Boolean(accepting),
    updatedAt: new Date().toISOString()
  });
}

export function subscribePaymentSettings(callback) {
  if (!isFirebaseConfigured) {
    return demo.demoSubscribe(() => demo.demoGetPaymentSettings(), callback);
  }
  return onSnapshot(doc(db, "payment", "settings"), (snap) =>
    callback(snap.exists() ? snap.data() : { accepting: true })
  );
}