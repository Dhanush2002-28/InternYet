import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getClasses } from "../../data/store";
import { organization } from "../../config/organization";
import ClassCard from "../../components/ClassCard";
import EmptyState from "../../components/EmptyState";
import { FullPageLoader } from "../../components/FullPageLoader";
import { usePaymentVerified } from "../../components/PaymentGate";
import {
  classDateTime,
  formatDate,
  internshipStatusLabel,
  internshipStatusTone
} from "../../utils/format";

const LOCKED_HINT = "Unlocks after payment verification.";

export default function StudentDashboard() {
  const { profile } = useAuth();
  const paymentVerified = usePaymentVerified();
  const [classes, setClasses] = useState(null);

  useEffect(() => {
    if (paymentVerified !== true) {
      setClasses([]);
      return undefined;
    }
    let active = true;
    getClasses()
      .then((items) => {
        if (active) setClasses(items);
      })
      .catch(() => {
        if (active) setClasses([]);
      });
    return () => {
      active = false;
    };
  }, [paymentVerified]);

  if (!profile) return <FullPageLoader label="Loading your profile…" />;
  if (paymentVerified === null) return <FullPageLoader label="Checking your payment status…" />;

  const locked = paymentVerified === false;
  const status = profile.internship?.status || "registered";
  const offer = profile.offerLetter;
  const cert = profile.internship?.certificate;
  const firstName = String(profile.name || "there").split(" ")[0];
  const upcoming = (classes || [])
    .filter((c) => c.status === "scheduled")
    .sort((a, b) => classDateTime(a).getTime() - classDateTime(b).getTime())
    .slice(0, 3);
  const nextClass = upcoming[0];

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Hello, {firstName}</h1>
          <p className="page-sub">Here is your internship at a glance.</p>
        </div>
        {!locked && (
          <Link className="btn btn-primary btn-sm" to="/student/classes">
            View all classes
          </Link>
        )}
      </div>

      {locked && (
        <div className="notice notice-amber">
          <span>
            Your payment is pending. Classes, forum, offer letter, certificate and messages
            will unlock once your payment is verified.
          </span>{" "}
          <Link className="btn btn-primary btn-sm" to="/student/payment">
            Go to payment
          </Link>
        </div>
      )}

      <div className="grid grid-3">
        <div className="stat-card">
          <span className="stat-label">Offer letter</span>
          {locked ? (
            <>
              <span className="stat-value">Locked</span>
              <p className="hint">{LOCKED_HINT}</p>
            </>
          ) : (
            <>
              <span className="stat-value mono">{offer?.number || "—"}</span>
              <Link className="link-plain" to="/student/offer-letter">
                View &amp; download →
              </Link>
            </>
          )}
        </div>
        <div className="stat-card">
          <span className="stat-label">Internship status</span>
          {locked ? (
            <>
              <span className="stat-value">Locked</span>
              <p className="hint">{LOCKED_HINT}</p>
            </>
          ) : (
            <>
              <span className={`badge badge-${internshipStatusTone(status)}`}>
                {internshipStatusLabel(status)}
              </span>
              <p className="hint">
                {status === "completed"
                  ? "Congratulations — your internship is complete."
                  : "Your mentor will update this once your internship is complete."}
              </p>
            </>
          )}
        </div>
        <div className="stat-card">
          <span className="stat-label">Certificate</span>
          {locked ? (
            <>
              <span className="stat-value">Locked</span>
              <p className="hint">{LOCKED_HINT}</p>
            </>
          ) : (
            <>
              <span className="stat-value">{cert ? "Issued" : "Pending"}</span>
              {cert ? (
                <Link className="link-plain" to="/student/certificate">
                  Download certificate →
                </Link>
              ) : (
                <p className="hint">Issued automatically on completion.</p>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 className="card-title">Upcoming classes</h3>
          {locked ? (
            <EmptyState title="Locked" hint={LOCKED_HINT} />
          ) : upcoming.length === 0 ? (
            <EmptyState
              title="No upcoming classes"
              hint="New classes scheduled by your mentor will appear here."
            />
          ) : (
            <div className="card-list">
              <ClassCard classItem={nextClass} />
              {upcoming.slice(1).map((item) => (
                <div className="mini-class" key={item.id}>
                  <div className="mini-class-title">{item.title}</div>
                  <div className="hint">
                    {formatDate(item.date)} · {item.time} · {item.mentorName}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card">
          <h3 className="card-title">Your program</h3>
          <dl className="detail-list">
            <div>
              <dt>Program</dt>
              <dd>{locked ? "—" : organization.program}</dd>
            </div>
            <div>
              <dt>Organization</dt>
              <dd>{locked ? "—" : organization.name}</dd>
            </div>
            <div>
              <dt>Duration</dt>
              <dd>{locked ? "—" : organization.duration}</dd>
            </div>
            <div>
              <dt>Mode</dt>
              <dd>{locked ? "—" : "Online · Google Meet"}</dd>
            </div>
            <div>
              <dt>Stipend</dt>
              <dd>{locked ? "—" : organization.stipend}</dd>
            </div>
            <div>
              <dt>Program contact</dt>
              <dd>{locked ? "—" : organization.email}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}