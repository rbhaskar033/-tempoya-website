# TEMPOYA one-time verification payment backend

This folder contains Firebase Cloud Functions for a server-controlled Stripe Checkout flow.

## Important status
- This is backend source code, not a live payment integration until deployed and configured.
- No payment is collected by the static website yet.
- A successful payment webhook marks the account as `payment_received_pending_review`; it does NOT automatically prove identity or grant a verified badge.
- Amounts are nominal country-local amounts. Before enabling live charging, verify Stripe merchant eligibility, supported currencies, payment minimums, settlement rules, taxes, refunds/consumer rights, and country-specific requirements. Some local-currency minimums may make a one-unit fee impossible.
- Stripe may not be available to every merchant or every cross-border flow. Do not advertise all 22 countries as live until tested.
- Firestore rules must deny client writes to `verificationPayments` and to protected verification fields on `users`. Admin SDK Cloud Functions bypass Firestore rules.
- Use test mode first; only enable live mode after end-to-end verification.

## Deploy setup
1. From the repository root, install Firebase CLI and run `firebase init functions` choosing JavaScript and Node 20. Keep existing website files.
2. In the Firebase project console, confirm Blaze billing is enabled and Cloud Functions is available in the project region.
3. In Stripe Dashboard, create a test-mode account and webhook endpoint for `stripeVerificationWebhook`. Subscribe to `checkout.session.completed` and `checkout.session.async_payment_succeeded`.
4. Store secrets, never in Git:
   `firebase functions:secrets:set STRIPE_SECRET_KEY`
   `firebase functions:secrets:set STRIPE_WEBHOOK_SECRET`
5. Deploy: `firebase deploy --only functions:createVerificationCheckout,functions:stripeVerificationWebhook`
6. Enable App Check for the web app and configure allowed origins/domains.
7. Add Firestore rules preventing clients from writing `verificationPayments/{uid}` and fields `verificationFeePaid`, `verificationFeePaidAt`, `verificationFeeCountry`, `verificationFeeCurrency`, `verificationStatus` on `users/{uid}`. Keep the user profile editable only for ordinary profile fields.
8. Connect the website to call `createVerificationCheckout` only after the profile is saved; redirect to the returned `checkoutUrl`.
9. Test duplicate clicks, parallel requests, abandoned sessions, successful payment, declined payment, webhook retries, changed country, and attempts to edit protected fields before enabling live payments.

Never commit Stripe secret keys, webhook secrets, service-account credentials, or other private keys.
