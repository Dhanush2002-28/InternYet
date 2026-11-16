import { send } from "@emailjs/browser";
import { emailConfig, isEmailConfigured } from "../config/email";
import { organization } from "../config/organization";
import { formatDate } from "../utils/format";

function feeText() {
  return `₹${Number(organization.fee || 0).toLocaleString("en-IN")}`;
}

async function dispatch(templateKey, params) {
  if (!isEmailConfigured()) {
    console.info(`[email] EmailJS not configured - skipped "${templateKey}" for ${params.email || "unknown recipient"}`);
    return { skipped: true };
  }
  return send(
    emailConfig.serviceId,
    emailConfig.templates[templateKey],
    params,
    { publicKey: emailConfig.publicKey }
  );
}

// Sent when a student completes their profile and the offer letter is generated.
export function sendOfferLetterEmail(profile) {
  const offer = profile.offerLetter || {};
  return dispatch("offerLetter", {
    email: profile.email || "",
    student_name: profile.name || "",
    offer_number: offer.number || "",
    organization: organization.name,
    program: organization.program,
    duration: organization.duration,
    stipend: organization.stipend,
    contact_email: organization.email,
    contact_phone: organization.phone,
    issued_at: formatDate(offer.issuedAt)
  });
}

// Sent when the admin verifies a student's payment.
export function sendPaymentConfirmationEmail(student, submission, verification) {
  return dispatch("paymentConfirmed", {
    email: student.email || submission.email || "",
    student_name: student.name || submission.name || "",
    fee: feeText(),
    qr_slot: submission.qrSlot,
    payer_name: submission.payerName || "",
    payer_bank: submission.payerBank || "",
    transaction_ref: submission.transactionRef || "",
    verified_by: verification?.verifiedBy || "Admin",
    verified_at: formatDate(verification?.verifiedAt)
  });
}

// Sent when a mentor marks the internship complete and the certificate is issued.
export function sendCertificateEmail(student, certificate, completedAt) {
  return dispatch("certificate", {
    email: student.email || "",
    student_name: student.name || "",
    certificate_number: certificate.number || "",
    organization: organization.name,
    program: organization.program,
    duration: organization.duration,
    completed_at: formatDate(completedAt || certificate.issuedAt),
    issued_by: certificate.issuerName || "",
    portal_url: `${window.location.origin}/student/certificate`,
    verify_url: `${window.location.origin}/verify?c=${encodeURIComponent(certificate.number || "")}`
  });
}