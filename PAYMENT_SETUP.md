# Payment setup

Live API credentials are configured locally in the ignored `.env.local` file.
Set the same server environment variables on the production host:
`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`,
plus the existing public Supabase URL and anon key. Never make the key secret public.

1. Run `supabase/migrations/20261027_checkout_sessions.sql` in Supabase SQL Editor if needed. The existing orders schema is also required.
2. Generate a separate random webhook secret and set `RAZORPAY_WEBHOOK_SECRET` on the host.
3. In the live Razorpay dashboard, add `https://YOUR-DOMAIN/api/razorpay/webhook` with that same secret. Subscribe to `payment.authorized`, `payment.captured`, and `order.paid`.
4. Deploy/restart after changing environment variables.
5. Verify with a controlled purchase: check capture in Razorpay, one order in My Orders and admin Orders, and successful webhook delivery. Redeliver the event and confirm no duplicate order.

The server checks the payment's order, currency, amount, and captured status before saving a paid order. Authorized payments are captured server-side. The signed webhook confirms orders even if the customer closes checkout. It does not issue automatic refunds. Refunds need a separate business policy and workflow.

Live payment, production deployment, database migration, and dashboard webhook setup have not been performed by this code change.
