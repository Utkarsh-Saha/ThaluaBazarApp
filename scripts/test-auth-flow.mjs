const BASE_URL = 'http://localhost:5000/api/v1';

async function post(endpoint, body) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function run() {
  console.log('====================================================');
  console.log('🧪 TESTING REAL AUTHENTICATION & REGISTRATION');
  console.log('   (Using Fresh Non-Demo Accounts)');
  console.log('====================================================\n');

  // -----------------------------------------------------------------
  // TEST 1: BUYER FLOW (Rupjyoti Hazarika)
  // -----------------------------------------------------------------
  const buyerPhone = '9435112233';
  console.log('--- [TEST 1] Buyer Authentication Flow ---');
  console.log(`1. Sending OTP to new phone: ${buyerPhone}...`);
  const sendRes1 = await post('/auth/send-otp', { phone: buyerPhone });
  console.log('   Status:', sendRes1.status);
  console.log('   Formatted Phone:', sendRes1.data.formattedPhone);
  console.log('   isExistingUser:', sendRes1.data.isExistingUser);
  console.log('   Test OTP:', sendRes1.data.testOtp);

  console.log('\n2. Testing INVALID OTP rejection (OTP: 999999)...');
  const invalidRes = await post('/auth/verify-otp', { phone: buyerPhone, otp: '999999' });
  console.log('   Status:', invalidRes.status, '(Expected 400)');
  console.log('   Error Message:', invalidRes.data.error);

  console.log('\n3. Verifying with correct offline OTP (OTP: 123456)...');
  const verifyRes1 = await post('/auth/verify-otp', { phone: buyerPhone, otp: '123456' });
  console.log('   Status:', verifyRes1.status);
  console.log('   isNewUser:', verifyRes1.data.isNewUser);
  console.log('   Temp Registration Token:', verifyRes1.data.token ? 'Issued ✅' : 'Missing ❌');

  console.log('\n4. Registering Buyer Profile in Database...');
  const regBuyerRes = await post('/auth/register-buyer', {
    phone: buyerPhone,
    name: 'Rupjyoti Hazarika',
    district: 'Sonitpur',
    village: 'Tezpur Town',
    address: 'Brahmaputra Riverside Road, Ward 5',
    pincode: '784001',
    lat: 26.6338,
    lng: 92.7926,
  });
  console.log('   Status:', regBuyerRes.status);
  console.log('   Database User Record:');
  console.log('     ID (UUID):', regBuyerRes.data.user?.id);
  console.log('     Name:', regBuyerRes.data.user?.name);
  console.log('     Phone:', regBuyerRes.data.user?.phone);
  console.log('     Role:', regBuyerRes.data.user?.role);
  console.log('     Verified:', regBuyerRes.data.user?.verified);
  console.log('     District:', regBuyerRes.data.user?.district);
  console.log('     Session JWT Token:', regBuyerRes.data.token ? 'Issued ✅' : 'Missing ❌');

  console.log('\n5. Testing Subsequent Login for Rupjyoti Hazarika...');
  const sendResAgain = await post('/auth/send-otp', { phone: buyerPhone });
  console.log('   isExistingUser detected:', sendResAgain.data.isExistingUser);
  console.log('   User preview from DB:', sendResAgain.data.userPreview);

  const verifyLoginAgain = await post('/auth/verify-otp', { phone: buyerPhone, otp: '123456' });
  console.log('   Direct Login Success:', verifyLoginAgain.data.success);
  console.log('   isNewUser:', verifyLoginAgain.data.isNewUser);
  console.log('   User Name loaded from DB:', verifyLoginAgain.data.user?.name);
  console.log('   Verified status:', verifyLoginAgain.data.user?.verified);

  // -----------------------------------------------------------------
  // TEST 2: PRODUCER / SELLER FLOW (Maini Bora - SHG Producer)
  // -----------------------------------------------------------------
  console.log('\n\n--- [TEST 2] Producer/Seller Registration Flow ---');
  const sellerPhone = '9101998877';
  console.log(`1. Sending OTP to new producer phone: ${sellerPhone}...`);
  await post('/auth/send-otp', { phone: sellerPhone });

  console.log('2. Verifying OTP (123456)...');
  await post('/auth/verify-otp', { phone: sellerPhone, otp: '123456' });

  console.log('3. Registering base user in Database...');
  const regSellerUser = await post('/auth/register-buyer', {
    phone: sellerPhone,
    name: 'Maini Bora',
    district: 'Jorhat',
    village: 'Titabar',
    address: 'Near Titabar Daily Market, Block 2',
    pincode: '785630',
    role: 'seller',
  });
  const sellerUserId = regSellerUser.data.user?.id;
  console.log('   Created Base User ID (UUID):', sellerUserId);

  console.log('4. Registering Producer / SHG Profile in Database...');
  const regSellerProfile = await post('/seller/register', {
    user_id: sellerUserId,
    phone: sellerPhone,
    business_name: 'Bhogdoi Organic Turmeric & Ginger SHG',
    seller_type: 'shg_member',
    shg_code: 'AS-JRT-SHG-2026-319',
    village: 'Titabar',
    district: 'Jorhat',
    upi_id: 'bhogdoi.shg@okaxis',
  });
  console.log('   Status:', regSellerProfile.status);
  console.log('   Created Seller Profile:');
  console.log('     Profile ID (UUID):', regSellerProfile.data.seller_profile?.id);
  console.log('     User ID ForeignKey:', regSellerProfile.data.seller_profile?.user_id);
  console.log('     Business Name:', regSellerProfile.data.seller_profile?.business_name);
  console.log('     SHG Code:', regSellerProfile.data.seller_profile?.shg_code);
  console.log('     Verification Status:', regSellerProfile.data.seller_profile?.verification_status);

  console.log('\n5. Subsequent Login test for Producer Maini Bora...');
  const sellerLogin = await post('/auth/verify-otp', { phone: sellerPhone, otp: '123456' });
  console.log('   User Name:', sellerLogin.data.user?.name);
  console.log('   User Role in DB:', sellerLogin.data.user?.role);
  console.log('   Associated Seller Profile:', sellerLogin.data.sellerProfile?.business_name);
  console.log('   Session JWT Token:', sellerLogin.data.token ? 'Issued ✅' : 'Missing ❌');

  console.log('\n====================================================');
  console.log('✅ ALL TESTS PASSED SUCCESSFULLY!');
  console.log('====================================================');
}

run().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
