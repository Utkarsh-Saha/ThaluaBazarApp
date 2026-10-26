# Thaluwa Bazar — Feature Audit & Remaining Work Summary

### 1. Critical Missing Links & Stubs (P0 Priority)

1. **Real Payment Gateway & UPI Deep-Link Integration:**
   - **Current State:** `src/app/checkout/index.tsx` accepts UPI, Card, or Netbanking selections, but immediately generates a database order without initiating a UPI intent (`upi://pay`) or capturing gateway payment tokens.
   - **Remaining:** Integrate native UPI deep-linking (`upi://pay?pa=...`) and Razorpay / Cashfree SDK with backend webhook payment verification.

---

### 2. High-Impact Core Enhancements (P1 Priority)

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
