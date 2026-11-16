const env = import.meta.env;

export const emailConfig = {
  publicKey: env.VITE_EMAILJS_PUBLIC_KEY || "",
  serviceId: env.VITE_EMAILJS_SERVICE_ID || "",
  templates: {
    offerLetter: env.VITE_EMAILJS_TEMPLATE_OFFER_LETTER || "",
    paymentConfirmed: env.VITE_EMAILJS_TEMPLATE_PAYMENT || "",
    certificate: env.VITE_EMAILJS_TEMPLATE_CERTIFICATE || ""
  }
};

export function isEmailConfigured() {
  return Boolean(
    emailConfig.publicKey.startsWith("eyJ") &&
    emailConfig.serviceId.length > 0 &&
    Object.values(emailConfig.templates).every((id) => id.length > 0)
  );
}