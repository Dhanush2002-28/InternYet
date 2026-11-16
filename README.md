# Internship Portal

An end-to-end internship registration, classes and certification portal built with **React (Vite)**,
**Firebase** (Auth + Firestore) and **jsPDF**, deployable on **Vercel**.

## Features

- **Registration + login** for students — Google OAuth (Sign in with Google) or email/password.
- **Automated offer letters** — generated the moment a student completes registration; no manual
  designing, scales to 50+ students. Downloadable PDF from the student profile.
- **Student profiles** — personal + academic details, phone, address, skills, offer letter and
  internship status stored per student.
- **Live classes on Google Meet** — mentors schedule classes with a Meet link; students see them
  instantly and join with one click.
- **Automated internship certificates** — a mentor marks a student complete and a certificate PDF
  with a unique ID is issued instantly.
- **UPI fee collection** - students are round-robin assigned one of the admin-uploaded UPI QR
  codes (any number; each can be enabled/disabled; a global pause switch stops everything).
  Students pay via a one-tap UPI deep link (per-slot UPI ID) or by scanning the QR, then
  submit payer name, bank, last-4-digit transaction ID and a compulsory payment screenshot
  for the admin to cross-verify.
- **Payment gating** - until a student's payment is verified, their modules (classes, forum,
  offer letter, certificate, messages) are locked by route guards, the nav hides them and the
  dashboard masks module data; the admin's verification unlocks everything live.
- **Student forum** - a real-time discussion board where the batch talks through projects,
  reviews and preparation; mentors and admin can reply as staff.
- **One-on-one messages** - private chats between student and mentor, student and admin,
  and mentor and admin, with unread counts.
- **Real-time notifications** - an in-app bell for new messages, forum replies on your
  discussions, class scheduling/updates and certificate issuance.
- **Email notifications (EmailJS)** - the offer letter is emailed when a student completes
  their profile, a confirmation is emailed when the admin verifies a payment, and the
  certificate is emailed on completion. Templates live in `email-templates/` (paste them
  into the EmailJS dashboard; set the keys in `.env`).
- **Mentor module** — full student directory, class scheduling/management, certificate issuance.
- **Admin module** — program overview, mentor approval, all-user list.
- **Secure by design** — role-based protected routes, fallback 404/403 pages, Firestore security
  rules, security response headers on Vercel, and passwords handled server-side by Firebase Auth.
- **Offline demo mode** — with no Firebase env vars the app runs entirely on a built-in
  localStorage mock backend (seeded admin, mentor, students, classes, forum posts, a live chat
  and notifications), so the whole portal
  can be tested on a PC without internet.
- **Installable on mobile (PWA)** - web manifest, app icons and a service worker let students
  "Add to Home Screen" / "Install app" on Android and iOS; it opens full-screen like a native
  app, and the app shell stays available offline.

## Tech stack

| Layer      | Choice                                        |
| ---------- | --------------------------------------------- |
| Frontend   | React 18 + Vite, React Router 6                |
| Auth       | Firebase Auth (Google OAuth + email/password) |
| Database   | Cloud Firestore                                |
| PDF        | jsPDF (offer letter A4, certificate A4 landscape) |
| Hosting    | Vercel (SPA rewrites + security headers)      |

## Quick start (offline / demo mode)

The app runs in **demo mode** whenever Firebase env vars are absent. Demo mode stores data in your
browser (localStorage) and seeds an admin, a mentor and seven students, plus sample classes, a payment pool (3 demo QRs with UPI IDs, one pending payment to verify as admin).
Passwords are hashed (SHA-256 via WebCrypto) in demo mode; in production Firebase handles
password hashing server-side.

```bash
npm install
npm run dev
```

Open http://localhost:5173 and sign in with one of the demo accounts:

| Role    | Email             | Password    |
| ------- | ----------------- | ----------- |
| Student | student@demo.com  | Student@1234 |
| Mentor  | mentor@demo.com   | Mentor@1234  |
| Admin   | admin@demo.com    | Admin@1234   |

> This PC is offline: run `npm install` on an internet-connected machine, copy the whole folder
> (including `node_modules`) here, then `npm run dev` works fully offline in demo mode.
>
> If the copied `node_modules` is missing `jspdf`, nothing breaks: `vite.config.js` automatically
> aliases `jspdf` to the built-in offline fallback (`src/utils/pdf/jspdf-fallback.js`). PDF
> buttons then open a printable preview — use the print dialog and choose **Save as PDF**.

## Customizing your organization

Edit `src/config/organization.js` — organization name, program name, address, contact, duration,
stipend and signatory. These values appear in the UI, offer letters and certificates.

## Firebase setup (production)

1. **Create a project** at https://console.firebase.google.com.
2. **Authentication → Sign-in method**: enable **Google** and **Email/Password**.
3. **Authorized domains** (Authentication → Settings → Authorized domains): add
   `localhost` and your Vercel domain (e.g. `yourapp.vercel.app`).
4. **Firestore Database**: create the database (production mode).
5. **Firestore rules**: open the Rules tab and paste the contents of `firestore.rules`.
6. **Register a Web App** (Project settings → Your apps → Web) and copy the config.
7. Create `.env` from `.env.example` and fill in:

   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

8. `npm run dev` — the demo banner disappears and the app talks to Firebase.

## EmailJS setup (optional - emails)

The portal sends three transactional emails via [EmailJS](https://www.emailjs.com) (no backend
needed): the offer letter (on profile completion), payment confirmation (on admin
verification) and the certificate (on completion).

1. Create a free account and an email service (Gmail/Outlook/custom SMTP) in the EmailJS
   dashboard; note your **Service ID** and **Public Key**.
2. Create the three email templates from the paste-ready files in `email-templates/`
   (offer-letter, payment-confirmation, certificate).
3. Add to `.env`:

   ```
   VITE_EMAILJS_PUBLIC_KEY=...
   VITE_EMAILJS_SERVICE_ID=...
   VITE_EMAILJS_TEMPLATE_OFFER_LETTER=...
   VITE_EMAILJS_TEMPLATE_PAYMENT=...
   VITE_EMAILJS_TEMPLATE_CERTIFICATE=...
   ```

Without these values everything works and emails are simply skipped (a console info line is
logged per skipped send). Full walkthrough: `email-templates/README.md`.

## Roles and how accounts are provisioned

| Role    | How they get an account                                                            |
| ------- | ---------------------------------------------------------------------------------- |
| Student | Self-registration (Google or email/password). Offer letter generated on profile completion. |
| Mentor  | **Admin** approves the mentor's **Google email** in Admin → Mentors. The mentor then signs in with that Google account; the first sign-in creates the mentor account (verified by Firestore rules). |
| Admin   | One-time setup: in the Firebase console, create the document `roles/admins/<your-email>` in Firestore (empty doc is fine). Then sign in with that Google account — the first sign-in creates the admin account. |

Firestore rules (`firestore.rules`) enforce:

- Students can create their own `users/{uid}` doc as `student` and afterwards edit only their
  own profile fields - `role`/`uid`/`createdAt` are immutable, `internship` and `offerLetter`
  are first-write-only (prevents self-issued certificates and offer-letter tampering).
- Mentors/admins can write only the `internship` block on student docs (completion,
  certificate issue/revoke) - no role changes, no cross-role tampering.
- Notifications: self-inbox or staff-only. Payment: pause switch admin-only and enforced on
  submission writes; QR rotation counter may only advance by +1; verifications are
  mentor/admin-only.
- Only mentors/admins can list students and manage classes.
- Only admins manage the approved-mentors list; the `roles/admins` list is console-managed only.

## Deploying to Vercel

1. Push this folder to a GitHub repository:

   ```bash
   git init
   git add .
   git commit -m "Internship portal"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```

2. At https://vercel.com → **Add New → Project** → import the repo. Vercel auto-detects Vite.
3. In **Environment Variables**, add all six `VITE_FIREBASE_*` values from your `.env` (plus the five `VITE_EMAILJS_*` values if you enabled emails).
4. **Deploy**.
5. After deployment, add your `*.vercel.app` (and custom) domain to Firebase
   **Authentication → Authorized domains** for Google sign-in.

`vercel.json` already handles SPA routing (all paths rewrite to `index.html`) and adds security
headers (nosniff, referrer policy, X-Frame-Options, CSP).

## Project structure

```
src/
  config/organization.js   # your org details (used in UI + PDFs)
  config/email.js          # EmailJS config + isEmailConfigured() gate
  firebase/                # firebase config + app init (no-op in demo mode)
  data/                    # auth.js + store.js: unified Firebase/demo data layer
  services/emailService.js # EmailJS sends (offer letter, payment, certificate)
  context/AuthContext.jsx  # session + profile state
  components/              # layout, route guards (incl. PaymentGate), class card, loaders
  pages/
    Landing.jsx            # public marketing page
    Login.jsx Register.jsx # auth
    CompleteProfile.jsx    # student profile wizard (issues offer letter)
    Verify.jsx           # public certificate verification portal (/verify)
    student/               # dashboard, payment, profile, offer letter, certificate, classes
    mentor/                # dashboard, student directory, scheduling, classes
    admin/                 # overview, students, mentor approvals, payments, all users
  utils/pdf/               # offerLetter.js + certificate.js (jsPDF generators)
                           # jspdf-fallback.js (offline PDF preview, auto-activated)
email-templates/             # paste-ready EmailJS template bodies + setup README
```

## Troubleshooting

- **`Failed to resolve import "jspdf"`** (offline PC with a partial `node_modules` copy) —
  handled automatically: `vite.config.js` aliases `jspdf` to the built-in offline fallback
  (`src/utils/pdf/jspdf-fallback.js`) whenever the real package is missing. PDF buttons then open
  a printable preview — use the print dialog and choose **Save as PDF**. To restore native PDF
  downloads, run `npm install` on an internet PC, copy `node_modules\jspdf` into this PC's
  `node_modules`, then restart `npm run dev`. No code changes needed.
- **`Failed to resolve import "@emailjs/browser"`** (offline PC whose `node_modules` predates
  the EmailJS integration) - run `npm install` on an internet PC and copy
  `node_modules\@emailjs` (or the whole folder) into this PC's `node_modules`, then restart.
  Until the `VITE_EMAILJS_*` values are set, emails are skipped anyway.
- **`auth/invalid-api-key`** — a `.env` with placeholder or partial Firebase values. Delete the
  `.env` (demo mode) or fill all `VITE_FIREBASE_*` values; incomplete config now falls back to
  demo mode with a console warning instead of crashing.
- **`auth/operation-not-allowed`** — Google or Email/Password provider not enabled in Firebase.
- **Popup not opening** — allow pop-ups for the site, or the domain is missing from authorized domains.
- **Firestore permission denied** — rules not deployed, or a role mismatch (see `firestore.rules`).
- **Demo data gone** — demo data lives in localStorage; use the "Reset demo data" link in the banner.
- **CSP blocking something on Vercel** — relax the CSP header in `vercel.json` if you add external assets.

## Future Enhancements

### Attendance System (designed, deferred)
Proxy-proof attendance for Google Meet classes, zero manual entry by mentors.

- **Recommended path (free Gmail accounts):** Live QR check-in - the class page auto-generates
  a QR during class (rolling 60s nonce, screenshots die fast); students scan with their own
  logged-in phone and tap once to check in. Students must join Meet with the same Google
  account they registered with (portal shows an "attending as <email>" banner). Optional:
  mentor takes one participants-panel screenshot at class end as evidence.
- **Fully automatic path (requires Google Workspace domain):** small Vercel serverless
  function polls the Admin SDK Reports API after each class and stores per-account
  `join`/`leave` events - attendance written straight from Google's own records.
- **Optional hardening:** on-device selfie liveness check at check-in (face-api.js, image
  never leaves the device) + admin audit tab flagging anomalies (shared device/IP, late marks).
- **Data shape (demo localStorage and Firestore, identical):** `attendance/{classId}` doc with
  `{ window, nonce, records: { studentId: { ts, device, status } } }`.
- **Hook:** attendance % can gate certificate eligibility (e.g. 75% required).
- **Why deferred:** keep current scope; revisit after the Firebase + Vercel go-live is stable.
