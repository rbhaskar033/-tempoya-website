# TEMPOYA launch foundation — review required

This branch adds callable backend foundations for private emergency-contact storage, SOS push attempts with delivery-status records, and two-party booking-completion confirmations.

## Important limitations
- These functions are not live until reviewed, exported from functions/index.js, deployed, and tested with Firebase Authentication/App Check.
- SOS push sends to tokens registered at emergencyContactDevices/{uid}/tokens. A trusted emergency contact app/device registration flow is not included here, so no delivery can be assumed.
- Push provider acceptance does not prove that a person received/read the alert. Always show a call fallback and local emergency-services guidance.
- Completion confirmation does not release money. A safe marketplace payment hold/release requires provider support, connected-account/settlement configuration, refunds/disputes, idempotency, webhook verification, reconciliation, and legal review. Do not represent Stripe Checkout alone as escrow.
- SMS OTP must be tested on real phones in each target country; test mode/emulator cannot prove SMS delivery.
- Country/currency display is not proof of payment-provider availability or legal permission.
- This repository has no verified native Android/iOS app project or store submission. A web backend does not create native builds.
- Do not deploy production changes until Firestore rules tests and security review pass.

# TEMPOYA launch gate checklist

## Live checks required
- [ ] Firebase Phone Auth: authorized domains, reCAPTCHA/App Check, billing/quota, SMS delivery on real devices.
- [ ] Booking: authenticated participants only, mutual match, future time, idempotent status transitions, cancellation and dispute paths.
- [ ] Payment: approved provider/merchant account, supported country/currency, verified webhook signatures, replay/idempotency protection, refund and reconciliation tests. No claim of escrow unless provider supports it.
- [ ] SOS: contact consent, token registration, device permissions, success/failure states, delivery fallback, emergency contact test with consent.
- [ ] Privacy: data minimization, deletion/retention, contact-data access restrictions, country-specific privacy/legal review.
- [ ] 22 countries: provider eligibility, currency minor units, local fees/tax, consumer terms, sanctions/merchant restrictions and localization.
- [ ] Android/iOS: native project, signing credentials, real-device test matrix, store metadata/privacy declarations, review and approval.
- [ ] Run emulator tests, staging smoke tests, webhook replay tests, access-control tests, and rollback plan before production.
