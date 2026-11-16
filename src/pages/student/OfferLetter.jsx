import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { organization } from "../../config/organization";
import { generateOfferLetterPdf } from "../../utils/pdf/offerLetter";
import { formatDate } from "../../utils/format";

export default function StudentOfferLetter() {
  const { profile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!profile) return null;
  const offer = profile.offerLetter;

  if (!offer) {
    return (
      <div>
        <div className="page-head">
          <div>
            <h1 className="page-title">Offer letter</h1>
          </div>
        </div>
        <div className="card">
          <div className="empty-state">
            <p className="empty-title">Your offer letter has not been generated yet</p>
            <p className="hint">Complete your profile to receive it automatically.</p>
            <Link className="btn btn-primary btn-sm" to="/complete-profile">
              Complete your profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const start = new Date(offer.issuedAt);
  const end = new Date(start.getTime() + organization.durationWeeks * 7 * 86400000);

  function handleDownload() {
    setBusy(true);
    setError("");
    try {
      const doc = generateOfferLetterPdf(profile);
      const safeName = String(profile.name || "student").replace(/\s+/g, "-");
      doc.save(`Offer-Letter-${safeName}.pdf`);
    } catch (err) {
      console.error(err);
      setError("Could not generate the PDF. Please try again.");
    }
    setBusy(false);
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">My offer letter</h1>
          <p className="page-sub">Generated automatically from your profile.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleDownload} disabled={busy}>
          {busy ? "Generating…" : "Download PDF"}
        </button>
      </div>

      {error && <div className="notice notice-error">{error}</div>}

      <div className="grid grid-2">
        <div className="card">
          <h3 className="card-title">Letter details</h3>
          <dl className="detail-list">
            <div>
              <dt>Reference no.</dt>
              <dd className="mono">{offer.number}</dd>
            </div>
            <div>
              <dt>Issued on</dt>
              <dd>{formatDate(offer.issuedAt)}</dd>
            </div>
            <div>
              <dt>Position</dt>
              <dd>Intern</dd>
            </div>
            <div>
              <dt>Program</dt>
              <dd>{organization.program}</dd>
            </div>
            <div>
              <dt>Duration</dt>
              <dd>{organization.duration}</dd>
            </div>
            <div>
              <dt>Program period</dt>
              <dd>{formatDate(start)} to {formatDate(end)}</dd>
            </div>
            <div>
              <dt>Mode</dt>
              <dd>Online · Google Meet</dd>
            </div>
          </dl>
        </div>
        <div className="card">
          <h3 className="card-title">Good to know</h3>
          <ul className="bullets">
            <li>The PDF is generated from your current profile, so updating your profile updates the letter.</li>
            <li>Keep the reference number — mentors use it to match your record.</li>
            <li>Your completion certificate is issued separately after your internship is marked complete.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}