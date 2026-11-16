// Offline demo mode: mirrors the Firestore data model in localStorage so the
// entire portal can be exercised without Firebase credentials or internet.
// The data layer (src/data/auth.js + src/data/store.js) switches to this
// automatically whenever VITE_FIREBASE_* env vars are absent.
const KEYS = {
  users: "ip_demo_users",
  classes: "ip_demo_classes",
  approved: "ip_demo_approved_mentors",
  certificates: "ip_demo_certificates",
  counters: "ip_demo_counters",
  posts: "ip_demo_posts",
  replies: "ip_demo_replies",
  conversations: "ip_demo_conversations",
  messages: "ip_demo_messages",
  notifications: "ip_demo_notifications",
  paymentQrcodes: "ip_demo_payment_qrcodes",
  paymentCounter: "ip_demo_payment_counter",
  paymentSubmissions: "ip_demo_payment_submissions",
  paymentVerifications: "ip_demo_payment_verifications",
  paymentSettings: "ip_demo_payment_settings",
  session: "ip_demo_session",
  seeded: "ip_demo_seeded_v5"
};

let sessionListener = null;

let changeListeners = new Set();
let storageWatchStarted = false;

export function demoOnChange(callback) {
  changeListeners.add(callback);
  return () => changeListeners.delete(callback);
}

function emitChange() {
  changeListeners.forEach((callback) => {
    try {
      callback();
    } catch (err) {
      console.error("Demo change listener failed:", err);
    }
  });
}

function ensureStorageWatch() {
  if (storageWatchStarted || typeof window === "undefined") return;
  storageWatchStarted = true;
  window.addEventListener("storage", (event) => {
    if (event.key && String(event.key).startsWith("ip_demo_")) emitChange();
  });
}

export function demoSubscribe(produce, callback) {
  ensureStorageWatch();
  callback(produce());
  const handler = () => callback(produce());
  changeListeners.add(handler);
  return () => changeListeners.delete(handler);
}

function read(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  emitChange();
}

export function demoUid(prefix = "u") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function hashPassword(password) {
  if (globalThis.crypto && crypto.subtle) {
    const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  let hash = 2166136261;
  for (const ch of password) {
    hash ^= ch.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv-${(hash >>> 0).toString(16)}`;
}

function publicUser(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

export function demoOnSession(callback) {
  sessionListener = callback;
}

export function demoEmitSession() {
  if (sessionListener) sessionListener(demoCurrentUser());
}

function studentProfile({
  name,
  email,
  password,
  phone,
  dob,
  degree,
  branch,
  university,
  graduationYear,
  address,
  skills,
  registeredDaysAgo,
  offerDaysAgo = null,
  completedDaysAgo = null,
  certificateNumber = null
}) {
  const now = Date.now();
  const iso = (daysOffset) => new Date(now + daysOffset * 86400000).toISOString();
  const user = {
    uid: demoUid(),
    name,
    email,
    role: "student",
    passwordHash: null,
    phone,
    dob,
    degree,
    branch,
    university,
    graduationYear,
    address,
    skills,
    photoURL: null,
    createdAt: iso(-registeredDaysAgo)
  };
  if (offerDaysAgo === null) {
    user.offerLetter = null;
    user.internship = { status: "registered" };
  } else if (completedDaysAgo === null) {
    user.offerLetter = { number: `OFFER-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`, issuedAt: iso(-offerDaysAgo) };
    user.internship = { status: "in-progress" };
  } else {
    user.offerLetter = { number: `OFFER-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`, issuedAt: iso(-offerDaysAgo) };
    user.internship = {
      status: "completed",
      completedAt: iso(-completedDaysAgo),
      certificate: {
        number: certificateNumber || `CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        issuedAt: iso(-completedDaysAgo),
        issuerName: "Rahul Verma"
      }
    };
  }
  return [user, password];
}

export function demoSeed() {
  if (read(KEYS.seeded)) return Promise.resolve();
  const now = Date.now();
  const iso = (daysOffset) => new Date(now + daysOffset * 86400000).toISOString();
  const dateOnly = (daysOffset) => iso(daysOffset).slice(0, 10);

  const admin = {
    uid: demoUid(),
    name: "Portal Admin",
    email: "admin@demo.com",
    role: "admin",
    passwordHash: null,
    photoURL: null,
    createdAt: iso(-40)
  };
  const mentor = {
    uid: demoUid(),
    name: "Rahul Verma",
    email: "mentor@demo.com",
    role: "mentor",
    passwordHash: null,
    phone: "+91 98000 11111",
    photoURL: null,
    createdAt: iso(-38)
  };

  const [s1, p1] = studentProfile({
    name: "Ananya Singh",
    email: "student@demo.com",
    password: "Student@1234",
    phone: "+91 98123 45670",
    dob: "2003-04-18",
    degree: "B.Tech",
    branch: "Computer Science",
    university: "Delhi Technological University",
    graduationYear: "2026",
    address: "New Delhi, India",
    skills: "JavaScript, React, Python",
    registeredDaysAgo: 10,
    offerDaysAgo: 9
  });

  const [s2, p2] = studentProfile({
    name: "Vikram Patel",
    email: "vikram.patel@demo.com",
    password: "Vikram@1234",
    phone: "+91 98220 12345",
    dob: "2002-11-02",
    degree: "B.E",
    branch: "Information Technology",
    university: "Nirma University",
    graduationYear: "2026",
    address: "Ahmedabad, Gujarat",
    skills: "Java, SQL, Node.js",
    registeredDaysAgo: 20,
    offerDaysAgo: 19,
    completedDaysAgo: 1
  });

  const [s3, p3] = studentProfile({
    name: "Meera Krishnan",
    email: "meera.krishnan@demo.com",
    password: "Meera@1234",
    phone: "+91 99440 22110",
    dob: "2003-08-25",
    degree: "B.Tech",
    branch: "Computer Science",
    university: "Anna University",
    graduationYear: "2026",
    address: "Chennai, Tamil Nadu",
    skills: "Python, Data Structures, MySQL",
    registeredDaysAgo: 14,
    offerDaysAgo: 13
  });

  const [s4, p4] = studentProfile({
    name: "Arjun Mehta",
    email: "arjun.mehta@demo.com",
    password: "Arjun@1234",
    phone: "+91 97650 88990",
    dob: "2002-06-14",
    degree: "MCA",
    branch: "Software Engineering",
    university: "Symbiosis Institute of Technology",
    graduationYear: "2026",
    address: "Pune, Maharashtra",
    skills: "React, Firebase, UI Design",
    registeredDaysAgo: 12,
    offerDaysAgo: 11
  });

  const [s5, p5] = studentProfile({
    name: "Sara Khan",
    email: "sara.khan@demo.com",
    password: "Sara@1234",
    phone: "+91 90070 45678",
    dob: "2004-01-30",
    degree: "",
    branch: "",
    university: "",
    graduationYear: "",
    address: "",
    skills: "",
    registeredDaysAgo: 1,
    offerDaysAgo: null
  });

  const [s6, p6] = studentProfile({
    name: "David Fernandes",
    email: "david.fernandes@demo.com",
    password: "David@1234",
    phone: "+91 98200 33445",
    dob: "2003-02-09",
    degree: "BBA",
    branch: "Business Analytics",
    university: "Xavier Institute, Mumbai",
    graduationYear: "2026",
    address: "Mumbai, Maharashtra",
    skills: "Excel, Power BI, Presentation",
    registeredDaysAgo: 22,
    offerDaysAgo: 21,
    completedDaysAgo: 4
  });

  const [s7, p7] = studentProfile({
    name: "Priya Nair",
    email: "priya.nair@demo.com",
    password: "Priya@1234",
    phone: "+91 96330 77889",
    dob: "2003-12-19",
    degree: "B.Sc",
    branch: "Computer Science",
    university: "MKPU Ernakulam",
    graduationYear: "2026",
    address: "Kochi, Kerala",
    skills: "C++, Algorithms, Git",
    registeredDaysAgo: 8,
    offerDaysAgo: 7
  });

  const all = [
    [admin, "Admin@1234"],
    [mentor, "Mentor@1234"],
    [s1, p1],
    [s2, p2],
    [s3, p3],
    [s4, p4],
    [s5, p5],
    [s6, p6],
    [s7, p7]
  ];

  return Promise.resolve()
    .then(async () => {
      const users = [];
      for (const [record, password] of all) {
        record.passwordHash = await hashPassword(password);
        users.push(record);
      }
      write(KEYS.users, users);
      write(KEYS.classes, [
        {
          id: demoUid("c"),
          title: "React Fundamentals - Week 1",
          description: "Components, props and state management.",
          date: dateOnly(-7),
          time: "10:00",
          mentorUid: mentor.uid,
          mentorName: mentor.name,
          meetUrl: "https://meet.google.com/abc-defg-hij",
          status: "completed",
          createdAt: iso(-12)
        },
        {
          id: demoUid("c"),
          title: "Git & GitHub for Teams",
          description: "Branching, pull requests and code review basics.",
          date: dateOnly(1),
          time: "11:00",
          mentorUid: mentor.uid,
          mentorName: mentor.name,
          meetUrl: "https://meet.google.com/git-teams-2026",
          status: "scheduled",
          createdAt: iso(-6)
        },
        {
          id: demoUid("c"),
          title: "Data Structures Bootcamp",
          description: "Arrays, stacks and problem solving patterns.",
          date: dateOnly(2),
          time: "14:00",
          mentorUid: mentor.uid,
          mentorName: mentor.name,
          meetUrl: "https://meet.google.com/xyz-1234-abcd",
          status: "scheduled",
          createdAt: iso(-5)
        },
        {
          id: demoUid("c"),
          title: "Mock Interview Session",
          description: "Technical round simulation with feedback.",
          date: dateOnly(-2),
          time: "16:00",
          mentorUid: mentor.uid,
          mentorName: mentor.name,
          meetUrl: "https://meet.google.com/mock-int-7788",
          status: "cancelled",
          createdAt: iso(-9)
        },
        {
          id: demoUid("c"),
          title: "Project Workshop - REST APIs",
          description: "Design and expose a simple REST API end to end.",
          date: dateOnly(6),
          time: "11:30",
          mentorUid: mentor.uid,
          mentorName: mentor.name,
          meetUrl: "https://meet.google.com/proj-workshop-99",
          status: "scheduled",
          createdAt: iso(-3)
        },
        {
          id: demoUid("c"),
          title: "Git & CI Basics for Students",
          description: "Push to main safely: actions and protected branches.",
          date: dateOnly(9),
          time: "15:00",
          mentorUid: mentor.uid,
          mentorName: mentor.name,
          meetUrl: "https://meet.google.com/ci-basics-2026",
          status: "scheduled",
          createdAt: iso(-1)
        }
      ]);
      write(KEYS.approved, [{ email: mentor.email, name: mentor.name, approvedAt: iso(-38) }]);
      write(
        KEYS.certificates,
        [s2, s6]
          .filter((s) => s.internship && s.internship.certificate)
          .map((s) => ({
            number: s.internship.certificate.number,
            studentName: s.name,
            program: `Summer Internship Program ${new Date().getFullYear()}`,
            completedAt: s.internship.completedAt,
            issuedAt: s.internship.certificate.issuedAt,
            issuerName: s.internship.certificate.issuerName,
            status: "issued"
          }))
      );
      const post1 = {
        id: demoUid("post"),
        title: "How are you all preparing for the final review?",
        body: "My project is a small library REST API. The basics work but I am stuck on error handling. What approach worked best for your final review?",
        authorUid: s1.uid,
        authorName: s1.name,
        authorRole: "student",
        createdAt: iso(-2)
      };
      const post2 = {
        id: demoUid("post"),
        title: "Tips for the first week?",
        body: "Just registered and a little nervous about the live Google Meet sessions. Anything that helped you in the first few days?",
        authorUid: s3.uid,
        authorName: s3.name,
        authorRole: "student",
        createdAt: iso(-1)
      };
      write(KEYS.posts, [post1, post2]);
      write(KEYS.replies, {
        [post1.id]: [
          {
            id: demoUid("reply"),
            body: "I kept a shared doc of questions and raised them in the next Meet session. The mentor cleared most of them on the spot.",
            authorUid: s2.uid,
            authorName: s2.name,
            authorRole: "student",
            createdAt: iso(-2)
          },
          {
            id: demoUid("reply"),
            body: "Wrap your handlers so every route returns one consistent JSON error shape. Happy to review your code in the next session.",
            authorUid: mentor.uid,
            authorName: mentor.name,
            authorRole: "mentor",
            createdAt: iso(-1)
          }
        ]
      });
      const seedConvId = `u_${[s1.uid, mentor.uid].sort().join("__")}`;
      write(KEYS.conversations, [
        {
          id: seedConvId,
          participants: [s1.uid, mentor.uid],
          participantNames: { [s1.uid]: s1.name, [mentor.uid]: mentor.name },
          participantRoles: { [s1.uid]: "student", [mentor.uid]: "mentor" },
          lastMessage: { text: "See you in tomorrow's session. Bring your questions!", fromUid: mentor.uid, at: iso(0) },
          unread: { [s1.uid]: 1, [mentor.uid]: 0 },
          createdAt: iso(-1)
        }
      ]);
      write(KEYS.messages, {
        [seedConvId]: [
          { id: demoUid("msg"), convId: seedConvId, fromUid: s1.uid, fromName: s1.name, body: "Hi Rahul, could you guide me on the error handling part of my project?", at: iso(-1) },
          { id: demoUid("msg"), convId: seedConvId, fromUid: mentor.uid, fromName: mentor.name, body: "Sure - share your project details and I will take a look.", at: iso(0) },
          { id: demoUid("msg"), convId: seedConvId, fromUid: mentor.uid, fromName: mentor.name, body: "See you in tomorrow's session. Bring your questions!", at: iso(0) }
        ]
      });
      write(KEYS.notifications, {
        [s1.uid]: [
          { id: demoUid("n"), type: "chat", title: `New message from ${mentor.name}`, text: "See you in tomorrow's session. Bring your questions!", ref: { kind: "chat", convId: seedConvId }, fromUid: mentor.uid, read: false, at: iso(0) },
          { id: demoUid("n"), type: "class", title: "New class scheduled: Git & CI Basics for Students", text: `${dateOnly(9)} at 15:00 · ${mentor.name}`, ref: { kind: "class", classId: "seed-git-ci" }, fromUid: null, read: true, at: iso(-1) }
        ],
        [mentor.uid]: [
          { id: demoUid("n"), type: "chat", title: `New message from ${s1.name}`, text: "Hi Rahul, could you guide me on the error handling part of my project?", ref: { kind: "chat", convId: seedConvId }, fromUid: s1.uid, read: false, at: iso(-1) }
        ]
      });
      write(KEYS.paymentQrcodes, {
        "qr-1": { dataUrl: demoQrPlaceholder("Demo QR 1"), upiId: "demo1@okaxis", enabled: true, updatedAt: iso(-2) },
        "qr-2": { dataUrl: demoQrPlaceholder("Demo QR 2"), upiId: "demo2@okaxis", enabled: true, updatedAt: iso(-2) },
        "qr-3": { dataUrl: demoQrPlaceholder("Demo QR 3"), upiId: "demo3@okaxis", enabled: false, updatedAt: iso(-2) }
      });
      write(KEYS.paymentCounter, { value: 3, updatedAt: iso(-2) });
      write(KEYS.paymentSubmissions, {
        [s3.uid]: {
          uid: s3.uid,
          name: s3.name,
          email: s3.email,
          qrSlot: 3,
          status: "submitted",
          assignedAt: iso(-2),
          payerName: "Krishnan R",
          payerBank: "HDFC Bank",
          transactionRef: "4821",
          submittedAt: iso(-1)
        }
      });
      write(KEYS.paymentVerifications, {});
      write(KEYS.paymentSettings, { accepting: true, updatedAt: iso(-2) });
      write(KEYS.seeded, true);
    });
}

export function demoCurrentUser() {
  const session = read(KEYS.session);
  if (!session) return null;
  const user = read(KEYS.users, []).find((u) => u.uid === session.uid);
  return user ? publicUser(user) : null;
}

export async function demoSignIn({ email, password }) {
  await demoSeed();
  const users = read(KEYS.users, []);
  const user = users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user || user.passwordHash !== (await hashPassword(password))) {
    throw new Error("Invalid email or password.");
  }
  write(KEYS.session, { uid: user.uid });
  return publicUser(user);
}

export async function demoSignUp({ name, email, password, role }) {
  await demoSeed();
  const users = read(KEYS.users, []);
  if (users.some((u) => u.email.toLowerCase() === String(email).toLowerCase())) {
    const err = new Error("An account with this email already exists.");
    err.code = "auth/email-already-in-use";
    throw err;
  }
  const user = {
    uid: demoUid(),
    name,
    email,
    role,
    passwordHash: await hashPassword(password),
    photoURL: null,
    createdAt: new Date().toISOString()
  };
  if (role === "student") {
    user.offerLetter = null;
    user.internship = { status: "registered" };
  }
  users.push(user);
  write(KEYS.users, users);
  write(KEYS.session, { uid: user.uid });
  return publicUser(user);
}

export function demoSignOut() {
  localStorage.removeItem(KEYS.session);
}

export function demoGetUser(uid) {
  const user = read(KEYS.users, []).find((u) => u.uid === uid);
  return user ? publicUser(user) : null;
}

export function demoUpdateUser(uid, patch) {
  const users = read(KEYS.users, []);
  const index = users.findIndex((u) => u.uid === uid);
  if (index === -1) throw new Error("User not found.");
  users[index] = { ...users[index], ...patch };
  write(KEYS.users, users);
  return publicUser(users[index]);
}

export function demoGetAllUsers() {
  return read(KEYS.users, []).map(publicUser);
}

export function demoGetClasses() {
  return read(KEYS.classes, []);
}

export function demoSaveClass(data) {
  const classes = read(KEYS.classes, []);
  const record = { ...data, createdAt: new Date().toISOString() };
  classes.push(record);
  write(KEYS.classes, classes);
  return record;
}

export function demoUpdateClass(id, patch) {
  const classes = read(KEYS.classes, []);
  const index = classes.findIndex((c) => c.id === id);
  if (index === -1) throw new Error("Class not found.");
  classes[index] = { ...classes[index], ...patch };
  write(KEYS.classes, classes);
  return classes[index];
}

export function demoDeleteClass(id) {
  write(KEYS.classes, read(KEYS.classes, []).filter((c) => c.id !== id));
}

export function demoGetAllApproved() {
  return read(KEYS.approved, []);
}

export function demoSaveApprovedMentor(entry) {
  const list = read(KEYS.approved, []).filter(
    (m) => m.email.toLowerCase() !== entry.email.toLowerCase()
  );
  list.push(entry);
  write(KEYS.approved, list);
  return entry;
}

export function demoDeleteApprovedMentor(email) {
  write(
    KEYS.approved,
    read(KEYS.approved, []).filter((m) => m.email.toLowerCase() !== String(email).toLowerCase())
  );
}

export function demoGetCertificate(number) {
  const norm = String(number || "").trim().toUpperCase();
  return read(KEYS.certificates, []).find((c) => c.number === norm) || null;
}

export function demoSaveCertificate(entry) {
  const list = read(KEYS.certificates, []).filter((c) => c.number !== entry.number);
  list.push(entry);
  write(KEYS.certificates, list);
  return entry;
}

export function demoRevokeCertificate(number) {
  const list = read(KEYS.certificates, []);
  const index = list.findIndex((c) => c.number === number);
  if (index === -1) return null;
  list[index] = { ...list[index], status: "revoked", revokedAt: new Date().toISOString() };
  write(KEYS.certificates, list);
  return list[index];
}

export function demoNextCertificateNumber() {
  const year = new Date().getFullYear();
  const key = `cert-${year}`;
  const counters = read(KEYS.counters, {});
  const existing = new Set(read(KEYS.certificates, []).map((c) => c.number));
  let serial = (counters[key] || 0) + 1;
  while (existing.has(`CERT-${year}-${String(serial).padStart(4, "0")}`)) serial++;
  counters[key] = serial;
  write(KEYS.counters, counters);
  return `CERT-${year}-${String(serial).padStart(4, "0")}`;
}
export function demoListPosts() {
  return read(KEYS.posts, [])
    .slice()
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export function demoSavePost(post) {
  const posts = read(KEYS.posts, []);
  posts.push(post);
  write(KEYS.posts, posts);
  return post;
}

export function demoGetPost(postId) {
  return read(KEYS.posts, []).find((post) => post.id === postId) || null;
}

export function demoListReplies(postId) {
  const all = read(KEYS.replies, {});
  return (all[postId] || [])
    .slice()
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
}

export function demoSaveReply(postId, reply) {
  const all = read(KEYS.replies, {});
  const list = all[postId] || [];
  list.push(reply);
  all[postId] = list;
  write(KEYS.replies, all);
  return reply;
}

export function demoListConversations(uid) {
  return read(KEYS.conversations, [])
    .filter((conv) => (conv.participants || []).includes(uid))
    .sort((a, b) =>
      String(b.lastMessage?.at || b.createdAt || "").localeCompare(String(a.lastMessage?.at || a.createdAt || ""))
    );
}

export function demoGetConversation(id) {
  return read(KEYS.conversations, []).find((conv) => conv.id === id) || null;
}

export function demoUpsertConversation(conv) {
  const list = read(KEYS.conversations, []);
  const index = list.findIndex((item) => item.id === conv.id);
  if (index >= 0) list[index] = { ...list[index], ...conv };
  else list.push(conv);
  write(KEYS.conversations, list);
  return conv;
}

export function demoUpdateConversation(id, patch) {
  const list = read(KEYS.conversations, []);
  const index = list.findIndex((conv) => conv.id === id);
  if (index < 0) return null;
  list[index] = { ...list[index], ...patch };
  write(KEYS.conversations, list);
  return list[index];
}

export function demoListMessages(convId) {
  const all = read(KEYS.messages, {});
  return (all[convId] || [])
    .slice()
    .sort((a, b) => String(a.at).localeCompare(String(b.at)));
}

export function demoAddMessage(convId, message) {
  const all = read(KEYS.messages, {});
  const list = all[convId] || [];
  list.push(message);
  all[convId] = list;
  write(KEYS.messages, all);
  return message;
}

export function demoListNotifications(uid) {
  const all = read(KEYS.notifications, {});
  return (all[uid] || [])
    .slice()
    .sort((a, b) => String(b.at).localeCompare(String(a.at)));
}

export function demoAddNotification(uid, notification) {
  const all = read(KEYS.notifications, {});
  const list = all[uid] || [];
  list.push(notification);
  all[uid] = list;
  write(KEYS.notifications, all);
  return notification;
}

export function demoMarkNotificationRead(uid, id) {
  const all = read(KEYS.notifications, {});
  const list = all[uid] || [];
  all[uid] = list.map((n) => (n.id === id ? { ...n, read: true } : n));
  write(KEYS.notifications, all);
}

export function demoMarkAllNotificationsRead(uid) {
  const all = read(KEYS.notifications, {});
  const list = all[uid] || [];
  all[uid] = list.map((n) => ({ ...n, read: true }));
  write(KEYS.notifications, all);
}

function demoQrPlaceholder(label) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#ffffff"/><rect x="12" y="12" width="56" height="56" fill="#0f172a"/><rect x="132" y="12" width="56" height="56" fill="#0f172a"/><rect x="12" y="132" width="56" height="56" fill="#0f172a"/><rect x="26" y="26" width="28" height="28" fill="#ffffff"/><rect x="146" y="26" width="28" height="28" fill="#ffffff"/><rect x="26" y="146" width="28" height="28" fill="#ffffff"/><text x="100" y="112" font-family="Arial, sans-serif" font-size="17" font-weight="bold" text-anchor="middle" fill="#0f172a">${label}</text></svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

export function demoGetPaymentQrcodes() {
  return read(KEYS.paymentQrcodes, {});
}

export function demoSavePaymentQrcode(slot, dataUrl) {
  const all = read(KEYS.paymentQrcodes, {});
  all[slot] = { dataUrl, enabled: true, updatedAt: new Date().toISOString() };
  write(KEYS.paymentQrcodes, all);
}

export function demoSetPaymentQrcodeEnabled(slot, enabled) {
  const all = read(KEYS.paymentQrcodes, {});
  if (!all[slot]) return;
  all[slot] = { ...all[slot], enabled: Boolean(enabled) };
  write(KEYS.paymentQrcodes, all);
}
export function demoSavePaymentQrcodeUpi(slot, upiId) {
  const all = read(KEYS.paymentQrcodes, {});
  if (!all[slot]) return;
  all[slot] = { ...all[slot], upiId: String(upiId || "").trim() };
  write(KEYS.paymentQrcodes, all);
}

export function demoGetPaymentSubmission(uid) {
  return read(KEYS.paymentSubmissions, {})[uid] || null;
}

function demoSlotList(enabledSlots) {
  const slots = Array.isArray(enabledSlots)
    ? [...new Set(enabledSlots.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n > 0))]
    : [];
  return slots.sort((a, b) => a - b);
}

function demoNextRotation() {
  const counter = read(KEYS.paymentCounter, { value: 0 });
  const value = (Number(counter.value) || 0) + 1;
  write(KEYS.paymentCounter, { value, updatedAt: new Date().toISOString() });
  return value;
}

export function demoCreatePaymentSubmission(student, enabledSlots) {
  const all = read(KEYS.paymentSubmissions, {});
  if (all[student.uid]) return all[student.uid];
  const slots = demoSlotList(enabledSlots);
  let qrSlot = 0;
  if (slots.length > 0) {
    const value = demoNextRotation();
    qrSlot = slots[(value - 1) % slots.length];
  }
  const submission = {
    uid: student.uid,
    name: student.name || "",
    email: student.email || "",
    qrSlot,
    status: "pending",
    assignedAt: new Date().toISOString()
  };
  all[student.uid] = submission;
  write(KEYS.paymentSubmissions, all);
  return submission;
}

export function demoAssignPaymentQrSlot(uid, enabledSlots) {
  const all = read(KEYS.paymentSubmissions, {});
  if (!all[uid]) return null;
  const slots = demoSlotList(enabledSlots);
  if (slots.length === 0) return null;
  const value = demoNextRotation();
  all[uid] = { ...all[uid], qrSlot: slots[(value - 1) % slots.length], assignedAt: new Date().toISOString() };
  write(KEYS.paymentSubmissions, all);
  return all[uid];
}

export function demoSubmitPaymentDetails(uid, { payerName, payerBank, transactionRef, proofUrl }) {
  const all = read(KEYS.paymentSubmissions, {});
  if (!all[uid]) return null;
  all[uid] = {
    ...all[uid],
    payerName: String(payerName || "").trim(),
    payerBank: String(payerBank || "").trim(),
    transactionRef: String(transactionRef || "").trim(),
    proofUrl: String(proofUrl || ""),
    status: "submitted",
    submittedAt: new Date().toISOString()
  };
  write(KEYS.paymentSubmissions, all);
  return all[uid];
}

export function demoListPaymentSubmissions() {
  return Object.values(read(KEYS.paymentSubmissions, {}))
    .sort((a, b) =>
      String(b.submittedAt || b.assignedAt || "").localeCompare(String(a.submittedAt || a.assignedAt || ""))
    );
}

export function demoGetPaymentVerification(uid) {
  return read(KEYS.paymentVerifications, {})[uid] || null;
}

export function demoVerifyPayment(uid, verifiedBy) {
  const all = read(KEYS.paymentVerifications, {});
  all[uid] = {
    verified: true,
    verifiedAt: new Date().toISOString(),
    verifiedBy: verifiedBy || "Admin"
  };
  write(KEYS.paymentVerifications, all);
}

export function demoGetPaymentSettings() {
  return read(KEYS.paymentSettings, { accepting: true });
}

export function demoSetPaymentAccepting(accepting) {
  write(KEYS.paymentSettings, { accepting: Boolean(accepting), updatedAt: new Date().toISOString() });
}

export function demoReset() {
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
}