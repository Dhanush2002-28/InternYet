const ALLOWED_TEMPLATES = new Set([
  "offerLetter",
  "paymentConfirmed",
  "certificate"
]);

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function verifyFirebaseUser(request) {
  const authorization = request.headers.get("authorization") || "";
  const idToken = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";
  const apiKey = process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY;
  if (!idToken || !apiKey) {
    throw new Error("Authentication is not configured.");
  }

  const authResponse = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ idToken })
    }
  );
  if (!authResponse.ok) throw new Error("Invalid session.");

  const authData = await authResponse.json();
  const account = authData.users?.[0];
  if (!account) throw new Error("Invalid session.");
  return {
    uid: account.localId,
    email: account.email || ""
  };
}

async function getUserRole(user) {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error("Firebase project is not configured.");

  const apiKey = process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY;
  const authorization = user.idToken;
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/users/${encodeURIComponent(user.uid)}`,
    {
      headers: authorization
        ? { authorization: `Bearer ${authorization}` }
        : {}
    }
  );
  if (!response.ok) return "student";

  const document = await response.json();
  const role = document.fields?.role?.stringValue;
  return role === "admin" || role === "mentor" ? role : "student";
}

function templateMessage(templateKey, params) {
  if (templateKey === "offerLetter") {
    return {
      subject: `Your offer letter - ${params.offerNumber || "Internship"}`,
      html: `
        <p>Dear ${escapeHtml(params.studentName)},</p>
        <p>Your internship offer letter ${escapeHtml(params.offerNumber)} has been generated.</p>
        <p><strong>Program:</strong> ${escapeHtml(params.program)}<br>
        <strong>Organization:</strong> ${escapeHtml(params.organization)}<br>
        <strong>Duration:</strong> ${escapeHtml(params.duration)}<br>
        <strong>Stipend:</strong> ${escapeHtml(params.stipend)}</p>
        <p>Contact: ${escapeHtml(params.contactEmail)}${params.contactPhone ? ` | ${escapeHtml(params.contactPhone)}` : ""}</p>
      `
    };
  }

  if (templateKey === "paymentConfirmed") {
    return {
      subject: "Your internship payment has been verified",
      html: `
        <p>Dear ${escapeHtml(params.studentName)},</p>
        <p>Your payment of ${escapeHtml(params.fee)} has been verified.</p>
        <p><strong>Verified by:</strong> ${escapeHtml(params.verifiedBy)}<br>
        <strong>Verified at:</strong> ${escapeHtml(params.verifiedAt)}</p>
      `
    };
  }

  return {
    subject: "Your internship certificate is ready",
    html: `
      <p>Dear ${escapeHtml(params.studentName)},</p>
      <p>Your certificate ${escapeHtml(params.certificateNumber)} has been issued.</p>
      <p><strong>Organization:</strong> ${escapeHtml(params.organization)}<br>
      <strong>Program:</strong> ${escapeHtml(params.program)}<br>
      <strong>Completed:</strong> ${escapeHtml(params.completedAt)}</p>
      ${params.verifyUrl ? `<p><a href="${escapeHtml(params.verifyUrl)}">Verify your certificate</a></p>` : ""}
    `
  };
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    const authorization = request.headers.get("authorization") || "";
    const idToken = authorization.startsWith("Bearer ")
      ? authorization.slice("Bearer ".length).trim()
      : "";
    const user = await verifyFirebaseUser(request);
    user.idToken = idToken;

    const body = await request.json();
    const templateKey = body.templateKey;
    const params = body.params || {};
    const recipient = String(params.email || "").trim();

    if (!ALLOWED_TEMPLATES.has(templateKey)) {
      response.status(400).json({ error: "Invalid email template." });
      return;
    }
    if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
      response.status(400).json({ error: "A valid recipient email is required." });
      return;
    }

    const role = await getUserRole(user);
    if (templateKey === "offerLetter") {
      if (role !== "student" || recipient !== user.email) {
        response.status(403).json({ error: "Not allowed to send this email." });
        return;
      }
    } else if (templateKey === "paymentConfirmed") {
      if (role !== "admin") {
        response.status(403).json({ error: "Only admins may send payment confirmations." });
        return;
      }
    } else if (role !== "mentor" && role !== "admin") {
      response.status(403).json({ error: "Only mentors or admins may send certificate emails." });
      return;
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    const fromName = process.env.RESEND_FROM_NAME || "Internship Portal";
    if (!resendApiKey || !fromEmail) {
      response.status(503).json({ error: "Email delivery is not configured." });
      return;
    }

    const message = templateMessage(templateKey, params);
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${resendApiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [recipient],
        subject: message.subject,
        html: message.html
      })
    });
    const data = await response.json();
    if (!response.ok) {
      console.error("Resend error:", data);
      response.status(502).json({ error: "Email delivery failed." });
      return;
    }

    response.status(200).json({ id: data.id });
  } catch (error) {
    response.status(401).json({ error: error.message || "Authentication failed." });
  }
}
