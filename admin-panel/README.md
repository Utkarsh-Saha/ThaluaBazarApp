# Thaluwa Bazar — Admin & Operations Control Panel (থলুৱা বজাৰ)

Modern, production-ready desktop and web operations dashboard for **Thaluwa Bazar**, an Assamese rural-to-urban SHG marketplace startup (Darrang district pilot).

---

## 🌟 Key Features

1. **Executive KPI Overview:**
   - 2x2 Real-Time Metric Matrix: Total Users, Total Sellers (Verified vs Pending), Total Orders, and Platform GMV in ₹ (INR).
   - Top-performing SHG collectives & live order stream.

2. **Producer KYC & Authenticity Registry:**
   - Review pending SHG member applications, farmer certificates, and artisan IDs.
   - Inspect bank account info (IFSC), digital UPI IDs, and delivery radii.
   - One-click **Approve & Award Gold Badge** (triggers push notification to seller device) or **Reject with Remarks**.

3. **Global Order Ledger & Moderation:**
   - State-machine tracking (`REQUESTED` ➔ `ACCEPTED` ➔ `READY_FOR_PICKUP` ➔ `COMPLETED` ➔ `CANCELLED`).
   - Order manifest inspection and administrative state overrides with recorded audit logs.

4. **Weekly Rural Haat Aggregation Hubs:**
   - Manage market schedules (Mangaldai, Sipajhar, Kharupetia, Tangla).
   - Assign local market coordinators and track active stall counts.

5. **Financial Settlement & Payouts Engine:**
   - Weekly batch disbursals to rural SHG bank accounts with UTR reference generation.
   - Cash-on-Delivery (COD) reconciliation.

6. **Bilingual Localization:**
   - Instant toggle between **English** and **Assamese (অসমীয়া)**.

7. **Zero-Setup Live & Demo Resilience:**
   - Automatically connects to `http://localhost:5000/api/v1`.
   - Seamless offline fallback with interactive local state simulation.

---

## 🚀 Quick Start

```bash
# Navigate to admin panel directory
cd admin-panel

# Install dependencies
npm install

# Run local development server
npm run dev
```

Server will start at `http://localhost:5173`.
