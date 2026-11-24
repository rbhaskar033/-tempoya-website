# TEMPOYA Razorpay test integration

This repository is a static HTML website. The checkout backend is implemented as **Cloudflare Pages Functions** under `functions/api/`; it will not run on GitHub Pages alone.

## Security status

- This build deliberately supports **test mode only**.
- The only accepted order is a fixed ₹1.00 test order. It cannot charge the site's displayed tariffs.
- Do not put credentials in source files or commit a real `.env`.
- The Razorpay secret pasted into chat should be rotated in the Razorpay Dashboard before use.

## Configure Cloudflare Pages

In Cloudflare Dashboard, open the Pages project serving TEMPOYA, then Settings → Variables and Secrets. Add these as encrypted secrets/variables for the **Preview** environment first:

- `RAZORPAY_KEY_ID`: a newly generated Razorpay **Test Mode** Key ID beginning `rzp_test_`
- `RAZORPAY_KEY_SECRET`: its matching Test Mode Secret
- `PAYMENTS_MODE`: `test`

Deploy the repository using Cloudflare Pages with the repository root as the build directory and no build command for this static site. Ensure Pages Functions are enabled by deploying the `functions/` directory from the repository root. A GitHub Pages deployment will serve the HTML but will not execute these API routes.

## Test

1. Deploy to a Cloudflare Pages Preview URL.
2. Open `/payment-test.html` on that preview URL.
3. Tap **Pay ₹1 test amount** and complete checkout using a Razorpay test payment method.
4. Confirm the page reports that the signature was verified.
5. Test dismissal and a failed payment as well. Invalid signatures should return HTTP 400.

## Important limitations

- This is an integration smoke test, not a production payment flow.
- It does not persist bookings, mark a booking paid, perform refund handling, or confirm capture via API/webhook.
- The existing 22-country price display is informational. This endpoint intentionally does not charge those tariffs.
- Do not enable live credentials or charge users until server-side product pricing, payment capture/webhook reconciliation, idempotency, refund/dispute handling, user authentication, consent/terms, taxes, and legal/provider review are completed.
