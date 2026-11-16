import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { organization } from "../../config/organization";
import { generateCertificatePdf } from "../../utils/pdf/certificate";
import { formatDate } from "../../utils/format";
import EmptyState from "../../components/EmptyState";

export default function StudentCertificate() {
  const { profile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!profile) return null;
  const internship = profile.internship || {};
  const cert = internship.certificate;

  function handleDownload() {
    setBusy(true);
    setError("");
    try {
      const doc = generateCertificatePdf(profile);
      const safeName = String(profile.name || "student").replace(/\s+/g, "-");
      doc.save(`Internship-Certificate-${safeName}.pdf`);
    } catch (err) {
      console.error(err);
      setError("Could not generate the PDF. Please try again.");
    }
    setBusy(false);
  }

  if (!cert) {
    return (
      <div>
        <div className="page-head">
          <div>
            <h1 className="page-title">Internship certificate</h1>
            <p className="page-sub">Issued automatically once your internship is complete.</p>
          </div>
        </div>
        <div className="card">
          <EmptyState
            title="Your certificate is not issued yet"
            hint={`Your mentor will mark your internship as completed on the mentor dashboard. ${organization.program} · ${organization.duration}.`}
          />
          <div className="card-actions">
            <Link className="btn btn-ghost btn-sm" to="/student/classes">
              View my classes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">My internship certificate</h1>
          <p className="page-sub">Congratulations — your internship has been completed.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleDownload} disabled={busy}>
          {busy ? "Generating…" : "Download PDF"}
        </button>
      </div>

      {error && <div className="notice notice-error">{error}</div>}

      <div className="card">
        <h3 className="card-title">Certificate details</h3>
        <dl className="detail-list">
          <div>
            <dt>Certificate ID</dt>
            <dd className="mono">{cert.number}</dd>
          </div>
          <div>
            <dt>Issued on</dt>
            <dd>{formatDate(cert.issuedAt)}</dd>
          </div>
          <div>
            <dt>Program completed</dt>
            <dd>{organization.program}</dd>
          </div>
          <div>
            <dt>Duration</dt>
            <dd>{organization.duration}</dd>
          </div>
          <div>
            <dt>Issued by</dt>
            <dd>{cert.issuerName || organization.name}</dd>
          </div>
        </dl>
        <div className="notice notice-success">
          Share this certificate PDF for internships, resumes and applications.
        </div>
        <div className="notice">
          Anyone can verify this certificate online — share the ID <span className="mono">{cert.number}</span> or use the
          <Link to={`/verify?c=${encodeURIComponent(cert.number)}`}> verify link</Link>.
        </div>
      </div>
    </div>
  );
}