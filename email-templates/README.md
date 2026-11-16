# EmailJS templates

Paste-ready content for the three EmailJS templates. The `Subject:` and `To:` lines at
the top of each file show what to fill in on the EmailJS dashboard; everything after
that is the HTML body (inline styles only, so it renders in every mail client).

## Setup (on the internet PC, ~10 minutes)

1. Create a free account at https://dashboard.emailjs.com.
2. **Email Services** -> Add a service (Gmail/Outlook/custom SMTP) -> send the test email
   from the dashboard. Copy the **Service ID** and your **Public Key** (Account details).
3. **Email Templates** -> Create a template for each file in this folder:
   - `offer-letter.txt`      -> To: `{{email}}`, subject from the file, HTML body from the file
   - `payment-confirmation.txt` -> same pattern
   - `certificate.txt`       -> same pattern
   Use the plain text variable editor for the body (the `{{variable}}` tags must remain).
4. Copy each template's **Template ID** and the Service ID / Public Key into `.env`:
   ```
   VITE_EMAILJS_PUBLIC_KEY=eyJ...
   VITE_EMAILJS_SERVICE_ID=default_service
   VITE_EMAILJS_TEMPLATE_OFFER_LETTER=tpl_xxx
   VITE_EMAILJS_TEMPLATE_PAYMENT=tpl_yyy
   VITE_EMAILJS_TEMPLATE_CERTIFICATE=tpl_zzz
   ```
5. Rebuild/redeploy. While these values are empty the app runs normally and emails are
   skipped (a console info line is logged for each skipped send).

## Template variables (what the app sends)

- Offer letter: `email, student_name, offer_number, organization, program, duration,
  stipend, contact_email, contact_phone, issued_at`
- Payment confirmation: `email, student_name, fee, qr_slot, payer_name, payer_bank,
  transaction_ref, verified_by, verified_at`
- Certificate: `email, student_name, certificate_number, organization, program, duration,
  completed_at, issued_by, portal_url, verify_url`

If you edit a template here, keep the `{{variable}}` names in sync with
`src/services/emailService.js`.

## Notes

- The EmailJS public key is meant to be public (like a Firebase API key). The app only
  triggers real events (profile completion, admin verification, mentor issuance); volume
  is naturally bounded by the cohort size. EmailJS free-tier limits still apply.
- Set each template's sender/reply-to to the program contact address so student replies
  land with the team.