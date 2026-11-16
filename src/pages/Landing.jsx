import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { organization } from "../config/organization";
import { roleHome } from "../components/ProtectedRoute";
import ThemeToggle from "../components/ThemeToggle";

function Icon({ children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const FEATURES = [
  {
    icon: (
      <Icon>
        <path d="M22 10 12 5 2 10l10 5 10-5z" />
        <path d="M6 12.5V17c0 1.66 2.69 3 6 3s6-1.34 6-3v-4.5" />
        <path d="M22 10v6" />
      </Icon>
    ),
    title: "Your Profile, One Place",
    desc: "Your details, academic information, documents and internship status — always in sync, always accessible."
  },
  {
    icon: (
      <Icon>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M9 13h6" />
        <path d="M9 17h6" />
      </Icon>
    ),
    title: "Offer Letter on Day One",
    desc: "Generated automatically the moment you register. No waiting, no chasing — it is in your portal instantly."
  },
  {
    icon: (
      <Icon>
        <path d="m23 7-7 5 7 5V7z" />
        <rect x="1" y="5" width="15" height="14" rx="2" />
      </Icon>
    ),
    title: "Live Classes on Google Meet",
    desc: "Join interactive live sessions with one click. Every class is listed on your dashboard with its Meet link."
  },
  {
    icon: (
      <Icon>
        <circle cx="12" cy="8" r="6" />
        <path d="M8.5 13.5 7 22l5-3 5 3-1.5-8.5" />
      </Icon>
    ),
    title: "Certificate on Completion",
    desc: "Finish the program and your certificate — with a unique ID — is issued automatically, ready to download."
  },
  {
    icon: (
      <Icon>
        <path d="M3 3v18h18" />
        <path d="M7 16v-5" />
        <path d="M12 16V8" />
        <path d="M17 16v-3" />
      </Icon>
    ),
    title: "Track Your Progress",
    desc: "Status, next class, documents — see exactly where you stand in the program at a glance."
  },
  {
    icon: (
      <Icon>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </Icon>
    ),
    title: "Secure by Design",
    desc: "Firebase authentication and protected accounts — your profile and documents stay private to you."
  }
];

const SKILLS = [
  "Hands-on project work in React and JavaScript",
  "Data structures and problem solving",
  "Git, GitHub and team workflows",
  "Building and consuming REST APIs",
  "Mock interviews with mentor feedback"
];

const RECEIVES = [
  "Offer letter generated on registration",
  "Regular live classes on Google Meet",
  "Mentor guidance on your progress",
  "Completion certificate with a unique ID",
  "Portfolio-ready projects to showcase"
];

const ELIGIBILITY = [
  {
    icon: (
      <Icon>
        <path d="M22 10 12 5 2 10l10 5 10-5z" />
        <path d="M6 12.5V17c0 1.66 2.69 3 6 3s6-1.34 6-3v-4.5" />
        <path d="M22 10v6" />
      </Icon>
    ),
    title: "Final-year or recent graduate",
    desc: "Students of the 2025–2027 batches across engineering, science and management streams."
  },
  {
    icon: (
      <Icon>
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8" />
        <path d="M12 17v4" />
      </Icon>
    ),
    title: "A laptop and stable internet",
    desc: "All classes are live on Google Meet, so a reliable setup keeps you in the room."
  },
  {
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </Icon>
    ),
    title: "Consistency for the duration",
    desc: `Commit to the full ${organization.duration.toLowerCase()} program — attendance and milestones matter.`
  },
  {
    icon: (
      <Icon>
        <path d="m16 18 6-6-6-6" />
        <path d="m8 6-6 6 6 6" />
      </Icon>
    ),
    title: "Basic coding familiarity",
    desc: "You do not need to be an expert — curiosity and willingness to learn matter more."
  }
];

export default function Landing() {
  const { user, profile } = useAuth();
  const loggedIn = Boolean(user && profile);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const chips = document.querySelectorAll(".preview-float-1, .preview-float-2");
    if (!chips.length) return;
    const reset = () => {
      chips.forEach((el) => el.classList.add("anim-reset"));
      requestAnimationFrame(() =>
        requestAnimationFrame(() => chips.forEach((el) => el.classList.remove("anim-reset")))
      );
    };
    const id = setInterval(reset, 25000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="landing">
      <header className="landing-header">
        <div className="landing-header-inner">
          <Link to="/" className="brand">
            <span className="brand-mark">IP</span>
            <span className="brand-name">{organization.shortName}</span>
          </Link>
          <nav className="landing-nav">
            <a className="link-plain" href="#features">Features</a>
            <a className="link-plain" href="#included">What you get</a>
            <a className="link-plain" href="#program">Program</a>
            <a className="link-plain" href="#eligibility">Eligibility</a>
            <ThemeToggle />
            {loggedIn ? (
              <Link className="btn btn-primary btn-sm" to={roleHome(profile.role)}>
                Open dashboard
              </Link>
            ) : (
              <>
                <Link className="link-plain" to="/login">Sign in</Link>
                <Link className="btn btn-primary btn-sm" to="/register">Get started</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="landing-hero">
        <div className="hero-grid">
          <div className="hero-copy">
            <span className="hero-badge">{organization.program}</span>
            <h1 className="hero-title">
              Your entire internship, <span className="hero-title-accent">in one portal.</span>
            </h1>
            <p className="hero-sub">
              Register once — your offer letter is generated instantly, you join live classes on
              Google Meet, and your completion certificate is ready the day you finish.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" to="/register">Register now</Link>
              <Link className="btn btn-ghost" to="/login">Sign in</Link>
            </div>
            <p className="hero-note">
              Offer letter in minutes · Live Google Meet classes · Certificate on completion
            </p>
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="hero-stat-num">{organization.duration}</span>
                <span className="hero-stat-label">Program duration</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-num">100%</span>
                <span className="hero-stat-label">Online · Google Meet</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-num">0</span>
                <span className="hero-stat-label">Manual paperwork</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-num">1</span>
                <span className="hero-stat-label">Portal for your internship</span>
              </div>
            </div>
          </div>

          <div className="hero-preview" aria-hidden="true">
            <div className="preview-card">
              <div className="preview-topbar">
                <span className="preview-dot" />
                <span className="preview-dot" />
                <span className="preview-dot" />
                <span className="preview-url">internship-portal.app</span>
              </div>
              <div className="preview-body">
                <div className="preview-greeting">
                  <span className="preview-name">Hello, Ananya</span>
                  <span className="badge badge-green">In progress</span>
                </div>
                <div className="preview-row">
                  <div>
                    <span className="preview-row-title">Data Structures Bootcamp</span>
                    <span className="preview-row-meta">Mon, 9 Nov · 2:00 pm · Live class</span>
                  </div>
                  <span className="preview-btn">Join Meet</span>
                </div>
                <div className="preview-row">
                  <div>
                    <span className="preview-row-title">Offer letter</span>
                    <span className="preview-row-meta">OFFER-2026-1042 · issued 25 Oct</span>
                  </div>
                  <span className="preview-chip">PDF</span>
                </div>
                <div className="preview-row">
                  <div>
                    <span className="preview-row-title">Internship certificate</span>
                    <span className="preview-row-meta">Issued automatically on completion</span>
                  </div>
                  <span className="preview-chip muted">Awaiting</span>
                </div>
              </div>
            </div>
            <div className="preview-float preview-float-1">
              <span className="preview-float-ic">✓</span>
              Certificate issued — Vikram P.
            </div>
            <div className="preview-float preview-float-2">
              <span className="preview-float-ic">▶</span>
              Class live on Google Meet
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="features">
        <div className="section-head">
          <h2 className="section-title">Everything built around your internship</h2>
          <p className="section-sub">
            One portal handles the paperwork, the classes and the certificate — so you can focus on
            actually learning.
          </p>
        </div>
        <div className="features-grid">
          {FEATURES.map((feature) => (
            <div className="feature-card" key={feature.title}>
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section" id="included" style={{ paddingTop: 0 }}>
        <div className="section-head">
          <h2 className="section-title">What you will get from this internship</h2>
          <p className="section-sub">
            A structured program with real outcomes — skills you can demonstrate and documents that
            back them up.
          </p>
        </div>
        <div className="roles-grid">
          <div className="role-card">
            <h3>Skills you will build</h3>
            <p>Practical, resume-ready abilities from live project work.</p>
            <ul className="checklist">
              {SKILLS.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
          <div className="role-card">
            <h3>What you will receive</h3>
            <p>Official documents and continuous support throughout the program.</p>
            <ul className="checklist">
              {RECEIVES.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="glance" id="program">
        <div className="glance-inner">
          <h2 className="glance-title">{organization.program} at a glance</h2>
          <div className="glance-grid">
            <div className="glance-item">
              <span className="glance-num">{organization.name}</span>
              <span className="glance-label">Organization</span>
            </div>
            <div className="glance-item">
              <span className="glance-num">{organization.duration}</span>
              <span className="glance-label">Duration</span>
            </div>
            <div className="glance-item">
              <span className="glance-num">Online · Google Meet</span>
              <span className="glance-label">Mode</span>
            </div>
            <div className="glance-item">
              <span className="glance-num">{organization.stipend}</span>
              <span className="glance-label">Stipend</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="eligibility" style={{ paddingTop: 0 }}>
        <div className="section-head">
          <h2 className="section-title">Who should apply</h2>
          <p className="section-sub">
            If this sounds like you, the program is built for you.
          </p>
        </div>
        <div className="roles-grid">
          {ELIGIBILITY.map((item) => (
            <div className="feature-card" key={item.title}>
              <div className="feature-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cta">
        <div className="cta-card">
          <div className="cta-copy">
            <span className="eyebrow">Ready when you are</span>
            <h2>Ready to begin your internship?</h2>
            <p>Join {organization.program} and track everything in one place.</p>
          </div>
          <div className="cta-actions">
            <Link className="btn btn-primary" to="/register">Register now</Link>
            <Link className="btn btn-ghost" to="/login">Sign in</Link>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="brand">
              <span className="brand-mark">IP</span>
              <span className="brand-name">{organization.shortName}</span>
            </div>
            <p>
              End-to-end internship portal: registration, automated offer letters, live Google Meet
              classes and completion certificates — all in one place for students.
            </p>
          </div>
          <div className="footer-col">
            <h4>Program</h4>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#included">What you get</a></li>
              <li><a href="#program">At a glance</a></li>
              <li><a href="#eligibility">Eligibility</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Get started</h4>
            <ul>
              <li><Link to="/register">Student registration</Link></li>
              <li><Link to="/login">Sign in</Link></li>
              <li><Link to="/verify">Verify a certificate</Link></li>
              <li>
                <a href={`mailto:${organization.email}`}>{organization.email}</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-bottom-inner">
            <span>© {new Date().getFullYear()} {organization.name}. All rights reserved.</span>
            <span>{organization.website}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}