# TEMPOYA Razorpay verification checkout setup

The website now has a 22-country one-time fee selector and the profile payment button calls server-side Razorpay order/verification functions. These functions are committed, but checkout is NOT live until the steps below are completed and tested.

## 1. Configure Razorpay TEST keys first

In the Razorpay Dashboard, use **Test Mode** and create API keys. Do not put either secret in HTML, JavaScript, GitHub, or chat.

From a trusted computer with Firebase CLI access to the `tempoya` project:

```bash
firebase use tempoya
firebase functions:secrets:set RAZORPAY_KEY_ID
firebase functions:secrets:set RAZORPAY_KEY_SECRET
```

Enter the Razorpay TEST key ID and TEST key secret when prompted. Never use live keys for the first test.

## 2. Configure Firebase App Check

The two Razorpay callable functions require App Check (`enforceAppCheck: true`). Register the web app in Firebase App Check, configure the appropriate web provider and allowed domain `tempoya.app`, then initialize App Check in the website with the issued site key before testing callable functions. Do not disable App Check as a production workaround.

## 3. Deploy only the Razorpay callable functions

```bash
firebase deploy --only functions:createRazorpayVerificationOrder,functions:verifyRazorpayVerificationPayment
```

If Firebase CLI reports that a required secret or project is missing, resolve that in the Firebase console/CLI before continuing. Do not paste secret values into GitHub.

## 4. Test in iPhone Safari with TEST mode

1. Sign in using a test account and save an adult profile.
2. Set the profile country to match the selected fee country.
3. Open **Your Profile → One-time account verification → Check Secure Verification Payment**.
4. Confirm Razorpay Checkout opens in test mode and complete a test payment using Razorpay's current official test instructions.
5. Confirm the server verifies the payment and writes the paid state once.
6. Tap the payment button again. It must refuse to create a second charge after the account is paid.
7. Test cancellation, failed payment, invalid signature, and repeat webhook/callback behavior.

## 5. Before live payments

- Obtain Razorpay merchant approval and enable the relevant payment methods/currencies for each country.
- Confirm that the merchant account can actually accept and settle the intended currency in every target country. The website's local-currency labels alone do not prove Razorpay supports checkout for that country/currency.
- Check provider minimums, tax, consumer law, refund policy, and whether a one-unit charge is viable for each currency.
- Only after the full test checklist passes should live keys be configured using Firebase secrets. Never commit live keys.
- A successful fee payment currently sets `verificationStatus: payment_received_pending_review`; it does not itself prove identity or automatically approve a profile.

## Important limitations

This integration adds a Razorpay order flow and server-side payment verification. It does not make merchant approval, Firebase deployment, App Check setup, international currency support, or live payments automatic. The dedicated fee page is informational; checkout begins after sign-in and saving a matching profile.
