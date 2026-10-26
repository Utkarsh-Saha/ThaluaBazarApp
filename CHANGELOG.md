# Changelog

All notable changes to the **Thaluwa Bazar (থলুৱা বজাৰ)** platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---


## [Unreleased] - 2026-10-26

### Feat: Admin Operations Console, Real-Time Audit Trail & Analytics

#### Added
- **Admin Activity Logging & Operations Console**:
  - **Backend Audit Service (`backend/src/services/auditService.ts`)**: Built persistent audit logging engine with memory caching, local disk storage (`backend/data/audit_logs.json`), and Supabase `audit_logs` sync. Captures action types (`SELLER_VERIFIED`, `SELLER_REJECTED`, `ORDER_OVERRIDE`, `PAYOUT_DISBURSED`, `CONFIG_UPDATED`), administrative actor credentials, target entities, timestamps, IP addresses, and state diffs.
  - **Audit Routes & Controllers (`backend/src/controllers/adminController.ts`, `backend/src/routes/adminRoutes.ts`)**: Mounted `GET /api/v1/admin/audit-logs` and `POST /api/v1/admin/audit-logs` with search, filter, and pagination support.
  - **Client Admin Logger (`admin-panel/src/services/adminLogger.ts`)**: Dedicated logging utility for managing active admin identities, real-time subscriber listeners, and logging helpers for seller KYC, orders, payouts, and system configuration.
  - **Searchable Console View (`admin-panel/src/components/AuditLogsView.tsx`)**: Built rich dual-mode viewer (Interactive CLI Terminal and Enterprise Structured Table) with universal search, category filter pills, pulsing live streaming indicator, auto-sync, JSON/CSV exports, and expandable JSON metadata inspector.
  - **Dynamic Configuration Logging (`admin-panel/src/components/SettingsView.tsx`)**: Added interactive commission matrix and geo-radius settings that automatically write immutable `CONFIG_UPDATED` events to the audit trail.
- **Interactive Buyer Reviews & Ratings**:
  - **Review Modal (`src/components/ReviewModal.tsx`)**: Added interactive 1–5 star rating modal with haptic feedback, bilingual descriptions, and quick sentiment tags (*"🌱 Fresh & Organic"*, *"⚡ Fast Delivery"*, *"🤝 Courteous Producer"*, etc.).
  - **Dual API & Supabase Persistence**: Submits reviews to backend `POST /api/v1/reviews` with direct Supabase table fallback, updating seller aggregate ratings and review counts.
  - **Buyer Order Integration (`src/app/(tabs)/orders.tsx`)**: Added amber "★ Rate & Review Order" action button to completed orders, and persistent green "Reviewed (X★)" badge via `AsyncStorage` and Supabase sync.
- **Dynamic Producer Analytics (`src/app/seller/analytics.tsx`)**:
  - Replaced hardcoded charts with dynamic calculations aggregated from live completed orders (`useOrders()` & Supabase).
  - Chronological 7-day bar chart with normalized proportional heights and peak sales day highlighting.
  - Time period filtering: 7 Days (`week`), This Month (`month`), and All Time (`all`) with growth rate percentage indicators.
  - Live customer metrics: Local Impressions, Repeat Buyers, Completed Orders, and Average Order Value (AOV).
  - Dynamic Top Selling Products ranking sorted descending by revenue and units sold.
- **Real-Time Push Notifications (Expo Notifications & FCM)**:
  - Configured `expo-notifications` and `expo-device` with Expo SDK 58 support.
  - Created `src/lib/notifications.ts` for push token registration, notification response listeners, local dispatch, and channel setup.
  - Auto-registered device push tokens in `AuthContext.tsx` syncing with backend and Supabase `users.expo_push_token`.
  - Upgraded `src/app/notifications.tsx` with live database feed, real-time WebSocket subscriptions, unread badges, mark as read, and test dispatch.
- **Seller Payouts Ledger & Withdrawal Workflow**:
  - Connected Supabase `seller_payouts` table to backend `sellerRoutes.ts` (`GET /api/seller/:id/payouts`, `POST /api/seller/payout`).
  - Added real UTR generation and disbursement tracking in `adminController.ts`.
  - Added real-time settlement balance, Supabase updates, and withdrawal modal in `src/app/seller/earnings.tsx`.
- **Native Device GPS & Assam Reverse Geocoding (`src/lib/location.ts`)**:
  - Integrated live GPS auto-detection via `expo-location` paired with automatic reverse geocoding to resolve the buyer's exact village, locality, and Assam district.
  - Indexed all 35 administrative districts of Assam (`ASSAM_DISTRICTS`) and their geographic centroids (`ASSAM_DISTRICT_CENTROIDS`) for fast proximity resolution and offline fallback.
  - Added local coordinate persistence via `AsyncStorage` (`@thaluwa_user_coords`) so user locality remains cached across app sessions.
  - Upgraded `Header.tsx` with live location display and an interactive Assam District & GPS detection modal.
  - Wired live distance calculation into `ListingsContext.tsx`, dynamically sorting listings by nearest first and computing accurate kilometers from the user's physical coordinates.
  - Integrated real distance badges (`X.X km away`) into `ProductCard.tsx` and product detail view (`src/app/product/[id].tsx`).
  - Added one-tap GPS auto-fill in user registration (`src/app/(auth)/register.tsx`), delivery address book (`src/app/addresses.tsx`), checkout delivery address (`src/app/checkout/index.tsx`), and producer registration (`src/app/seller/register.tsx`).
- **Multi-Address Cloud Persistence & Address Book (`src/lib/addresses.ts`, `src/app/addresses.tsx`, `src/app/checkout/index.tsx`, `backend/src/database/schema.sql`)**:
  - **Schema & Persistence Engine**: Added `public.user_addresses` schema definition with UUID primary keys, user references, geocoordinates, address labels (`home`, `work`, `farm`), and default selection flags.
  - **Offline-First Multi-Address Manager (`src/lib/addresses.ts`)**: Built cached storage using `AsyncStorage` (`@thaluwa_user_addresses_*`) paired with automatic Supabase sync, automatic primary address seeding from user profile, and mutual exclusion for default addresses.
  - **Delivery Addresses Management (`src/app/addresses.tsx`)**: Upgraded to support live asynchronous saving, deletion, and default selection with reactive UI updates.
  - **Checkout Address Picker (`src/app/checkout/index.tsx`)**: Added interactive horizontal address selector chips (`🏠 Home`, `🌱 Farm`, `💼 Work`, `+ Manage`) that automatically select the user's default address and populate the checkout order with full details.
- **Advanced Produce Catalog Filters & Sorting (`src/components/FilterModal.tsx`, `src/app/(tabs)/explore.tsx`, `src/context/ListingsContext.tsx`)**:
  - **Context-Level Filter Engine (`src/context/ListingsContext.tsx`)**: Added `FilterOptions` state supporting `organicOnly` certification, `inStockOnly` availability, `maxPrice` thresholds, and dynamic sorting by Distance (Nearest First), Price (Low to High), Price (High to Low), Rating (Highest First), and Fresh Harvest (Newest First).
  - **Filter & Sort Modal (`src/components/FilterModal.tsx`)**: Built a bilingual bottom sheet modal with smooth animation, haptic feedback, preset price chips (Under ₹50, ₹100, ₹250, ₹500), toggle switches for Organic and In-Stock, and a live items-found preview CTA.
- **In-App Direct Chat & Audio Voice Notes (`src/lib/chat.ts`, `src/app/chat/[id].tsx`, `src/app/messages/index.tsx`, `src/components/AudioVoicePlayer.tsx`, `backend/src/database/schema.sql`)**:
  - **Conversations & Messages Schema**: Added `conversations` and `messages` tables supporting text messages, voice note audio recordings (`audio_url`, `audio_duration_seconds`), and produce inquiry context (`listing_id`, `listing_title`). Configured storage bucket `'chat-audio'` and public RLS access policies.
  - **Offline-First Chat Persistence**: Implemented `src/lib/chat.ts` with local `AsyncStorage` caching (`@thaluwa_chat_conversations_*`, `@thaluwa_chat_messages_*`), bidirectional Supabase sync, and Supabase Realtime channel WebSocket subscriptions for zero-latency messaging.
  - **Native Audio Recording & Playback (`expo-audio`)**: Integrated Expo SDK 58 `expo-audio` module (`useAudioRecorder`, `useAudioPlayer`, `useAudioRecorderState`, `RecordingPresets.HIGH_QUALITY`) with microphone permissions, duration timer up to 30 seconds, and custom waveform visualizer with play/pause playback controls (`AudioVoicePlayer.tsx`).
  - **Direct Conversation Screen (`src/app/chat/[id].tsx`)**: Built complete direct chat interface featuring audio voice note recording, message bubbles with timestamps and read checks, produce inquiry header with direct deep-link, and bilingual quick inquiry prompts (*"🌱 When was this harvested?"*, *"⚡ Can I get delivery today?"*, *"📜 Is this 100% organic?"*).
  - **WhatsApp Quick-Order Generator**: Added one-tap automated WhatsApp message generator formatting polite, bilingual order details and produce context for rural farmers and SHGs who check WhatsApp regularly.
  - **Cross-App Chat Access Points**: Integrated direct chat triggers into product details (`src/components/MaskedContactButton.tsx`), buyer order cards (`src/app/(tabs)/orders.tsx`), seller fulfillment cards (`src/app/seller/orders.tsx`), top header bar (`src/components/Header.tsx`), and producer hub (`src/app/seller/dashboard.tsx`).


#### Changed
- **Seller Hub Producer Operations 2-Column Grid Layout (`src/app/seller/dashboard.tsx`)**:
  - Replaced horizontal scroll list with a responsive 2-column multi-column flex grid (`operationsGrid`) dynamically sized via `useWindowDimensions()` (`cardWidth = Math.floor((screenWidth - 32 - 12) / 2)`).
  - Expanded operations into an exact 4x2 symmetrical grid (8 cards: *Add Product*, *My Products*, *Orders*, *Earnings*, *Analytics*, *KYC Verification*, *Membership*, and *Documents & ID*).
  - Standardized consistent cell heights (`minHeight: 118`), uniform internal paddings, rounded corners (`borderRadius: 16`), themed icon containers, and reactive status badges for pending orders (`${count} NEW`) and KYC verification (`✓`).

#### Removed
- **Haat Feature Platform-Wide Removal**:
  - **Mobile App**: Deleted `src/app/(tabs)/haats.tsx` and `src/components/HaatCard.tsx`. Removed Haat tab from `src/app/(tabs)/_layout.tsx`, navigation references in `explore.tsx`, `Header.tsx`, `mockData.ts`, `translations.ts`, and `types/index.ts`.
  - **Admin Panel**: Deleted `admin-panel/src/components/HaatMarketsView.tsx` and removed nav & state references from `App.tsx`, `api.ts`, and `i18n.ts`.
  - **Backend & Database**: Deleted `backend/src/controllers/haatsController.ts` and `backend/src/routes/haatsRoutes.ts`. Removed route registrations from `backend/src/routes/index.ts`, cleaned `schema.sql`, `seed.ts`, and `listingsController.ts`.
- **Database Mock Data Reset**:
  - Wiped all mock records across all tables using `scripts/wipe-database.mjs` while preserving schema structures, foreign keys, and indexes. Verified zero-row clean database state via `scripts/check-db.mjs`.

#### Fixed
- **Expo Go Android Push Notifications Compatibility (`ExpoTopicSubscriptionModule`)**:
  - Resolved fatal startup crash `[Error: Cannot find native module 'ExpoTopicSubscriptionModule']` occurring on Android devices running in Expo Go.
  - Implemented safe fallback via `requireOptionalNativeModule('ExpoTopicSubscriptionModule') ?? {}` inside `expo-notifications` build artifact `TopicSubscriptionModule.android.js`.
  - Created automated patch script `scripts/fix-expo-notifications.mjs` and hooked it into `"postinstall"` in `package.json` to guarantee persistence across dependency installs.
- **Expo Go Android Notification Channel NullPointerException Fix**:
  - Resolved `Uncaught (in promise) Error: Call to function 'ExpoNotificationChannelManager.setNotificationChannelAsync' has been rejected (Caused by java.lang.NullPointerException)`.
  - Added safe `try...catch` isolation around Android channel creation in `src/lib/notifications.ts` and omitted explicit `sound: 'default'` string which caused native resource resolution failures in Expo Go.
  - Wrapped `registerForPushNotificationsAsync(user.id)` in `src/context/AuthContext.tsx` with rejection handler to guarantee unhandled promise rejections never crash the app runtime.
- **Seller Flow Route Hygiene**:
  - Removed unused imports and cleaned lint diagnostics in `src/app/seller/register.tsx`, `src/app/seller/subscription.tsx`, and `src/app/seller/verification.tsx`.

---

## [1.3.0] - 2026-10-23

### Refactor: Architectural Split of Administrative & Seller Features

#### Removed
- **Mobile Admin Moderation Panel**:
  - Completely deleted the mobile administrative screen `src/app/admin/index.tsx` and removed the `src/app/admin/` route directory from the mobile app codebase.
  - Removed `<Stack.Screen name="admin/index" />` from the root navigation stack in `src/app/_layout.tsx`.
  - Removed the "Admin & Moderation Panel" navigation item and `Shield` icon from the buyer profile screen (`src/app/(tabs)/profile.tsx`).
  - *Note*: The standalone Vite web admin panel (`admin-panel/`) and backend admin routes (`backend/src/routes/adminRoutes.ts`) remain intact for dedicated web management.

#### Changed
- **Seller Subscription Feature Migration**:
  - Migrated the seller subscription entry point completely out of the general buyer profile (`src/app/(tabs)/profile.tsx`), ensuring subscription management is strictly scoped within the seller app module.
  - Integrated an active **Producer Membership / Subscription Banner** directly into the seller dashboard (`src/app/seller/dashboard.tsx`), displaying plan badge, validity status, and direct management action.
  - Added a dedicated **Subscription Card** in the Operations Grid in `src/app/seller/dashboard.tsx` with haptic feedback and direct routing to `/seller/subscription`.
  - Hardened navigation in `src/app/seller/subscription.tsx` with safe fallback to `/seller/dashboard` when popping routes, and personalized plan headers with the authenticated seller's business/SHG name.

### Refactor: Authentication Lifecycle & Navigation Stack Hardening

#### Added
- **Email Input Fields**: Added fully editable email address fields with `Mail` icon, `email-address` keyboard type, and normalization across both:
  - Buyer / Seller Login view (`src/app/(auth)/login.tsx`)
  - Buyer Profile Registration view (`src/app/(auth)/register.tsx`)
- **Explicit In-Form OTP Verification**: Added a dedicated, user-triggered OTP verification flow directly inside `src/app/(auth)/register.tsx`:
  - Users enter their 10-digit mobile number and tap "Send OTP".
  - Dedicated countdown timer (45s) and explicit 6-digit OTP input field.
  - Verification is confirmed via backend `verifyOtp` before allowing profile submission.
- **Bi-directional Auth Navigation**: Added direct "Already have an account? Sign In" and "New to Thaluwa Bazar? Register Profile" switch links between Login and Register views.
- **Route Declaration in Stack**: Formally registered `<Stack.Screen name="(auth)/register" />` in root `src/app/_layout.tsx`.

#### Changed
- **Auth Form State Isolation**:
  - Attached `useFocusEffect` lifecycle hooks to both Login and Register screens to completely clear all form states (`phone`, `email`, `otp`, `otpSent`, `isPhoneVerified`, `testOtpNotice`, `countdown`) whenever screens are switched or focused.
  - Removed state carryover via navigation route params (`{ phone }`) when switching between Login and Register.
  - Role switching (Buyer ↔ Seller) in `login.tsx` now clears partial or dirty credentials.
- **Conditional Credential Auto-Population**:
  - Only auto-populates credentials (mobile number, email, and verified status) on the Complete Profile page (`register.tsx`) when the user arrives via the "Verify & Continue" button after completing OTP verification.
  - Standard new registrations arriving via direct links or "Register Profile" prompt do not auto-populate, ensuring clean inputs.
- **Editable Credentials & Timer Cancellation on Edit**:
  - Removed `editable={false}` restrictions on mobile numbers in `register.tsx`. Both phone and email are fully editable.
  - Clicking the "Edit" button on an already verified phone number in `register.tsx` cancels active timer intervals, clears countdowns and OTP input state, reverts verification status to unverified, and focuses the field for clean re-verification.
  - Modifying phone number text immediately cancels any active countdown intervals and clears verification state.

#### Removed
- **Dev Test Code Display**: Completely removed the UI banner and notice block showing the development test code ("Dev Test Code: 123456") from both Login (`login.tsx`) and Complete Profile (`register.tsx`) verification screens.
- **Header Sell/Buy Switch**: Completely removed the Sell/Buy switch button from `src/components/Header.tsx`, along with `showRoleToggle`, `handleRoleToggle`, role states, and associated styles. Spacing and alignment between branding, language toggle, and notification button now adjust cleanly to fill the header space.
- **Pre-verified Flags**: Eliminated hardcoded "(Verified)" labels and static green checkmark icons that presumed mobile verification prior to user action.
- **OTP Auto-Fill**: Removed automatic injection of development test OTP into the OTP text input; dev codes are displayed strictly as hints for the tester to type explicitly.

#### Security & Session Protection
- **Navigation Stack Reset on Auth**:
  - Successful login or registration triggers `navigation.reset({ index: 0, routes: [{ name: targetRoute }] })`.
  - The authenticated dashboard (`(tabs)` for buyers, `seller/dashboard` for sellers) replaces the entire navigation stack as the root (index 0).
  - Software swipe-back gestures and hardware back presses cannot return the user to login, registration, or welcome screens.
- **Session Route Guards**:
  - Added session guards in `src/app/index.tsx`, `src/app/(auth)/login.tsx`, and `src/app/(auth)/register.tsx` that detect active authenticated sessions (`isAuthenticated && user`) and immediately redirect to the main app dashboard.
- **Hardware Back Button Interception**:
  - Added Android `BackHandler` listeners to `src/app/(tabs)/_layout.tsx` and `src/app/seller/dashboard.tsx` to prevent the hardware back button from popping into unauthenticated states.
- **Explicit Logout Contract**:
  - Updated `handleLogout` in `src/app/(tabs)/profile.tsx` to clear sessions and reset the navigation stack to the root `index` (Welcome) screen, establishing that only an explicit logout action can exit the authenticated app state.

---

## [1.2.0] - 2026-10-03

### Feat: Standalone Admin Panel, Node.js REST API & Supabase Schema v2 (`commit a784331`)

#### Added
- **Enterprise Web Admin Panel** (`admin-panel/`):
  - Built with React 18, Vite, Lucide icons, and Tailwind CSS / custom styling.
  - Modules for KYC document review, SHG verification, seller approvals, real-time platform orders monitoring, product moderation, and dispute management.
  - PDF export capabilities and platform metrics dashboard.
- **Express / Node.js Backend API Service** (`backend/`):
  - TypeScript REST backend with Express, Supabase Admin service role client, and JSON Web Token (JWT) authentication.
  - Modular controllers: `authController`, `sellerController`, `ordersController`, `listingsController`, `haatsController`, `adminController`, `notificationsController`, `reviewsController`.
  - Input validation middlewares and structured error handling.
- **Supabase Database Schema v2** (`backend/src/database/schema.sql` & `supabase/schema.sql`):
  - Comprehensive PostgreSQL schema with PostGIS extensions.
  - Tables: `users`, `seller_profiles`, `categories`, `listings`, `orders`, `order_items`, `haat_markets`, `reviews`, `contact_unlocks`, `notifications`, `app_settings`.
  - PostGIS geospatial functions (`get_nearby_listings_v2`, `get_nearby_haats_v2`) calculating Haversine distance in kilometers.
- **Admin Specification Document**:
  - Comprehensive specification document generated via `scripts/generate_admin_spec_pdf.py` (`Thaluwa Bazar Admin Panel Specification.pdf`).

---

## [1.1.2] - 2026-10-03

### Feat: Web Export & Deployment Configuration (`commit d4683c8`)

#### Added
- Configured Expo Router web output and deployment rules (`vercel.json`).
- Updated `src/lib/supabase.ts` with web storage fallbacks.
- Added `build: "expo export -p web"` script in `package.json`.

---

## [1.1.1] - 2026-10-03

### Feat: Database Diagnostics CLI (`commit 75ba43e`)

#### Added
- Standalone database inspection CLI script (`scripts/check-db.mjs`) to test database connectivity, table integrity, and PostGIS RPC functions.
- Added `npm run check-db` script to `package.json`.

---

## [1.1.0] - 2026-10-03

### Feat: Supabase Backend Integration (P0 Auth, CRUD, Storage & Realtime) (`commit dccf15e`)

#### Added
- **Supabase Realtime & Persistence**:
  - Connected `AuthContext` to Supabase user management and session storage.
  - Connected `ListingsContext` to query active listings with PostGIS geospatial radius filtering.
  - Connected `OrderContext` to subscribe to Supabase Realtime order status changes.
- **Document & Image Storage**:
  - Implemented `src/lib/storage.ts` using Supabase Storage buckets (`seller-documents`, `product-images`).
  - Added document upload flow in `src/app/seller/documents.tsx` for ID proof, address proof, SHG certificates, and bank passbooks.
  - Added product image picker and cloud upload in `src/app/seller/add-product.tsx`.
- Automated smoke test suite in `scripts/test-supabase.mjs`.

---

## [1.0.1] - 2026-10-02

### Feat: Buyer & Seller Core Feature Screens (`commit b25fee6`)

#### Added
- **Notifications Screen** (`src/app/notifications.tsx`): Real-time buyer/seller order and haat market alerts.
- **Wishlist Screen** (`src/app/wishlist.tsx`): Saved favorite produce and artisan items with quick "Add to Cart" integration.
- **Delivery Addresses Screen** (`src/app/addresses.tsx`): Multi-address manager with Assam district and village auto-suggestions.
- **Help & Support Screen** (`src/app/support.tsx`): Bilingual FAQs, direct coordinator support, WhatsApp channel links.
- **Account Settings Screen** (`src/app/settings.tsx`): Notification toggles, language preferences, account deletion flow.
- **Seller Subscription Tiers** (`src/app/seller/subscription.tsx`): Tiered micro-enterprise plans (Free Producer, SHG Collective, Verified Premium).

---

## [1.0.0] - 2026-10-02

### Feat: Initial Thaluwa Bazar MVP Release (`commit b2846ef`)

#### Added
- **Bilingual Core Architecture**: English and Assamese (অসমীয়া) internationalization (`src/i18n/translations.ts`, `LanguageContext.tsx`).
- **Entry & Role Selection**: Dual buyer/seller role gateway in `src/app/index.tsx`.
- **Hyperlocal Haat & Product Discovery**:
  - PostGIS-powered GPS radius filtering (`RadiusSlider`, `CategoryPills`, `HaatCard`, `ProductCard`).
  - Product details view (`src/app/product/[id].tsx`) with masked seller contact unlocking.
- **Cart & Order State Machine**:
  - Cart drawer and management (`CartContext.tsx`, `src/app/(tabs)/cart.tsx`).
  - Checkout and confirmation screens (`src/app/checkout/index.tsx`, `src/app/checkout/confirmation.tsx`).
  - Order tracking stepper supporting statuses: `REQUESTED` → `ACCEPTED` → `READY_FOR_PICKUP` → `OUT_FOR_DELIVERY` → `COMPLETED`.
- **Seller Hub**:
  - Dashboard with sales metrics and live availability switch (`src/app/seller/dashboard.tsx`).
  - Product catalog management (`src/app/seller/products.tsx`, `add-product.tsx`).
  - Order management stepper for producers (`src/app/seller/orders.tsx`).
  - KYC verification status tracking (`src/app/seller/verification.tsx`).
  - Analytics and earnings screens (`src/app/seller/analytics.tsx`, `earnings.tsx`).
