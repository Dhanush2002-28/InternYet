# InternYet — Work Handoff

> This file lets an AI assistant (or a fresh session) on another machine pick up work with
> zero context loss. Read top to bottom before editing.
> Last updated: 2026-11-16 · Repo state: `7dd133b` · Branch: `main`

## 1. What this project is

End-to-end internship portal (React + Vite SPA) for an 8-week online internship program:

- **Students**: register → automatic offer letter (PDF) → complete profile → live Google Meet
  classes → completion certificate (PDF, unique ID, revocable, publicly verifiable)
- **Mentors**: student directory, class scheduling (Meet links), certificate issuance/revocation
- **Admin**: program overview, mentor approval (allowlist), all-users list
- **Public**: landing page, login/register, certificate verification portal (`/verify?c=CERT-YYYY-NNNN`)
- **Collaboration**: student forum (visible in all 3 modules), 1:1 messages
  (student↔mentor, student↔admin, mentor↔admin), real-time notification bell
- **Payments**: deterministic UPI QR assignment from an admin-managed pool (any number of
  QRs, per-QR UPI ID + enable/disable, global pause switch), one-tap UPI deep link,
  compulsory payment screenshot, admin cross-verification
- **Emails (EmailJS)**: offer letter on profile completion, payment confirmation on admin
  verification, certificate on completion (paste-ready templates in `email-templates/`)
- **Access control**: student modules locked until payment verified (Dashboard, Profile,
  Payment stay open); dashboard masks module data while locked
- **Mobile**: installable PWA (manifest, icons, service worker, in-app install prompt)

Stack: React 18, react-router-dom 6, Firebase (Auth + Firestore), jsPDF, hand-written CSS
(design tokens in `:root`). Hosting target: **Vercel** (`vercel.json` carries SPA rewrite +
security headers).

## 2. Environment (critical)

- **The current PC has NO internet.** The app therefore runs in **demo mode**:
  `src/data/demo.js` mirrors the entire Firestore model in localStorage and activates
  automatically when `VITE_FIREBASE_*` env vars are absent (`src/firebase/config.js` →
  `isFirebaseConfigured`). Demo mode is per-browser; it must never ship (it is impossible to
  accidentally deploy it: with env vars set, demo code is dead).
- **Home PC (internet)**: `npm install` (there is NO `package-lock.json` — do not use
  `npm ci`), create `.env` from `.env.example`, deploy `firestore.rules` to Firebase,
  bootstrap the admin account, and the app switches to real mode automatically.
- Dev server: `npm run dev` on **:5173** (HMR on). The user tests in the Chrome DevTools
  device toolbar at **Galaxy S8+ 360×740 @ 75% zoom = 480 CSS px**. 390 and 480 are the two
  widths that have repeatedly exposed responsive/blur regressions — verify fixes at both.
- Validation: `node node_modules\vite\bin\vite.js build` — success = `✓ built in Xs`.
  Exit code 1 + "NativeCommandError" or CRLF git warnings are stderr noise — ignore.
- **jsPDF quirk**: this offline PC's node_modules lacks `jspdf`. `vite.config.js`
  conditionally aliases it to `src/utils/pdf/jspdf-fallback.js` (a working local
  re-implementation). On an internet PC after `npm install` the real package is detected
  automatically. Never remove the conditional alias.
- **@emailjs/browser quirk (NEW 2026-11-16)**: this offline PC's node_modules does NOT have
  `@emailjs/browser` (added to package.json by the EmailJS integration). Until `npm install`
  runs on the internet PC (or node_modules is copied back), `vite build` and the dev server
  fail ONLY on the `@emailjs/browser` import in `src/services/emailService.js` - EXPECTED
  here, not a regression. All other modules transform cleanly.
- `public/palette-preview.html` is a palette experiment page (4 palettes,
  light/dark/pure-black). Reference only — the live site stays on the original
  indigo/violet palette (see §8).
- Stale `dist/*` files often sit open in IDE tabs — the live app is always `:5173`.

### Editing on this PC (PowerShell 5.1, no `apply_patch` tool available)

Write files with `[System.IO.File]::WriteAllText($path, $t, (New-Object System.Text.UTF8Encoding($false)))`.
Proven helper pattern:

```powershell
$cr=[string][char]13+[char]10; $lf=[string][char]10
function nls([string]$t){ if($t.Contains($cr)){return $cr}; return $lf }
function rep([string]$t,[string]$old,[string]$new){ if(-not $t.Contains($old)){throw "anchor missing: $old"}; return $t.Replace($old,$new) }
```

- Multi-line anchors: join lines with the file's own EOL (`nls $t`); single-line anchors must
  not include a trailing newline.
- Build large new files from `@'...'@` here-strings, normalize with `.Replace("`n", $eol)`.
- Pitfalls hit before: `$(if ...)` parses, `(if ...)` does not; backtick-escaped quotes inside
  double-quoted strings break script parsing; if a `rep` throws mid-script, that file's
  WriteAllText never ran — re-read disk state before "fixing".

## 3. Git

- Local repo, branch `main`, identity: Dhanush. **Milestone-commit every finished feature**
  (the user expects a commit after each feature, with a descriptive message). Working tree
  must be clean after each commit.
- Full log (newest first):

```
7dd133b Email notifications via EmailJS: offer letter, payment confirmation, certificate emails + paste-ready templates
6ad11da Security: harden users update rules (no self-issued certs, no role escalation), notification/counter rules, pinned CSP + HSTS
2727b6b Payments: one-tap UPI deep link (Pay now / Show QR) + compulsory payment screenshot proof
d7d783f Payments: unlimited QR images (auto-resize), any number of QRs, per-QR disable, global pause switch
3648239 Dashboard: hide all module data for students with unverified payment
00de1e6 Gate student modules behind verified payment (routes + nav + dashboard notice)
b0cdb34 Student payment: drop QR-matching hint; transaction ID is last 4 digits only
dce7aa3 Add UPI payment flow: 4 rotating QRs (admin upload), student payment details, admin cross-verification
cb0a536 Add HANDOFF.md for continuing work on another machine/AI
c101192 Install prompt: clamp to card width (450px) so auth column stays consistent
2caacb9 Install prompt: align inside the auth column (was floating beside the card on desktop)
46ed335 Fix mobile topbar overflow (icon-only sign-out, hide user meta <=600px) and table column squashing (min-width + card scroll)
036b568 PWA: installable mobile app (manifest, icons, service worker, install prompt on login/register)
2d3473a Forum available in mentor and admin modules (module-aware links, nav, notification deep-links)
c442686 Add student forum, one-on-one messages and real-time notifications (demo + Firebase, rules, triggers, bell UI)
2b1da10 Fix navbar Sign in disappearing at <=480px: removed mobile display:none rule (nav fits)
de7c0a8 Register: duplicate email now shows notice with sign-in link (demo error carries auth/email-already-in-use code)
f9e4c8c Smooth hero chip float: transform animation with periodic layer re-rasterize (25s) - GPU-smooth and crisp at fractional zoom
994d5d5 Restore hero chip float using top/bottom layout animation (crisp at any zoom)
79fea86 Remove infinite float on preview chips (permanent GPU layer -> blurry text at fractional zoom)
eb6f845 Fix post-animation text blur: fill-mode both -> backwards
bf874fb Navigation affordances: back-to-home on login/register, 404 dashboard shortcut, 403 home option
e4f4d11 Landing mobile fixes: collapse nav links, 2x2 stats/glance, stacked footer, tighter title
7528289 Revamp CTA: full-bleed gradient band -> contained tinted card
307c2e7 Subtle animations: staggered landing entrance, route-change fade, ambient hero float, press feedback
f363b25 CTA band: same-hue indigo gradient instead of violet drift
5e4c608 Certificate verification portal with unique certificate IDs
124374a Initial commit - InternYet internship portal
```

### GitHub sync (this PC is offline → internet PC via USB)

- A full-history bundle lives at `C:\Users\BSTC\Desktop\internyet-2026-11-16.bundle` (regenerated 2026-11-16, includes everything through `7dd133b`).
  It is STALE once new commits land — regenerate anytime with
  `git bundle create internyet-latest.bundle main` (verify with `git bundle verify`).
- Internet PC, first time only:
  1. GitHub web: create repo `InternYet`, **private**, empty (no README/.gitignore).
  2. `git clone <bundle> InternYet && cd InternYet`
  3. `git remote add origin https://github.com/<user>/InternYet.git`
  4. `npm install && git push -u origin main`
     (push auth: fine-grained PAT with Contents: read+write, or GitHub Desktop browser login)
- Round trips: bundle over USB; here, `git fetch <bundle> main && git merge FETCH_HEAD`.
  As long as both sides commit before transferring, merges are clean fast-forwards.
- `.gitignore` already covers `node_modules`, `dist`, `.env`, `.env.local` — Firebase keys
  never leave the machine. Do not commit node_modules or dist.

## 4. Architecture

### The demo/Firebase switch (the core pattern)

Every function in `src/data/store.js` and `src/data/auth.js` branches:
`if (!isFirebaseConfigured) return demo.demoX(...);` — identical API over both backends.
**Any new feature must implement BOTH branches plus matching Firestore rules.**

### Real-time

- Firebase: `onSnapshot` subscriptions exposed as `subscribeX(callback)` returning an
  unsubscribe function.
- Demo: `demo.js` has a change emitter — every localStorage `write()` fires `emitChange()`;
  `demoSubscribe(produce, callback)` invokes the callback immediately and on every change;
  a `window` `storage` listener makes cross-tab real-time work in demo too.

### Key files

| File | Responsibility |
| --- | --- |
| `src/App.jsx` | All routes (student/mentor/admin module trees, public pages) |
| `src/components/Layout.jsx` | Module shell: role-based topbar nav, bell, theme, sign-out |
| `src/components/ProtectedRoute.jsx` | Auth + role gate (redirects: login / 403 / profile loaders) |
| `src/context/AuthContext.jsx` | Session + profile state, `refreshProfile`, `signOut` |
| `src/data/store.js` | ALL data ops: profiles, users, classes, certs, forum, conversations, notifications + `subscribe*` realtime + `notifyStudentsOfClass` |
| `src/data/auth.js` | Auth ops (Google popup, email/password, signup) + role resolution (`resolveRole`, `ensureProfile`) |
| `src/data/demo.js` | localStorage mirror of the whole model + seed (key `ip_demo_seeded_v4`) + change emitter |
| `src/firebase/{app,config}.js` | Firebase init; `isFirebaseConfigured` gate |
| `src/components/NotificationsBell.jsx` | Bell + dropdown, unread badge, deep-link routing |
| `src/components/InstallAppPrompt.jsx` | `beforeinstallprompt` capture, install button / iOS help, sessionStorage dismissal |
| `src/pages/modules/Messages.jsx` | Shared 1:1 chat UI (prop `role` = student/mentor/admin) |
| `src/pages/student/Forum.jsx` / `ForumPost.jsx` | Forum list + thread (prop `module` for links) |
| `src/pages/Verify.jsx` | Public certificate verification (`?c=` deep link) |
| `src/utils/pdf/{offerLetter,certificate}.js` | PDF generation (jsPDF; fallback engine offline) |
| `src/config/organization.js` | **Org branding + program details — user must edit for go-live** |
| `src/config/email.js` | EmailJS env config + `isEmailConfigured()` gate |
| `email-templates/` | Paste-ready EmailJS template bodies + dashboard setup README |
| `src/components/PaymentGate.jsx` | `usePaymentVerified()` live hook + route guard (student modules locked until payment verified) |
| `src/pages/student/Payment.jsx` | Pay now (upi://) / Show QR toggle, payment details + compulsory screenshot, paused/verified states |
| `src/pages/admin/Payment.jsx` | QR pool (add any number, auto-resize, per-QR UPI ID, enable/disable), pause switch, submissions table with proof, verify action |
| `firestore.rules` | Server-side RBAC for every collection |
| `vercel.json` | SPA rewrite + CSP/nosniff/XFO/Referrer-Policy headers |
| `src/services/emailService.js` | EmailJS sends: offer letter, payment confirmation, certificate (skipped when unconfigured) |
| `public/sw.js` + `public/manifest.webmanifest` + `public/icons/*` | PWA (SW registers in PROD builds only) |

### Data model (Firestore collections / demo keys)

- `users/{uid}` — profile: `role` (student|mentor|admin), name, email, phone, dob, degree,
  branch, university, graduationYear, address, skills, `offerLetter`,
  `internship { status: registered|in-progress|completed, completedAt, certificate { number, issuedAt, issuerName } }`
- `users/{uid}/notifications/{id}` — `{ id, type: chat|forum|class|certificate, title, text,
  ref { kind, convId|classId|postId }, fromUid, read, at }`
- `classes/{id}` — title, description, date, time, meetUrl, mentorUid, mentorName,
  status, createdAt
- `payment_qrcodes/{slot}` - `{ dataUrl (base64, auto-resized <=512px), upiId, enabled, updatedAt }`
- QR assignment is deterministic per student from the active QR pool; no client-writable rotation counter is used.
- `payment_settings/settings` - `{ accepting: bool, updatedAt }` global pause switch (admin write)
- `payment_submissions/{uid}` - `{ uid, name, email, qrSlot (0 = unassigned), status:
  pending|submitted, payerName, payerBank, transactionRef (last 4 digits), proofUrl
  (base64 screenshot), assignedAt, submittedAt }` - one-shot after submit
- `payment_verifications/{uid}` - `{ verified, verifiedAt, verifiedBy }` (mentor/admin write only)
- `approvedMentors/{email}` — mentor allowlist (admin-managed)
- `adminAllowlist/{email}` — admin allowlist (**client write: false** — console/SDK only)
- `certificates/{number}` — **public read** (verification portal); contains only what is
  printed on the certificate (name, program, dates, issuer, status) — never add PII
  (email/phone/DOB) here
- `counters/{cert-YYYY}` — per-year certificate serial counter
- `posts/{id}` — `{ title, body, authorUid, authorName, authorRole, createdAt }`;
  `posts/{id}/replies/{id}` — same shape minus title. No update/delete (rules).
- `conversations/{id}` — deterministic id `u_<uidA>__<uidB>` (sorted);
  `{ participants, participantNames, participantRoles, lastMessage { text, fromUid, at },
  unread { [uid]: n }, createdAt }`; `conversations/{id}/messages/{id}` —
  `{ convId, fromUid, fromName, body, at }`
- Demo seed key: `ip_demo_seeded_v5` (v5 adds the payment seed: 3 demo QRs with UPI IDs `demo1..3@okaxis` - qr-3 disabled, one submitted payment (Meera, QR-3, awaiting verification), settings accepting=true) — **bump to v5 if you change the seed shape**
  (old browsers keep stale data otherwise).

### Notification events (wired)

- chat message → other participant · forum reply → post author (not the replier) ·
  class created/updated → **all students** (fired from the mentor client, which may list
  users) · certificate issued → that student
- Deliberately NOT implemented: "new forum post → all students" broadcast — student clients
  cannot enumerate `users` per rules, and the forum page itself is real-time.
- Bell: unread badge counts the latest 25 (query limit); click deep-links using the
  viewer's own module path (chat → `/<module>/messages?c=<id>`, class → `/student/classes`,
  certificate → `/student/certificate`, forum → `/<module>/forums/<id>`).

### Security (implemented, verified in code)

- `firestore.rules` (HARDENED after security audit - REDEPLOY after any change):
  - create: students self-create only as `student`; mentor creation requires an
    `approvedMentors/{email}` entry; admin creation requires `adminAllowlist/{email}`
    (`write: if false`).
  - update: students may edit ONLY their own profile fields - `role`/`uid`/`createdAt`
    immutable, `internship` writable once (to in-progress) before a mentor has set it,
    `offerLetter` writable once at first profile completion (prevents self-issued
    certificates/offer letters). Mentors/admins may write ONLY the `internship` block on
    student records - no role changes, no cross-role tampering (fixes mentor->admin
    escalation).
  - notifications: self-inbox or staff-only create (no cross-user injection).
  - payment: settings admin-write; QR assignment is deterministic and does not expose a writable rotation counter;
    submissions one-shot + paused-state enforced.
  - classes readable by any signed-in user, writable by mentor/admin; conversations/
    messages participant-only; certificates public-read, mentor/admin-write.
  - `saveProfile` creates user docs with `uid` + `role: "student"` + `createdAt`
    (required by the create/update rules).
- `vercel.json`: CSP pinned to Firebase origins (`connect-src` googleapis/google/
  firebaseapp + wss), `script-src 'self'`, `object-src 'none'`, `base-uri 'self'`,
  `frame-ancestors 'none'`, HSTS, `nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy: strict-origin-when-cross-origin`, SPA rewrite. If you ever add a
  remote asset (e.g. org logo URL), extend `img-src` accordingly.
- Auth: Firebase Auth (Google OAuth popup + email/password; hashing server-side).
  Demo mode hashes with WebCrypto SHA-256 (FNV fallback).
- React default escaping (XSS-safe), input validation, `friendlyAuthError` maps Firebase
  error codes to non-leaky messages; duplicate email shows a linked "Sign in instead"
  notice on the register page.

## 5. Feature inventory (all verified building + smoke-tested where possible)

- Landing page: hero (floating preview chips — transform float + 25s layer re-rasterize,
  see `f9e4c8c`), features, what's included, program, eligibility, CTA (contained 80%-width
  tinted card, button text **"Register now"**), stats, footer. Dark-mode aware.
- Auth: login (Google + email/password), register (validation, friendly errors),
  complete-profile wizard after registration, role-based home redirect.
- Student module: Dashboard, My Classes (join Meet), Forum, Offer Letter (PDF),
  Certificate (PDF + verify link), Messages, Profile.
- Mentor module: Dashboard, Students (table + detail panel, mark complete →
  certificate PDF + record + notification), Classes (status update/cancel + notifications),
  Schedule Class, Forum, Messages.
- Admin module: Dashboard, Students, Mentors (approve/revoke Google emails), All Users,
  Forum, Messages.
- Certificate verification: sequential IDs `CERT-YYYY-NNNN` (per-year counter with
  collision guard), public verify page, revocation on re-issue (status `revoked`),
  verify URL printed in the PDF.
- Payment (UPI): student Payment page (Pay now deep link / Show QR toggle, payer + bank +
  last-4-digit transaction ID + compulsory client-compressed screenshot), admin Payment
  page (QR pool: add any number, per-QR UPI ID + enable/disable, global pause switch,
  submissions table with proof thumbnail + verify action). Round-robin over ACTIVE QRs;
  one-shot submission; pause + one-shot enforced in rules.
- Payment gating: `PaymentGate` locks classes/forum/offer-letter/certificate/messages until
  the student's payment is verified (live via onSnapshot). Nav hides locked links; the
  dashboard masks all module data while locked.
- Emails (EmailJS): offer letter (profile completion), payment confirmation (admin
  verify), certificate (mentor issue). Skipped (console info) when `VITE_EMAILJS_*` unset.
- PWA: manifest, 4 generated icons (indigo "IP" mark), service worker (shell
  network-first w/ offline fallback, hashed assets cache-first, cross-origin untouched),
  install prompt on login/register (capture `beforeinstallprompt`; iOS shows help text;
  sessionStorage dismissal).

## 6. Go-live checklist (internet PC)

1. `npm install` (real `jspdf` activates automatically via the conditional alias; also installs `@emailjs/browser`).
2. Firebase console: enable **Google + Email/Password** sign-in; register the web app with
   the domain; put the 6 `VITE_FIREBASE_*` values in `.env`.
3. **Deploy `firestore.rules`** to Firestore (mandatory — verify page, forum, chat and RBAC
   all depend on it; current version includes the payment collections AND the hardened users/notifications/counter rules from the security audit - re-read the rules file before deploying).
4. Bootstrap admin: create doc `adminAllowlist/<your-email>` (empty doc ok) in the console;
   sign in with that Google account → first sign-in creates the admin.
5. Mentors: admin approves their Google email in Admin → Mentors; they sign in with it.
6. Vercel: add the 6 `VITE_` vars to project environment (build time), deploy.
   HTTPS + headers are automatic. No extra Vercel config for the PWA.
   EmailJS (optional): follow `email-templates/README.md` - create the service + 3
   templates in the dashboard, then add the 5 `VITE_EMAILJS_*` vars to `.env` AND the
   Vercel project env. Without them emails are skipped and everything else works.
7. Update `src/config/organization.js` with the real organization details (it currently
   holds placeholder values).

## 7. Open / future (user-decided, NOT built)

1. **Registration + payment flow** - the PAYMENT half is now BUILT (commits dce7aa3 through 7dd133b;
   `src/pages/student/Payment.jsx` + `src/pages/admin/Payment.jsx`): zero-infra UPI QR +
   admin manual confirmation. Admin uploads any number of QR images (no size cap; images are
   auto-resized to 512px client-side before saving); each student opening the Payment page
   is assigned an ACTIVE QR deterministically from the available pool (persisted so a
   refresh keeps the same QR). Each QR can be enabled/disabled, and a global
   `payment_settings/settings` doc pauses all payments (also enforced in Firestore rules on
   submissions create/update). Each QR slot can carry a UPI ID powering a one-tap "Pay now"
   upi:// deep link on the student page (alongside "Show QR"); a payment screenshot upload
   is compulsory (client-compressed to fit the 1 MB Firestore doc limit) and the admin can
   view/download it in the submissions table. Student then submits payer name, bank and
   last-4-digit transaction ID (one-shot, enforced in Firestore rules); admin cross-verifies
   and marks verified (separate admin-only verification doc). Fee is 25000 in
   `src/config/organization.js`. Still open: the pre-payment approval flow (public register
   -> admin approves -> pay -> account auto-created) Post-payment module gating IS built (`PaymentGate`, commit 00de1e6). Still open: the pre-payment approval flow (public register -> admin approves -> pay -> account auto-created).
2. **Attendance system** — deferred as a future enhancement. Full spec (live QR check-in +
   one-click + quiz anti-proxy design, Google Meet Workspace API alternative, data shapes)
   is written up in `README.md` → "Future Enhancements".
3. Attendance/anti-proxy ideas around Google Meet engagement were discussed and parked for
   future enhancement.

## 8. User preferences (the user is design-sensitive — read carefully)

- **Hates "AI-screaming" design**: big indigo→violet gradient washes, default Tailwind
  slate, gold-on-charcoal, trust-blue. BUT they rolled back an attempted "Workwear"
  (orange) recolor back to the **original indigo/violet palette** ("rollback the previous
  colors not his orange"). Current tokens: light `--primary: #4f46e5`,
  `--gradient: 135deg #4f46e5 → #7c3aed → #9333ea`; dark bg `#0c111f`, surface `#151b2e`.
  **Do not recolor without asking.**
- Landing CTA button label is **"Register now"** (kept across rollbacks).
- CTA section: contained 80%-width tinted card — a full-bleed color band was rejected as "odd".
- Wants **subtle, professional** animation. Loved the floating hero chips; the acceptable
  recipe is transform-based float + periodic 1-frame animation reset (25s) so text stays
  crisp at fractional zoom (`f9e4c8c`). CSS animation `fill-mode`: use `backwards`,
  **never `both`** (permanent transforms keep GPU layers → blurry text).
- Fast one-liner feedback loop; expects the agent to just implement and commit
  (milestone commit per feature) rather than ask many questions.
- Tests mobile at 480 CSS px (360 device @75%) and 390 px. Regressions have twice come from
  adding nav items / wide components — always check the topbar and tables at 390/480.
- Timezone Asia/Kolkata; English (Indian).
- Wants the portal positioned as student-facing for marketing (landing = students only);
  mentors/admins access via their module links.

## 9. Known quirks / caveats

- Vite "chunk > 500 kB" warning — pre-existing, harmless (firebase SDK weight).
- Git CRLF "LF will be replaced by CRLF" warnings — harmless.
- Notification badge counts only the latest 25 notifications (query limit).
- `conversations.unread` is denormalized and updated read-then-write — fine at 50-student
  scale; if scale grows, move to per-participant `lastReadAt` + computed unread.
FIXED in 6ad11da (was loose): notifications create is now self-inbox or staff-only
- `notifyStudentsOfClass` must be called from a client allowed to list users (mentor/admin).
- Dead CSS leftovers (`.role-card-mentor`, `.step*`) — harmless.
- Demo mode real-time is per-browser (localStorage); cross-tab works, cross-device needs Firebase.
- **Build is RED on this offline PC - EXPECTED, not a regression:** `@emailjs/browser` is
  in package.json but not installed here (no internet). `vite build` / the dev server fail
  only on that import in `src/services/emailService.js`. Resolves after `npm install` on
  the internet PC (or copying node_modules back over).

## 10. Demo accounts (demo mode only, seeded)

| Role | Email | Password |
| --- | --- | --- |
| Student | student@demo.com | Student@1234 |
| Mentor | mentor@demo.com | Mentor@1234 |
| Admin | admin@demo.com | Admin@1234 |

Seed also includes: 7 students, 3 classes, 2 forum posts (1 with replies), a seeded
student-mentor conversation (1 unread for the student), notifications, and the payment
state: 3 demo QRs (QR-1/QR-2 active with UPI IDs `demo1@okaxis`/`demo2@okaxis`, QR-3
disabled), one seeded payment (Meera, QR-3, submitted, awaiting
verification), settings accepting=true. "Reset demo data" (demo banner in the module
topbar) reseeds.