import { organization } from "../config/organization";
import { formatDate } from "../utils/format";
import { auth } from "../firebase/app";

function feeText() {
  return `₹${Number(organization.fee || 0).toLocaleString("en-IN")}`;
}

async function dispatch(templateKey, params) {
  if (!auth?.currentUser) {
    console.info(`[email] No authenticated user - skipped "${templateKey}"`);
    return { skipped: true };
  }
  try {
    const idToken = await auth.currentUser.getIdToken();
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${idToken}`
      },
      body: JSON.stringify({ templateKey, params })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Email delivery failed.");
    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      console.info(`[email] Email API unavailable locally - skipped "${templateKey}"`);
      return { skipped: true };
    }
    throw error;
  }
}

// Sent when a student completes their profile and the offer letter is generated.
export function sendOfferLetterEmail(profile) {
  const offer = profile.offerLetter || {};
  return dispatch("offerLetter", {
    email: profile.email || "",
    studentName: profile.name || "",
    offerNumber: offer.number || "",
    organization: organization.name,
    program: organization.program,
    duration: organization.duration,
    stipend: organization.stipend,
    contactEmail: organization.email,
    contactPhone: organization.phone,
    issuedAt: formatDate(offer.issuedAt)
  });
}

// Sent when the admin verifies a student's payment.
export function sendPaymentConfirmationEmail(student, submission, verification) {
  return dispatch("paymentConfirmed", {
    email: student.email || submission.email || "",
    studentName: student.name || submission.name || "",
    fee: feeText(),
    qrSlot: submission.qrSlot,
    payerName: submission.payerName || "",
    payerBank: submission.payerBank || "",
    transactionRef: submission.transactionRef || "",
    verifiedBy: verification?.verifiedBy || "Admin",
    verifiedAt: formatDate(verification?.verifiedAt)
  });
}

// Sent when a mentor marks the internship complete and the certificate is issued.
export function sendCertificateEmail(student, certificate, completedAt) {
  return dispatch("certificate", {
    email: student.email || "",
    studentName: student.name || "",
    certificateNumber: certificate.number || "",
    organization: organization.name,
    program: organization.program,
    duration: organization.duration,
    completedAt: formatDate(completedAt || certificate.issuedAt),
    issuedBy: certificate.issuerName || "",
    portalUrl: `${window.location.origin}/student/certificate`,
    verifyUrl: `${window.location.origin}/verify?c=${encodeURIComponent(certificate.number || "")}`
  });
}