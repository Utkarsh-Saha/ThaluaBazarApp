import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'http://localhost:5000/api/v1';

async function api(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, ok: res.ok, data };
}

let passedCount = 0;
let failedCount = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${testName} ${details ? `(${details})` : ''}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${details ? `(${details})` : ''}`);
    failedCount++;
  }
}

async function runAllTestCases() {
  console.log('================================================================');
  console.log('🚀 THALUWA BAZAR (থলুৱা বজাৰ) — COMPREHENSIVE APP TEST SUITE');
  console.log('   Testing 8 Major Modules & Real Database Integration');
  console.log('================================================================\n');

  const testBuyerPhone = `+919864${Math.floor(100000 + Math.random() * 900000)}`;
  const testSellerPhone = `+919435${Math.floor(100000 + Math.random() * 900000)}`;
  let buyerId = '';
  let buyerToken = '';
  let sellerUserId = '';
  let sellerProfileId = '';
  let createdListingId = '';
  let createdOrderId = '';

  // -------------------------------------------------------------
  // SUITE 1: AUTHENTICATION & USER PROFILE
  // -------------------------------------------------------------
  console.log('📌 SUITE 1: Authentication & User Profile');

  // 1.1 Invalid payload check
  const badPhoneRes = await api('/auth/send-otp', { method: 'POST', body: JSON.stringify({}) });
  assert(badPhoneRes.status === 400, 'Rejects send-otp without phone number');

  // 1.2 Send OTP for new buyer
  const sendRes = await api('/auth/send-otp', { method: 'POST', body: JSON.stringify({ phone: testBuyerPhone }) });
  assert(sendRes.ok && sendRes.data?.testOtp === '123456', 'Sends OTP and provides offline 123456 bypass');
  assert(sendRes.data?.isExistingUser === false, 'Correctly identifies new un-registered phone number');

  // 1.3 Reject wrong OTP
  const badOtpRes = await api('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ phone: testBuyerPhone, otp: '888888' }) });
  assert(badOtpRes.status === 400, 'Rejects invalid OTP token (888888)');

  // 1.4 Accept 123456 OTP
  const verifyRes = await api('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ phone: testBuyerPhone, otp: '123456' }) });
  assert(verifyRes.ok && verifyRes.data?.isNewUser === true, 'Accepts offline OTP 123456 and indicates new registration');

  // 1.5 Register buyer
  const regRes = await api('/auth/register-buyer', {
    method: 'POST',
    body: JSON.stringify({
      phone: testBuyerPhone,
      name: 'Himanta Borbora',
      district: 'Darrang',
      village: 'Mangaldai',
      address: 'Ward No 3, Station Road',
      pincode: '784125',
      lat: 26.435,
      lng: 92.03,
    }),
  });
  assert(regRes.ok && regRes.data?.user?.id, 'Registers buyer into Supabase PostgreSQL', `ID: ${regRes.data?.user?.id}`);
  buyerId = regRes.data?.user?.id;
  buyerToken = regRes.data?.token;

  // 1.6 Verify session & profile retrieval
  const profileRes = await api(`/auth/profile/${buyerId}`);
  assert(profileRes.ok && profileRes.data?.user?.name === 'Himanta Borbora', 'Retrieves registered profile by user ID');

  // 1.7 Sync/update profile
  const syncRes = await api('/auth/sync', {
    method: 'POST',
    body: JSON.stringify({
      phone: testBuyerPhone,
      address: 'Ward No 3, Station Road, Near Town Club',
    }),
  });
  assert(syncRes.ok && syncRes.data?.user?.address.includes('Near Town Club'), 'Updates user profile in database via sync API');

  // -------------------------------------------------------------
  // SUITE 2: PRODUCER / SELLER SYSTEM
  // -------------------------------------------------------------
  console.log('\n📌 SUITE 2: Producer / Seller System');

  // 2.1 Base user for seller
  await api('/auth/send-otp', { method: 'POST', body: JSON.stringify({ phone: testSellerPhone }) });
  await api('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ phone: testSellerPhone, otp: '123456' }) });
  const sellerUserRes = await api('/auth/register-buyer', {
    method: 'POST',
    body: JSON.stringify({
      phone: testSellerPhone,
      name: 'Anupama Saikia',
      district: 'Morigaon',
      village: 'Bhuragaon',
      address: 'Cluster 4, Bhuragaon Road',
      role: 'seller',
    }),
  });
  sellerUserId = sellerUserRes.data?.user?.id;

  // 2.2 Create seller profile
  const sellerRegRes = await api('/seller/register', {
    method: 'POST',
    body: JSON.stringify({
      user_id: sellerUserId,
      phone: testSellerPhone,
      business_name: 'Bhuragaon Mustard Oil & Honey Co-op',
      seller_type: 'shg_member',
      shg_code: 'AS-MRG-SHG-2026-881',
      village: 'Bhuragaon',
      district: 'Morigaon',
      upi_id: 'bhuragaon.coop@okaxis',
      delivery_radius_km: 20,
    }),
  });
  assert(sellerRegRes.status === 201 && sellerRegRes.data?.seller_profile?.id, 'Creates seller profile linked to user UUID');
  sellerProfileId = sellerRegRes.data?.seller_profile?.id;

  // 2.3 Fetch seller profile
  const getSellerRes = await api(`/seller/${sellerProfileId}`);
  assert(getSellerRes.ok && getSellerRes.data?.seller?.business_name?.includes('Bhuragaon'), 'Fetches seller profile details with owner information');

  // 2.4 Toggle online/offline status
  const toggleRes = await api(`/seller/${sellerProfileId}/toggle-online`, {
    method: 'PATCH',
    body: JSON.stringify({ is_online: false }),
  });
  assert(toggleRes.ok && toggleRes.data?.seller_profile?.is_online === false, 'Toggles seller live availability status');

  // 2.5 Seller analytics
  const analyticsRes = await api(`/seller/${sellerProfileId}/analytics`);
  assert(analyticsRes.ok && typeof analyticsRes.data?.analytics?.todaySales === 'number', 'Retrieves seller sales and orders analytics');

  // -------------------------------------------------------------
  // SUITE 3: CATEGORIES
  // -------------------------------------------------------------
  console.log('\n📌 SUITE 3: Categories');

  // 3.1 Fetch Categories
  const catRes = await api('/categories');
  assert(catRes.ok && catRes.data?.categories?.length >= 4, 'Fetches categories with Assamese translations', `Found: ${catRes.data?.categories?.length}`);

  // -------------------------------------------------------------
  // SUITE 4: PRODUCT LISTINGS SYSTEM
  // -------------------------------------------------------------
  console.log('\n📌 SUITE 4: Product Listings System');

  // 4.1 Create product listing
  const createListingRes = await api('/listings', {
    method: 'POST',
    body: JSON.stringify({
      seller_id: sellerProfileId,
      seller_name: 'Bhuragaon Mustard Oil & Honey Co-op',
      seller_phone: testSellerPhone,
      category_id: 'groceries',
      category_name_en: 'Spices & Staples',
      category_name_as: 'মচলা আৰু অন্যান্য',
      title_en: 'Cold-Pressed Pure Yellow Mustard Oil (১০০% খাঁটি সৰিয়হ তেল)',
      title_as: '১০০% খাঁটি সৰিয়হ তেল',
      description_en: 'Traditional wooden kolhu cold-pressed unrefined mustard oil by Morigaon SHG mothers.',
      description_as: 'মৰিগাঁও আত্মসহায়ক গোটৰ পৰম্পৰাগত কাঠৰ ঘানিত পেৰা সৰিয়হৰ তেল।',
      price: 180,
      unit: 'litre',
      stock: 50,
      image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600',
      village: 'Bhuragaon',
      district: 'Morigaon',
      lat: 26.25,
      lng: 92.34,
      is_organic: true,
    }),
  });
  assert(createListingRes.status === 201 && createListingRes.data?.listing?.id, 'Creates product listing in database', `Listing ID: ${createListingRes.data?.listing?.id}`);
  createdListingId = createListingRes.data?.listing?.id;

  // 4.2 Fetch Listings
  const listingsRes = await api('/listings');
  assert(listingsRes.ok && listingsRes.data?.listings?.length > 0, 'Fetches public active product listings');

  // 4.3 Search filtering
  const searchRes = await api('/listings?search=Mustard');
  assert(searchRes.ok && searchRes.data?.listings?.some((l) => l.title_en?.includes('Mustard')), 'Filters listings by search keyword ("Mustard")');

  // 4.4 Single listing details
  const singleListingRes = await api(`/listings/${createdListingId}`);
  assert(singleListingRes.ok && singleListingRes.data?.listing?.price === 180, 'Fetches single listing details with verified seller information');

  // -------------------------------------------------------------
  // SUITE 5: CART & ORDER LIFECYCLE
  // -------------------------------------------------------------
  console.log('\n📌 SUITE 5: Cart & Order Lifecycle');

  // 5.1 Place Order
  const orderRes = await api('/orders', {
    method: 'POST',
    body: JSON.stringify({
      buyer_id: buyerId,
      buyer_name: 'Himanta Borbora',
      buyer_phone: testBuyerPhone,
      seller_id: sellerProfileId,
      seller_name: 'Bhuragaon Mustard Oil & Honey Co-op',
      seller_phone: testSellerPhone,
      subtotal: 360,
      delivery_fee: 30,
      discount: 0,
      total: 390,
      pickup_or_delivery: 'delivery',
      delivery_address: 'Ward No 3, Station Road, Mangaldai',
      payment_method: 'cod',
      items: [
        {
          listing_id: createdListingId,
          title: 'Cold-Pressed Pure Yellow Mustard Oil',
          quantity: 2,
          unit_price: 180,
          unit: 'litre',
          line_total: 360,
          image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600',
        },
      ],
    }),
  });
  assert(orderRes.status === 201 && orderRes.data?.order?.id, 'Places order and creates database records', `Order: ${orderRes.data?.order?.order_number}`);
  createdOrderId = orderRes.data?.order?.id;

  // 5.2 Fetch Buyer Orders
  const buyerOrdersRes = await api(`/orders/buyer/${buyerId}`);
  assert(buyerOrdersRes.ok && buyerOrdersRes.data?.orders?.some((o) => o.id === createdOrderId), 'Retrieves order history for the buyer');

  // 5.3 Fetch Seller Orders
  const sellerOrdersRes = await api(`/orders/seller/${sellerProfileId}`);
  assert(sellerOrdersRes.ok && sellerOrdersRes.data?.orders?.some((o) => o.id === createdOrderId), 'Retrieves incoming orders for the seller dashboard');

  // 5.4 Update Order Lifecycle: REQUESTED -> ACCEPTED
  const acceptRes = await api(`/orders/${createdOrderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'ACCEPTED' }),
  });
  assert(acceptRes.ok && acceptRes.data?.order?.status === 'ACCEPTED', 'Transitions order state to ACCEPTED');

  // 5.5 Update Order Lifecycle: ACCEPTED -> COMPLETED
  const completeRes = await api(`/orders/${createdOrderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'COMPLETED' }),
  });
  assert(completeRes.ok && completeRes.data?.order?.status === 'COMPLETED', 'Transitions order state to COMPLETED', JSON.stringify(completeRes.data));

  // 5.6 Reject invalid status
  const invalidStatusRes = await api(`/orders/${createdOrderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'INVALID_STATUS' }),
  });
  assert(invalidStatusRes.status === 400, 'Rejects invalid order status mutation');

  // -------------------------------------------------------------
  // SUITE 6: IN-APP NOTIFICATIONS
  // -------------------------------------------------------------
  console.log('\n📌 SUITE 6: In-App Notifications');

  const notifsRes = await api(`/notifications/${buyerId}`);
  assert(notifsRes.ok && notifsRes.data?.notifications?.length > 0, 'Fetches in-app notifications generated for user');
  const firstNotif = notifsRes.data?.notifications?.[0];

  if (firstNotif) {
    const markRes = await api(`/notifications/${firstNotif.id}/read`, { method: 'PATCH' });
    assert(markRes.ok && markRes.data?.notification?.is_read === true, 'Marks notification as read');
  }

  // -------------------------------------------------------------
  // SUITE 7: REVIEWS & RATINGS
  // -------------------------------------------------------------
  console.log('\n📌 SUITE 7: Reviews & Ratings');

  const reviewRes = await api('/reviews', {
    method: 'POST',
    body: JSON.stringify({
      order_id: createdOrderId,
      listing_id: createdListingId,
      seller_id: sellerProfileId,
      buyer_id: buyerId,
      buyer_name: 'Himanta Borbora',
      rating: 5,
      comment: 'Excellent aroma and purity. Truly authentic cold pressed mustard oil!',
    }),
  });
  assert(reviewRes.status === 201 && reviewRes.data?.review?.rating === 5, 'Submits buyer product review and rating');

  // -------------------------------------------------------------
  // SUITE 8: ADMIN PANEL OPERATIONS
  // -------------------------------------------------------------
  console.log('\n📌 SUITE 8: Admin Panel Operations');

  // 8.1 Admin Stats
  const adminStatsRes = await api('/admin/stats');
  assert(adminStatsRes.ok && adminStatsRes.data?.stats?.totalUsers >= 3, 'Calculates live admin platform stats (GMV, orders, users)');

  // 8.2 Admin Pending Sellers
  const pendingSellersRes = await api('/admin/pending-sellers');
  assert(pendingSellersRes.ok && Array.isArray(pendingSellersRes.data?.pending_sellers), 'Fetches pending KYC verification applications');

  // 8.3 Verify Seller Application
  const verifySellerRes = await api(`/admin/sellers/${sellerProfileId}/status`, {
    method: 'POST',
    body: JSON.stringify({ status: 'verified', remarks: 'SHG certification verified successfully' }),
  });
  assert(verifySellerRes.ok && verifySellerRes.data?.seller_profile?.verification_status === 'verified', 'Verifies seller and issues gold badge');

  // 8.4 Admin Order Override
  const overrideRes = await api(`/admin/orders/${createdOrderId}/override`, {
    method: 'POST',
    body: JSON.stringify({ status: 'COMPLETED', reason: 'Admin confirmed delivery with buyer' }),
  });
  assert(overrideRes.ok && overrideRes.data?.order?.status === 'COMPLETED', 'Allows manual admin order override with audit remarks', JSON.stringify(overrideRes.data));



  // 8.6 Admin Payouts
  const payoutsRes = await api('/admin/payouts');
  assert(payoutsRes.ok && Array.isArray(payoutsRes.data?.payouts), 'Fetches seller disbursement payout ledger');

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`📊 FINAL TEST RUN RESULTS:`);
  console.log(`   Passed: ${passedCount}`);
  console.log(`   Failed: ${failedCount}`);
  console.log(`   Success Rate: ${((passedCount / (passedCount + failedCount)) * 100).toFixed(1)}%`);
  console.log('================================================================');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAllTestCases().catch((err) => {
  console.error('Fatal Test Runner Exception:', err);
  process.exit(1);
});
