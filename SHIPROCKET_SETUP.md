# Shiprocket shipping setup

## Database: run this first

Open Supabase → SQL Editor and run:

`supabase/migrations/20261027_shiprocket.sql`

This adds a separate `shiprocket_shipments` table linked to `orders.id`.
It stores packed weight (kg), length/breadth/height (cm), pickup location,
Shiprocket reference, Shiprocket order ID, shipment ID, AWB, courier and booking state.
The table is protected with RLS; only the server service role can access it.
No new columns are required on your existing orders table.

If checkout sessions have not been set up yet, also run the payment migration
`supabase/migrations/20261027_checkout_sessions.sql` from the earlier payment change.

## Server configuration

The supplied Shiprocket credentials have been saved in the ignored `.env.local`.
On the deployment host, add these **server-only** environment variables:

- `SHIPROCKET_EMAIL`
- `SHIPROCKET_PASSWORD`
- `SUPABASE_SERVICE_ROLE_KEY` (already used by payments/admin)

Keep the existing Supabase URL and anon-key configuration. Restart/redeploy after changes.
Do not prefix Shiprocket credentials with `NEXT_PUBLIC_`.

Shiprocket requires an API user. If the supplied credentials are for the main account,
create an API user in Shiprocket → Settings → API → Add New API User, enable order,
shipment and buyer-detail access, and use that API user's credentials in the variables above.
See https://apidocs.shiprocket.in/ for the account/API requirements.

## Where to enter measurements

1. Open **Admin → Shipping** (`/admin/shipping`), or expand an order in **Admin → Orders** and click **Ship with Shiprocket**.
2. Select an order with a captured online payment.
3. Enter the **exact pickup location name already saved in Shiprocket**.
4. Enter total **packed weight in kg** and outer package **length, width/breadth and height in cm**. Example: 0.5 kg, 15 × 12 × 6 cm.
5. Click **Create in Shiprocket**.
6. In Shipment bookings, click **Assign courier & AWB**. Shiprocket chooses an available courier using the account's settings; this can use the account's shipping balance.
7. Click **Request courier pickup**.
8. After physical collection, mark the order **Shipped** in Admin → Orders. Later delivery statuses remain manually managed. This change does not add automatic courier tracking webhooks, label generation, cancellation sync or returns booking.

## IDs

- Purnya ID: the existing customer-facing order number, unchanged.
- Shiprocket reference: a stable numeric reference generated for each Purnya order.
- Shiprocket order ID: the provider's returned order ID.
- Shipment ID: the provider's returned shipment ID, used to assign AWB and request pickup.
- AWB: the actual courier tracking number, copied into the existing order tracking fields.

All five are visible on Admin → Shipping. Repeated clicks/concurrent creates cannot create a second local booking.

## Failures and recovery

If an external action times out or returns an uncertain result, the booking is held for review.
Search its **Shiprocket reference** in the Shiprocket dashboard before doing anything else.
Complete the action there if needed. Do not create a replacement order blindly.
If a server stopped during an operation, the booking can remain in its processing state;
check the dashboard before changing it in SQL.

After confirming the provider's actual result, an operator can correct the row in
Supabase Table Editor (server-side only):

- If creation succeeded, fill the returned `shiprocket_order_id` and `shipment_id`, then set `state = created`.
- If AWB assignment succeeded, fill `awb_code` and `courier_name`, then set `state = awb_assigned`.
- If pickup succeeded, set `state = pickup_requested`.
- If AWB/pickup definitely failed, restore the last confirmed state (`created` / `awb_assigned`) to retry.
- Delete a failed creation row only after confirming **no order exists** for its reference in Shiprocket.

When recovering manually, also copy the real AWB/courier into Admin Orders if necessary.
Pickup scheduling is not physical dispatch. Cancellation in Purnya does not cancel a provider booking; cancel that separately in Shiprocket.

## Validation performed

- `node --test tests/shiprocket.test.mjs`: parcel/address validation, totals, server auth,
  permission checks, unpaid-order rejection, concurrent/duplicate requests and uncertain failure handling.
- `npx next build --webpack`: production compilation and TypeScript.

The SQL migration has not been run on your database. No live shipment or pickup was created.
A live authentication check could not complete because the development environment could not resolve the Shiprocket API hostname.
