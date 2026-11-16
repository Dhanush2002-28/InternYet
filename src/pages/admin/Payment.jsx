import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getPaymentQrcodes,
  getPaymentVerification,
  savePaymentQrcode,
  savePaymentQrcodeUpi,
  setPaymentAccepting,
  setPaymentQrcodeEnabled,
  subscribePaymentSettings,
  subscribePaymentSubmissions,
  verifyPayment
} from "../../data/store";
import EmptyState from "../../components/EmptyState";
import { sendPaymentConfirmationEmail } from "../../services/emailService";
import { FullPageLoader } from "../../components/FullPageLoader";
import { formatDate, initials } from "../../utils/format";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_QR_SIDE = 512;

function slotNumber(slotId) {
  return String(slotId).replace("qr-", "");
}

async function readImageAsDataUrl(file, maxSide) {
  const rawUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
  const image = await new Promise((resolve, reject) => {
    const el = new Image();
    el.onerror = () => reject(new Error("decode failed"));
    el.onload = () => resolve(el);
    el.src = rawUrl;
  });
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/png");
}

export default function AdminPayment() {
  const { profile } = useAuth();
  const [qrcodes, setQrcodes] = useState(null);
  const [settings, setSettings] = useState(null);
  const [newFile, setNewFile] = useState("");
  const [busy, setBusy] = useState(false);
  const [qrError, setQrError] = useState("");
  const [upiEdits, setUpiEdits] = useState({});
  const [submissions, setSubmissions] = useState(null);
  const [verifications, setVerifications] = useState({});
  const [verifyingUid, setVerifyingUid] = useState(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    getPaymentQrcodes()
      .then((codes) => {
        if (active) setQrcodes(codes);
      })
      .catch(() => {
        if (active) setQrcodes({});
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return subscribePaymentSettings(setSettings);
  }, []);
  useEffect(() => {
    if (!qrcodes) return undefined;
    setUpiEdits((prev) => {
      const next = { ...prev };
      Object.keys(qrcodes).forEach((id) => {
        if (!(id in next)) next[id] = qrcodes[id].upiId || "";
      });
      return next;
    });
  }, [qrcodes]);

  useEffect(() => {
    return subscribePaymentSubmissions((items) => setSubmissions(items));
  }, []);

  async function loadVerifications(subs) {
    const items = await Promise.all(
      subs.map((sub) => getPaymentVerification(sub.uid).catch(() => null))
    );
    const map = {};
    items.forEach((ver, index) => {
      if (ver && subs[index]) map[subs[index].uid] = ver;
    });
    return map;
  }

  useEffect(() => {
    if (!submissions) return undefined;
    let active = true;
    loadVerifications(submissions).then((map) => {
      if (active) setVerifications(map);
    });
    return () => {
      active = false;
    };
  }, [submissions]);

  function refreshQrcodes() {
    return getPaymentQrcodes().then(setQrcodes).catch(() => {});
  }

  function handleAddFile(event) {
    const file = event.target.files && event.target.files[0];
    event.target.value = "";
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setQrError("Please upload a PNG, JPEG or WebP image.");
      return;
    }
    setQrError("");
    readImageAsDataUrl(file, MAX_QR_SIDE)
      .then(setNewFile)
      .catch(() => setQrError("Could not read that image. Please try a different file."));
  }

  async function handleAddQr() {
    if (!newFile) return;
    setBusy(true);
    setQrError("");
    try {
      const numbers = Object.keys(qrcodes || {})
        .map((id) => Number(String(id).replace("qr-", "")))
        .filter(Number.isInteger);
      const next = (numbers.length ? Math.max(...numbers) : 0) + 1;
      await savePaymentQrcode(`qr-${next}`, newFile);
      setNewFile("");
      await refreshQrcodes();
    } catch (err) {
      console.error(err);
      setQrError("Could not save the QR code. Please try again.");
    }
    setBusy(false);
  }

  async function handleToggleQr(slotId, enabled) {
    setBusy(true);
    setQrError("");
    try {
      await setPaymentQrcodeEnabled(slotId, enabled);
      await refreshQrcodes();
    } catch (err) {
      console.error(err);
      setQrError("Could not update the QR code. Please try again.");
    }
    setBusy(false);
  }

  async function handleSaveUpi(slotId) {
    setBusy(true);
    setQrError("");
    try {
      await savePaymentQrcodeUpi(slotId, upiEdits[slotId] || "");
      await refreshQrcodes();
    } catch (err) {
      console.error(err);
      setQrError("Could not save the UPI ID. Please try again.");
    }
    setBusy(false);
  }

  async function handleToggleAccepting() {
    const accepting = settings?.accepting !== false;
    if (accepting && !window.confirm("Stop accepting payments? Students will no longer see QR codes or be able to submit payment details.")) {
      return;
    }
    if (!accepting && !window.confirm("Resume accepting payments?")) return;
    setBusy(true);
    try {
      await setPaymentAccepting(!accepting);
    } catch (err) {
      console.error(err);
      window.alert("Could not update payment status. Please try again.");
    }
    setBusy(false);
  }

  async function handleVerify(sub) {
    if (!window.confirm(`Mark ${sub.name || sub.email || "this student"}'s payment as verified?`)) {
      return;
    }
    setVerifyingUid(sub.uid);
    try {
      await verifyPayment(sub.uid, profile?.name || "Admin");
      const fresh = await loadVerifications(submissions || []);
      setVerifications(fresh);
      try {
        const result = await sendPaymentConfirmationEmail(
          { name: sub.name, email: sub.email },
          sub,
          fresh[sub.uid]
        );
        setNotice(
          result?.skipped
            ? "Payment verified. (Emails are not configured yet, so nothing was sent.)"
            : "Payment verified. Confirmation email sent to the student."
        );
      } catch (emailErr) {
        console.error(emailErr);
        setNotice("Payment verified. The confirmation email could not be sent.");
      }
    } catch (err) {
      console.error(err);
      window.alert("Could not mark as verified. Please try again.");
    }
    setVerifyingUid(null);
  }

  if (qrcodes === null || submissions === null) return <FullPageLoader label="Loading payments…" />;

  const accepting = settings?.accepting !== false;
  const qrList = Object.keys(qrcodes)
    .filter((id) => String(id).startsWith("qr-"))
    .sort((a, b) => Number(slotNumber(a)) - Number(slotNumber(b)));
  const activeCount = qrList.filter((id) => qrcodes[id].enabled !== false).length;
  const submittedCount = submissions.filter((sub) => sub.status === "submitted").length;
  const verifiedCount = Object.keys(verifications).length;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Fee payments</h1>
          <p className="page-sub">
            {qrList.length} QR code{qrList.length === 1 ? "" : "s"} ({activeCount} active) ·{" "}
            {submissions.length} student{submissions.length === 1 ? "" : "s"} on payment tracking ·{" "}
            {submittedCount} awaiting verification · {verifiedCount} verified
          </p>
        </div>
      </div>

      <div className={`card pay-status-card${accepting ? "" : " pay-paused"}`}>
        <div>
          <p className="card-title">Payment status: {accepting ? "Open" : "Paused"}</p>
          <p className="hint">
            {accepting
              ? "Students can view their QR and submit payment details."
              : "Payments are stopped. Students see a paused notice, new QR assignments are blocked, and new payment details cannot be submitted."}
          </p>
        </div>
        <button
          type="button"
          className={`btn ${accepting ? "btn-ghost" : "btn-primary"} btn-sm`}
          disabled={busy}
          onClick={handleToggleAccepting}
        >
          {accepting ? "Stop accepting payments" : "Resume payments"}
        </button>
      </div>

      {qrError && <div className="notice notice-error">{qrError}</div>}
      {notice && <div className="notice notice-success">{notice}</div>}

      <div className="card">
        <p className="card-title">UPI QR codes</p>
        <p className="hint">
          Students are assigned an active QR deterministically from the available pool. Add as many as you need — images
          are resized automatically. Disabling a QR removes it from the rotation; students already
          assigned to it can still see and pay it.
        </p>
        <div className="pay-qr-grid">
          {qrList.map((slotId) => {
            const qr = qrcodes[slotId];
            const enabled = qr.enabled !== false;
            return (
              <div className="pay-qr-slot" key={slotId}>
                <div className="pay-qr-slot-label">
                  <span className="badge badge-blue">QR-{slotNumber(slotId)}</span>
                  {enabled ? (
                    <span className="badge badge-green">Active</span>
                  ) : (
                    <span className="badge badge-gray">Disabled</span>
                  )}
                </div>
                {qr.dataUrl ? (
                  <img
                    className="pay-qr-thumb"
                    src={qr.dataUrl}
                    alt={`UPI QR code ${slotNumber(slotId)}`}
                  />
                ) : (
                  <div className="pay-qr-empty">No image</div>
                )}
                <div className="pay-qr-upi">
                  <input
                    className="input"
                    value={upiEdits[slotId] || ""}
                    onChange={(e) => setUpiEdits((prev) => ({ ...prev, [slotId]: e.target.value }))}
                    placeholder="UPI ID (e.g. name@okhdfcbank)"
                  />
                  <div className="pay-qr-actions">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      disabled={busy}
                      onClick={() => handleSaveUpi(slotId)}
                    >
                      Save UPI ID
                    </button>
                    <button
                      type="button"
                      className={`btn ${enabled ? "btn-ghost" : "btn-primary"} btn-sm`}
                      disabled={busy}
                      onClick={() => handleToggleQr(slotId, !enabled)}
                    >
                      {enabled ? "Disable" : "Enable"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          <div className="pay-qr-slot pay-qr-add">
            <div className="pay-qr-slot-label">
              <span className="badge badge-gray">Add QR code</span>
            </div>
            {newFile ? (
              <img className="pay-qr-thumb" src={newFile} alt="New QR preview" />
            ) : (
              <div className="pay-qr-empty">New slot</div>
            )}
            <label className="pay-qr-file">
              <span>Choose image (any size)</span>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAddFile} />
            </label>
            {newFile && (
              <div className="pay-qr-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={busy}
                  onClick={handleAddQr}
                >
                  {busy ? "Saving…" : "Add QR"}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={busy}
                  onClick={() => setNewFile("")}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card table-card">
        <p className="card-title">Student submissions</p>
        {submissions.length === 0 ? (
          <EmptyState
            title="No submissions yet"
            hint="Students appear here as soon as they open the Payment page."
          />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>QR used</th>
                <th>Paid from</th>
                <th>Transaction ID</th>
                <th>Proof</th>
                <th>Submitted</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => {
                const ver = verifications[sub.uid];
                return (
                  <tr key={sub.uid}>
                    <td>
                      <div className="cell-name">
                        <span className="avatar sm">{initials(sub.name)}</span>
                        <div>
                          <div>{sub.name || "—"}</div>
                          <div className="cell-sub">{sub.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {sub.qrSlot ? (
                        <span className="badge badge-blue">QR-{sub.qrSlot}</span>
                      ) : (
                        <span className="badge badge-gray">Not assigned</span>
                      )}
                    </td>
                    <td>
                      {sub.status === "submitted" ? (
                        <div>
                          <div>{sub.payerName}</div>
                          <div className="cell-sub">{sub.payerBank}</div>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{sub.status === "submitted" ? sub.transactionRef : "—"}</td>
                    <td>
                      {sub.proofUrl ? (
                        <div className="cell-proof">
                          <img className="pay-proof-thumb" src={sub.proofUrl} alt="Payment proof" />
                          <a
                            className="link-plain"
                            href={sub.proofUrl}
                            download={`payment-proof-${String(sub.name || sub.uid).replace(/\s+/g, "-").toLowerCase()}`}
                          >
                            View
                          </a>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{sub.submittedAt ? formatDate(sub.submittedAt) : "—"}</td>
                    <td>
                      {ver ? (
                        <span className="badge badge-green">Verified</span>
                      ) : sub.status === "submitted" ? (
                        <span className="badge badge-amber">Awaiting verification</span>
                      ) : (
                        <span className="badge badge-gray">QR assigned</span>
                      )}
                    </td>
                    <td>
                      {ver ? (
                        <span className="cell-sub">
                          {ver.verifiedBy} · {formatDate(ver.verifiedAt)}
                        </span>
                      ) : sub.status === "submitted" ? (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={verifyingUid === sub.uid}
                          onClick={() => handleVerify(sub)}
                        >
                          {verifyingUid === sub.uid ? "Verifying…" : "Mark verified"}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}