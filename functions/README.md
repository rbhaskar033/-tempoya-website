# TEMPOYA Firebase payment functions

The profile page calls these Firebase callable functions in region `asia-south1`:

- `createRazorpayVerificationOrder`
- `verifyRazorpayVerificationPayment`

They are backend source code and are **not live until deployed and configured**. A successful payment sets `verificationStatus` to `payment_received_pending_review`; it does not prove identity or grant a verified badge.

## Required setup before deployment

1. Confirm Firebase project ID is `tempoya`, billing is on the Blaze plan, and Cloud Functions / Secret Manager APIs are available.
2. In the Razorpay Dashboard, use **Test Mode** first and create a test Key ID and matching Key Secret.
3. In Firebase Secret Manager / Functions secrets, create these secrets:
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
4. The GitHub Actions workflow `.github/workflows/deploy-firebase-functions.yml` deploys the two Razorpay functions. It requires a GitHub Actions repository secret named `FIREBASE_SERVICE_ACCOUNT` containing a Google Cloud service-account JSON credential authorized to deploy Firebase Functions in project `tempoya`. Prefer short-lived Workload Identity Federation if you have an administrator who can configure it; never commit credentials or paste them into chat.
5. Open GitHub → repository → Actions → **Deploy TEMPOYA Firebase Payment Functions** and run it manually, or push a change to `functions/**` after the required credentials and Firebase secrets are configured.
6. Configure Firebase App Check for the web app and ensure `app.tempoya.app` is an allowed/authenticated domain.
7. Verify Firestore rules are published. Clients must not be able to write `verificationPayments/{uid}` or protected verification fields on `users/{uid}`.
8. Test a complete Razorpay test checkout, server-side signature verification, declined payment, abandoned checkout, duplicate clicks, and replayed/incorrect payment details before enabling live mode.

## Important limitations

- The profile page uses Razorpay. The Stripe functions in `index.js` are a separate implementation and are not the checkout path used by the profile page.
- The current Razorpay function verifies the checkout signature and then checks the payment with Razorpay for a matching captured payment. It is not a complete booking escrow/payment-hold/release system.
- Country/currency entries are configured in code but provider eligibility, international payment support, minimum charges, taxes, refunds and local consumer requirements must be confirmed for each country. Do not claim all 22 countries are live until each has been tested.
- A one-time fee is for account verification only. Identity review must remain a separate process.
- Do not enable live charges until end-to-end tests and the applicable business, payment-provider, tax, refund and legal requirements are complete.
- Never commit Razorpay or Stripe secret keys, webhook secrets, service-account credentials, or other private keys.
