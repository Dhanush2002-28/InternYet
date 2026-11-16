import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { organization } from "../../config/organization";
import {
  assignPaymentQrSlot,
  createPaymentSubmission,
  getPaymentQrcodes,
  getPaymentSubmission,
  submitPaymentDetails,
  subscribePaymentSettings,
  subscribePaymentVerification
} from "../../data/store";
import EmptyState from "../../components/EmptyState";
import { FullPageLoader } from "../../components/FullPageLoader";
import { formatDate } from "../../utils/format";
import { isNonEmpty } from "../../utils/validators";

async function readProofImage(file, maxSide = 1280) {
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
  return canvas.toDataURL("image/jpeg", 0.72);
}

export default function StudentPayment() {
  const { profile } = useAuth();
  const [qrCodes, setQrCodes] = useState(null);
  const [settings, setSettings] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [verification, setVerification] = useState(null);
  const [view, setView] = useState(null);
  const [payerName, setPayerName] = useState("");
  const [payerBank, setPayerBank] = useState("");
  const [transactionRef, setTransactionRef] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return subscribePaymentSettings(setSettings);
  }, []);

  useEffect(() => {
    if (!profile?.uid) return undefined;
    let active = true;
    (async () => {
      try {
        const codes = await getPaymentQrcodes().catch(() => ({}));
        if (!active) return;
        setQrCodes(codes);
        const enabledSlots = Object.keys(codes)
          .filter((id) => codes[id] && codes[id].enabled !== false)
          .map((id) => Number(String(id).replace("qr-", "")));
        const existing = await getPaymentSubmission(profile.uid);
        if (!active) return;
        if (existing && existing.qrSlot) {
          setSubmission(existing);
          return;
        }
        const next = existing
          ? await assignPaymentQrSlot(profile.uid, enabledSlots)
          : await createPaymentSubmission(profile, enabledSlots);
        if (active) setSubmission(next || existing || null);
      } catch (err) {
        console.error(err);
      }
    })();
    return () => {
      active = false;
    };
  }, [profile?.uid]);

  useEffect(() => {
    if (!profile?.uid) return undefined;
    return subscribePaymentVerification(profile.uid, setVerification);
  }, [profile?.uid]);

  function handleProofFile(event) {
    const file = event.target.files && event.target.files[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    readProofImage(file)
      .then(setProofUrl)
      .catch(() => setError("Could not read that image. Please try again (PNG or JPEG)."));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (!isNonEmpty(payerName)) {
      setError("Please enter the name on the account you paid from.");
      return;
    }
    if (!isNonEmpty(payerBank)) {
      setError("Please enter the bank name.");
      return;
    }
    if (!/^\d{4}$/.test(transactionRef.trim())) {
      setError("Transaction ID should be the last 4 digits (numbers only).");
      return;
    }
    if (!proofUrl) {
      setError("Please upload your payment screenshot.");
      return;
    }
    setBusy(true);
    try {
      const updated = await submitPaymentDetails(profile.uid, {
        payerName,
        payerBank,
        transactionRef,
        proofUrl
      });
      setSubmission(
        updated || {
          ...submission,
          payerName: payerName.trim(),
          payerBank: payerBank.trim(),
          transactionRef: transactionRef.trim(),
          proofUrl,
          status: "submitted"
        }
      );
      setProofUrl("");
    } catch (err) {
      console.error(err);
      setError("Could not submit. Please try again.");
    }
    setBusy(false);
  }

  if (qrCodes === null || settings === null || submission === null) {
    return <FullPageLoader label="Loading payment…" />;
  }

  const myQr = qrCodes[`qr-${submission.qrSlot}`];
  const feeText = `₹${Number(organization.fee || 0).toLocaleString("en-IN")}`;
  const accepting = settings.accepting !== false;
  const upiId = myQr?.upiId || "";
  const effectiveView = view || (upiId ? "pay" : "qr");
  const upiHref = upiId
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(organization.name)}&am=${organization.fee}&cu=INR&tn=${encodeURIComponent(`Internship fee - ${profile?.name || "student"}`)}`
    : "";

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Pay your internship fee</h1>
          <p className="page-sub">
            Pay {feeText} via UPI to the QR assigned to you, then submit your payment details with a
            screenshot for verification.
          </p>
        </div>
        {verification && <span className="badge badge-green">Payment verified</span>}
      </div>

      {error && <div className="notice notice-error">{error}</div>}

      {verification ? (
        <div className="card">
          <p className="card-title">Payment verified</p>
          <p>Your payment has been verified. Thank you.</p>
          <p className="hint">Verified on {formatDate(verification.verifiedAt)} by {verification.verifiedBy}.</p>
        </div>
      ) : !accepting ? (
        <div className="card">
          <EmptyState
            title="Payments are currently paused"
            hint={
              submission.status === "submitted"
                ? "Your payment details are in and will be verified. You do not need to do anything else."
                : "Please check back later. If you have already paid, please contact the admin."
            }
          />
        </div>
      ) : (
        <div className="pay-layout">
          <div className="card pay-qr-card">
            <p className="card-title">Complete your payment</p>
            <p className="hint">
              Amount {feeText} · <span className="badge badge-blue">QR-{submission.qrSlot}</span> is
              assigned to you
            </p>
            {upiId ? (
              <a className="btn btn-primary pay-now-btn" href={upiHref}>
                Pay {feeText} now
              </a>
            ) : (
              <p className="hint">
                UPI pay is not enabled for your QR — please use Show QR code to pay.
              </p>
            )}
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setView(effectiveView === "qr" ? "pay" : "qr")}
            >
              {effectiveView === "qr" ? (upiId ? "Switch to UPI pay" : "Close QR") : "Show QR code"}
            </button>
            {effectiveView === "qr" && (
              myQr && myQr.dataUrl ? (
                <>
                  <img className="pay-qr-image" src={myQr.dataUrl} alt={`UPI QR code ${submission.qrSlot}`} />
                  <p className="hint">Scan with any UPI app to pay {feeText}. Pay to this QR only.</p>
                </>
              ) : (
                <EmptyState
                  title="No QR available right now"
                  hint="Please check back later. If you have already paid, please contact the admin."
                />
              )
            )}
            {upiId && effectiveView === "pay" && (
              <p className="hint">Tapping Pay now opens your UPI app with the amount filled in.</p>
            )}
          </div>

          <div className="card">
            <p className="card-title">Payment details</p>
            {submission.status === "submitted" ? (
              <div>
                <p>Your payment details were submitted and are awaiting admin verification.</p>
                <ul className="pay-summary">
                  <li>Amount: {feeText}</li>
                  <li>Paid to: QR-{submission.qrSlot}</li>
                  <li>From: {submission.payerName} ({submission.payerBank})</li>
                  <li>Transaction ID (last 4 digits): {submission.transactionRef}</li>
                  {submission.proofUrl && <li>Proof: screenshot uploaded</li>}
                </ul>
                <p className="hint">If you entered details incorrectly, please contact the admin.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <div className="field">
                  <label htmlFor="pay-name">Account holder name (account you paid from)</label>
                  <input
                    id="pay-name"
                    className="input"
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                  />
                </div>
                <div className="field">
                  <label htmlFor="pay-bank">Bank / UPI app of the account</label>
                  <input
                    id="pay-bank"
                    className="input"
                    value={payerBank}
                    onChange={(e) => setPayerBank(e.target.value)}
                    placeholder="e.g. HDFC Bank"
                  />
                </div>
                <div className="field">
                  <label htmlFor="pay-ref">Transaction ID (last 4 digits)</label>
                  <input
                    id="pay-ref"
                    className="input"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value.replace(/[^\d]/g, "").slice(0, 4))}
                    placeholder="e.g. 4821"
                    inputMode="numeric"
                  />
                </div>
                <div className="field">
                  <label htmlFor="pay-proof">Payment screenshot (required)</label>
                  {proofUrl ? (
                    <div className="pay-proof-preview">
                      <img src={proofUrl} alt="Payment screenshot" />
                      <div>
                        <p className="hint">Screenshot attached.</p>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setProofUrl("")}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="pay-qr-file">
                      <span>Choose screenshot</span>
                      <input id="pay-proof" type="file" accept="image/*" onChange={handleProofFile} />
                    </label>
                  )}
                  <p className="hint">
                    Upload the successful payment screen from your UPI app so the admin can verify
                    instantly.
                  </p>
                </div>
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy ? "Submitting…" : "Submit payment details"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}