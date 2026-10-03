# 🌿 Thaluwa Bazar (থলুৱা বজাৰ) — Node.js & TypeScript Backend

Production-ready backend API service for **Thaluwa Bazar**, the hyperlocal community marketplace for rural Assam connecting farmers, SHGs (Self-Help Groups), and local artisans directly with buyers.

---

## 🚀 Tech Stack

- **Runtime**: Node.js (ES Modules / TypeScript)
- **Framework**: Express.js
- **Database**: PostgreSQL with PostGIS Spatial Extension (Supabase)
- **Realtime**: WebSockets (`ws`) + Supabase Realtime Change Listeners
- **Push Notifications**: Expo Server SDK (`expo-server-sdk`)
- **Validation & Security**: Helmet, CORS, Morgan, Zod

---

## 📁 Directory Structure

```
backend/
├── src/
│   ├── config/               # Environment & Supabase client config
│   │   ├── env.ts
│   │   └── supabase.ts
│   ├── controllers/          # API route controllers
│   │   ├── adminController.ts
│   │   ├── authController.ts
│   │   ├── categoriesController.ts
│   │   ├── haatsController.ts
│   │   ├── listingsController.ts
│   │   ├── notificationsController.ts
│   │   ├── ordersController.ts
│   │   ├── reviewsController.ts
│   │   └── sellerController.ts
│   ├── database/             # PostgreSQL + PostGIS schema & seeds
│   │   ├── schema.sql
│   │   └── seed.ts
│   ├── middleware/           # Auth, validation, error handler
│   │   ├── authMiddleware.ts
│   │   ├── errorHandler.ts
│   │   └── validate.ts
│   ├── routes/               # Modular Express routes
│   │   ├── adminRoutes.ts
│   │   ├── authRoutes.ts
│   │   ├── categoriesRoutes.ts
│   │   ├── haatsRoutes.ts
│   │   ├── listingsRoutes.ts
│   │   ├── notificationsRoutes.ts
│   │   ├── ordersRoutes.ts
│   │   ├── reviewsRoutes.ts
│   │   ├── sellerRoutes.ts
│   │   └── index.ts
│   ├── services/             # Push notifications & Location utilities
│   │   ├── locationService.ts
│   │   └── notificationService.ts
│   ├── app.ts                # Express app factory
│   └── server.ts             # Server entrypoint + WebSocket
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🛠️ Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your Supabase credentials:
```bash
cp .env.example .env
```

### 3. Run Database Migrations
Copy and run `src/database/schema.sql` inside your **Supabase Dashboard → SQL Editor** to create all tables, PostGIS RPCs, DB triggers, and storage buckets.

### 4. Seed Initial Marketplace Catalog
```bash
npm run seed
```

### 5. Start the Development Server
```bash
npm run dev
```

The API will be available at `http://localhost:5000/api/v1` and WebSocket at `ws://localhost:5000/ws`.

---

## 📡 Key API Endpoints

### 📍 Listings & PostGIS Geospatial
- `GET /api/v1/listings?lat=26.435&lng=92.03&radius_km=15&category_id=c1` — Nearby listings with calculated distance
- `GET /api/v1/listings/:id` — Listing details
- `POST /api/v1/listings` — Create listing
- `PATCH /api/v1/listings/:id/toggle-status` — Toggle active / inactive

### 🛍️ Orders
- `POST /api/v1/orders` — Create multi-item order & notify seller
- `GET /api/v1/orders?buyer_id=...&seller_id=...` — User orders
- `GET /api/v1/orders/:id` — Order details
- `PATCH /api/v1/orders/:id/status` — Progress order lifecycle (`REQUESTED` → `ACCEPTED` → `READY_FOR_PICKUP` → `OUT_FOR_DELIVERY` → `COMPLETED`)

### 👩‍🌾 Seller Portal
- `POST /api/v1/seller/register` — Submit seller profile & KYC verification documents
- `GET /api/v1/seller/:id/analytics` — Live seller revenue, orders, and ratings
- `PATCH /api/v1/seller/:id/toggle-online` — Toggle store online / offline

### 🛡️ Admin
- `GET /api/v1/admin/stats` — Platform live metrics (users, sellers, listings, GMV volume)
- `GET /api/v1/admin/pending-sellers` — Pending seller KYC verification requests
- `POST /api/v1/admin/verify-seller/:id` — Approve or reject seller application
- `GET /api/v1/admin/orders` — Platform-wide orders log

### 🏛️ Haats & Categories
- `GET /api/v1/haats?lat=...&lng=...` — Nearby weekly haats
- `GET /api/v1/categories` — Marketplace product categories

### 🔔 Notifications & Reviews
- `GET /api/v1/notifications/user/:userId` — User in-app notifications
- `POST /api/v1/reviews` — Submit buyer review and rating
