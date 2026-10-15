# TEMPOYA Production Readiness Audit
Date: 2026-10-15
Branch: fix/tempoya-pricing-audit
Scope: static source inspection only; no production deployment or live payment test was performed.

## Confirmed in source
- 22 countries and currency metadata are configured in country-currency-config.js.
- Basic, Standard, and Premium duration tariffs are present in the website preview.
- Firebase phone-auth UI, profile form, limited discovery, mutual-like matching, chat, and booking-request prototype exist.
- Firestore and Storage rules are present.
- A Stripe-based one-time verification checkout Cloud Function and Stripe webhook are present in functions/index.js.

## Production blockers (do not advertise as live)
1. Website copy explicitly calls the product an informational/preview build; App Store and Google Play links say Coming Soon.
2. The website tariff preview uses the same numeric tier amounts for all countries and merely appends each selected currency symbol/code. These are not localized/FX-equivalent prices. Do not collect international payments until a reviewed per-country price table is approved.
3. Payment backend is Stripe, not Razorpay. Razorpay approval does not activate this Stripe implementation. Confirm the provider, merchant eligibility, currency support, and secrets before enabling checkout.
4. Verification fee is configured as nominal local-currency values. Provider minimums and currency minor-unit handling differ by currency; confirm each amount before live use.
5. Booking requests explicitly set paymentStatus to not_enabled. There is no protected payment hold/release flow in this prototype.
6. The inspected website source states SOS/live-location alerts are planned/not enabled; emergency contacts and SOS must not be presented as operational.
7. Android/iOS builds and store listings are not present in the inspected website source.
8. Deployment workflow deploys GitHub Pages on pushes to main. It does not itself prove Cloudflare Worker or Firebase Functions deployment. Production domains must be checked separately.
9. Static review is not a security test. Test Firestore/Storage rules in Firebase Emulator and review all client/server authorization paths before onboarding real users.

## Release gates
- Confirm per-country tier prices and currency-minor-unit handling.
- Select and complete one payment-provider integration; configure secrets server-side and verify signed webhooks, refunds, duplicate callbacks, and payment reconciliation.
- Add server-authoritative booking/payment state machine. Never release money based only on client-side claims.
- Finish age/identity verification, abuse reporting/moderation, block enforcement, deletion/export, emergency-contact consent and SOS operations.
- Test Firebase auth, App Check, authorized domains, Firestore/Storage rules, and Functions in a staging project.
- Run automated link/form checks, mobile responsive checks, and end-to-end tests.
- Verify the intended production deployment target (Cloudflare Worker vs GitHub Pages vs Firebase Hosting) and deploy only after staging passes.
- Complete legal, privacy, tax, consumer-protection and app-store reviews for each launch market.

## Safety note
Do not use this preview to collect real user payments or represent verification, booking escrow, SOS, identity checks, or mobile apps as live until the relevant systems have been deployed and independently tested.
