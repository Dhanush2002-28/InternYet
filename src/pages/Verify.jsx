import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getCertificate, normalizeCertificateNumber } from "../data/store";
import { organization } from "../config/organization";
import { formatDate } from "../utils/format";

export default function Verify() {
  const [params] = useSearchParams();
  const [value, setValue] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);

  async function runCheck(raw) {
    const number = normalizeCertificateNumber(raw);
    if (!number) return;
    setChecking(true);
    setResult(null);
    try {
      const cert = await getCertificate(number);
      setResult({
        number,
        cert: cert || null,
        status: cert ? (cert.status === "revoked" ? "revoked" : "issued") : "notfound"
      });
    } catch (err) {
      console.error(err);
      setResult({ number, cert: null, status: "notfound" });
    }
    setChecking(false);
  }

  useEffect(() => {
    const c = params.get("c");
    if (c) {
      setValue(c);
      runCheck(c);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    runCheck(value);
  }

  const cert = result ? result.cert : null;

  return (
    <div className="verify-page">
      <div className="verify-topbar">
        <div className="verify-topbar-inner">
          <div className="brand">
            <span className="brand-mark">IP</span>
            <span className="brand-name">{organization.shortName}</span>
          </div>
          <Link className="verify-back" to="/">
            &larr; Back to portal
          </Link>
        </div>
      </div>

      <div className="verify-wrap">
        <div className="verify-card">
          <span className="eyebrow">Official verification</span>
          <h1 className="verify-title">Verify an internship certificate</h1>
          <p className="verify-sub">
            Enter the Certificate ID printed on the certificate (for example{" "}
            <span className="mono">CERT-2026-0001</span>) to confirm it was issued by{" "}
            {organization.name}.
          </p>

          <form className="verify-form" onSubmit={handleSubmit}>
            <input
              className="input"
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="CERT-2026-0000"
              aria-label="Certificate ID"
            />
            <button className="btn btn-primary" type="submit" disabled={checking || !value.trim()}>
              {checking ? "Checking…" : "Verify"}
            </button>
          </form>

          {result && (
            <div className="verify-result">
              {result.status === "issued" && (
                <div className="verify-banner ok">✓ Verified — valid certificate</div>
              )}
              {result.status === "revoked" && (
                <div className="verify-banner warn">⚠ Revoked — this certificate has been withdrawn</div>
              )}
              {result.status === "notfound" && (
                <div className="verify-banner bad">✕ Not found</div>
              )}
              <div className="verify-body">
                {result.status === "notfound" ? (
                  <p className="verify-note">
                    No certificate with ID <span className="mono">{result.number}</span> was found in
                    the {organization.name} records. Double-check the ID printed on the certificate,
                    or contact {organization.email} for assistance.
                  </p>
                ) : (
                  <>
                    <dl className="detail-list">
                      <div>
                        <dt>Certificate ID</dt>
                        <dd className="mono">{cert.number}</dd>
                      </div>
                      <div>
                        <dt>Student name</dt>
                        <dd>{cert.studentName}</dd>
                      </div>
                      <div>
                        <dt>Program</dt>
                        <dd>{cert.program}</dd>
                      </div>
                      <div>
                        <dt>Completed on</dt>
                        <dd>{formatDate(cert.completedAt)}</dd>
                      </div>
                      <div>
                        <dt>Issued on</dt>
                        <dd>{formatDate(cert.issuedAt)}</dd>
                      </div>
                      <div>
                        <dt>Issued by</dt>
                        <dd>{cert.issuerName || organization.name}</dd>
                      </div>
                      <div>
                        <dt>Status</dt>
                        <dd>{result.status === "issued" ? "Valid" : "Revoked"}</dd>
                      </div>
                    </dl>
                    {result.status === "revoked" && (
                      <p className="verify-note">
                        The organization has revoked this certificate. It should not be accepted as
                        proof of completion.
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        <p className="verify-foot">
          {organization.name} · {organization.website} · Questions? {organization.email}
        </p>
      </div>
    </div>
  );
}