# Thaluwa Bazar — Feature Audit & Remaining Work Summary

### 1. Critical Missing Links & Stubs (P0 Priority)

1. **Real Payment Gateway & UPI Deep-Link Integration:**
   - **Current State:** `src/app/checkout/index.tsx` accepts UPI, Card, or Netbanking selections, but immediately generates a database order without initiating a UPI intent (`upi://pay`) or capturing gateway payment tokens.
   - **Remaining:** Integrate native UPI deep-linking (`upi://pay?pa=...`) and Razorpay / Cashfree SDK with backend webhook payment verification.

2. **Real-Time Push Notifications (Expo Notifications & FCM):**
   - **Current State:** ✅ **Fully Implemented**. `expo-notifications` and `expo-device` configured with SDK 58 support, device token auto-sync in `src/lib/notifications.ts` and `AuthContext.tsx`, automated Expo Go Android compatibility patch (`scripts/fix-expo-notifications.mjs`), live Supabase database-backed notifications screen with real-time websocket subscriptions, and backend `notificationService.ts` dispatching remote Expo push alerts.

3. **Seller Payouts Ledger & Missing Database Table:**
   - **Current State:** ✅ **Fully Implemented**. Backed by Supabase `seller_payouts` table, `adminController.ts` real UTR generation & disbursement, backend `sellerRoutes.ts` (`GET /api/seller/:id/payouts`, `POST /api/seller/payout`), and mobile `src/app/seller/earnings.tsx` live balance calculation, Supabase realtime updates, and withdrawal workflow.

4. **Interactive Reviews & Rating Submission:**
   - **Current State:** ✅ **Fully Implemented**. Added interactive `ReviewModal` in `src/components/ReviewModal.tsx` and wired into `src/app/(tabs)/orders.tsx`. Completed orders feature bilingual "Rate & Review" buttons, interactive 1–5 star ratings, quick feedback tags (Fresh & Organic, Fast Delivery, Clean Packaging), direct submission to `POST /api/v1/reviews` and Supabase `reviews` table, and persistent local/cloud review status badges (`Reviewed (5★)`).

5. **Dynamic Producer Analytics:**
   - **Current State:** ✅ **Fully Implemented**. Replaced hardcoded bars in `src/app/seller/analytics.tsx` with dynamic revenue calculation from live completed orders (`useOrders()` & Supabase). Features 7-day chronological bar graph with proportional heights and peak revenue highlighting, period switching (7 Days, This Month, All Time), growth rate calculation, dynamic customer metrics (Local Impressions, Repeat Buyers, Completed Orders, AOV), and real-time top-selling product ranking by units and revenue.

---

### 2. High-Impact Core Enhancements (P1 Priority)

- **Native Device GPS & Assam Reverse Geocoding:** Auto-detect coordinates via `expo-location` and resolve user's exact village/district instead of defaulting to Guwahati coordinates.
- **In-App Direct Chat & Audio Voice Notes:** Provide 15–30s audio voice messaging via `expo-av` for rural SHG producers and village farmers who prefer speaking over typing.
- **Cloud Address Book Persistence:** Create `user_addresses` table in Supabase so addresses added in `src/app/addresses.tsx` persist across devices.
- **Advanced Produce Catalog Filters:** Price range sliders, Organic-certified toggle (`is_organic`), in-stock only filter, and sort options ("Nearest First", "Price Low to High").
- **B2B Bulk / Wholesale Produce Requests:** Volume-tiered pricing (e.g., 1–5 kg vs >20 kg) and "Request Bulk Quote" for local restaurants, caterers, and grocery stores.

---

### 3. Rural Accessibility & Scaling (P2 Priority)

- **Assamese Voice Search:** Conversational speech-to-text product search (e.g., *"মোক ২ কেজি জহা চাউল লাগে"*).
- **Offline First Support & Sync Queue:** Cache nearby catalog listings for areas with weak or intermittent 3G/4G network coverage.
- **Village Delivery Partner ("Village Delivery Hero") Role:** Third app role for local youth with bicycles/motorcycles to deliver produce from farm clusters to pickup points.
- **Automated SMS Fallback:** Send SMS alerts via Twilio/Gupshup if a producer has not opened an order confirmation within 15 minutes.

---

The full breakdown, architectural status, database schemas, and recommended multi-sprint plan are documented in:
📄 [features.md](file:///u:/SHGC/features.md)
