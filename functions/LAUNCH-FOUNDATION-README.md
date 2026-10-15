# Launch foundation integration notes

The functions are wired from index.js but are NOT proven production-ready.

## Before deployment
1. Run `npm install` in functions/ and `node --check index.js && node --check launch-foundation.js`.
2. Add emulator tests for the callable functions and review Firestore rules. Do not deploy until tests pass.
3. Register emergency-contact device tokens only after explicit contact consent. The current requestSOS reads tokens from `emergencyContactDevices/{uid}/tokens/{token}`; this repository does not yet include the trusted-contact registration UI.
4. Add server-only Firestore rules for privateEmergencyContacts, sosEvents, and emergencyContactDevices. Clients must not read private contact data or write SOS delivery statuses.
5. Booking documents must contain members: [uid1, uid2]. Verify all booking creation paths and rules before enabling completion.
6. SOS returns provider acceptance, not proof of receipt/read. Display fallback contact and local emergency services.
7. `confirmBookingCompletion` only records both confirmations and moves to payment_review_pending. It never releases money.
8. Do not enable marketplace payments/refunds until provider settlement/connected accounts, webhooks, idempotency, reconciliation, disputes and country eligibility are implemented and approved.
9. This does not create native Android/iOS projects or prove real SMS delivery.
