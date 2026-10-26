import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import {
  ArrowLeft,
  User,
  MapPin,
  Home,
  Navigation,
  Globe,
  Sparkles,
  Mail,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  Edit2,
} from 'lucide-react-native';
import { COLORS, SHADOWS } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { triggerHaptic } from '../../lib/haptics';

const ASSAM_DISTRICTS = [
  'Darrang',
  'Kamrup Metropolitan',
  'Kamrup Rural',
  'Sonitpur',
  'Morigaon',
  'Nagaon',
  'Udalguri',
  'Barpeta',
  'Nalbari',
  'Biswanath',
  'Golaghat',
  'Jorhat',
  'Sivasagar',
  'Dibrugarh',
  'Cachar',
];

export default function BuyerRegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ phone?: string; email?: string; verified?: string }>();
  const { language, toggleLanguage, t } = useLanguage();
  const {
    registerBuyer,
    selectedEntryRole,
    sendOtp,
    verifyOtp,
    user,
    isAuthenticated,
    isLoading: isAuthLoading,
  } = useAuth();

  // References
  const phoneInputRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const timerRef = useRef<any>(null);

  // Conditional initial state based on verified arrival from "verify and continue"
  const isVerifiedArrival = params.verified === 'true' && Boolean(params.phone);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(
    isVerifiedArrival && params.phone
      ? String(params.phone).replace(/^\+91/, '').replace(/\D/g, '')
      : ''
  );
  const [email, setEmail] = useState(
    isVerifiedArrival && params.email ? String(params.email) : ''
  );
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(isVerifiedArrival);
  const [countdown, setCountdown] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const [district, setDistrict] = useState('Darrang');
  const [village, setVillage] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [lat, setLat] = useState<number>(26.435);
  const [lng, setLng] = useState<number>(92.03);

  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDistrictPicker, setShowDistrictPicker] = useState(false);

  // Form State Reset helper
  const resetFormState = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setName('');
    setPhone('');
    setEmail('');
    setOtp('');
    setOtpSent(false);
    setIsPhoneVerified(false);
    setCountdown(0);
    setIsSendingOtp(false);
    setIsVerifyingOtp(false);
    setDistrict('Darrang');
    setVillage('');
    setAddress('');
    setPincode('');
    setShowDistrictPicker(false);
  }, []);

  // Conditional Auto-Population:
  // ONLY auto-populate credentials if user arrived via "verify and continue" after completing verification (params.verified === 'true')
  // Do NOT auto-populate for standard new registrations
  useFocusEffect(
    useCallback(() => {
      if (params.verified === 'true' && params.phone) {
        const cleanPhone = String(params.phone).replace(/^\+91/, '').replace(/\D/g, '');
        setPhone(cleanPhone);
        setEmail(params.email ? String(params.email) : '');
        setIsPhoneVerified(true);
        setOtpSent(false);
        setOtp('');
        setCountdown(0);
      } else {
        resetFormState();
      }
    }, [params.verified, params.phone, params.email, resetFormState])
  );

  // Session Protection: Prevent authenticated users from staying in registration
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && user) {
      const target = selectedEntryRole === 'seller' ? '/seller/register' : '/(tabs)/explore';
      router.replace(target as any);
    }
  }, [isAuthLoading, isAuthenticated, user, selectedEntryRole, router]);

  // Countdown timer for OTP
  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(timerRef.current);
            timerRef.current = null;
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [countdown]);

  // Reset Verification and Timer States on Edit
  const handleEditPhoneNumber = () => {
    triggerHaptic('light');

    // 1. Cancel active running timer interval
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // 2. Clear countdown
    setCountdown(0);

    // 3. Reset verification status and OTP state
    setIsPhoneVerified(false);
    setOtpSent(false);
    setOtp('');
    setIsSendingOtp(false);
    setIsVerifyingOtp(false);

    // 4. Focus the input field so fresh editing can begin cleanly
    setTimeout(() => {
      phoneInputRef.current?.focus();
    }, 50);
  };

  // Explicit Mobile OTP Flow
  const handleSendOtp = async () => {
    if (phone.length < 10) {
      Alert.alert(
        language === 'as' ? 'অবৈধ নম্বৰ' : 'Invalid Number',
        language === 'as'
          ? 'অনুগ্ৰহ কৰি সঠিক ১০ টা সংখ্যাৰ মোবাইল নম্বৰ দিয়ক।'
          : 'Please enter a valid 10-digit mobile number.'
      );
      return;
    }

    triggerHaptic('medium');
    setIsSendingOtp(true);

    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;
    const res = await sendOtp(formattedPhone);
    setIsSendingOtp(false);

    if (res.success) {
      setOtpSent(true);
      setCountdown(45);
      triggerHaptic('success');
    } else {
      Alert.alert('Error', res.error || 'Failed to send OTP.');
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 4) {
      Alert.alert('OTP Required', 'Please enter the 6-digit OTP code.');
      return;
    }

    triggerHaptic('medium');
    setIsVerifyingOtp(true);

    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;
    const res = await verifyOtp(formattedPhone, otp);
    setIsVerifyingOtp(false);

    if (res.success) {
      triggerHaptic('success');
      // Clear timer upon verification
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setCountdown(0);
      setIsPhoneVerified(true);
      setOtpSent(false);
      setOtp('');
      Alert.alert(
        language === 'as' ? 'প্ৰমাণীকৰণ সফল' : 'Verification Successful',
        language === 'as'
          ? 'মোবাইল নম্বৰ সফলতাৰে প্ৰমাণিত হৈছে।'
          : 'Your mobile number has been successfully verified.'
      );
    } else {
      Alert.alert('Verification Failed', res.error || 'Invalid OTP code.');
    }
  };

  // Auto detect GPS location
  const handleDetectLocation = async () => {
    triggerHaptic('medium');
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLat(loc.coords.latitude);
        setLng(loc.coords.longitude);
        triggerHaptic('success');
        Alert.alert(
          language === 'as' ? 'স্থান চিনাক্ত হৈছে' : 'Location Detected',
          language === 'as'
            ? `অক্ষাংশ: ${loc.coords.latitude.toFixed(4)}, দ্ৰাঘিমাংশ: ${loc.coords.longitude.toFixed(4)}`
            : `GPS Coordinates successfully captured: ${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`
        );
      } else {
        Alert.alert(
          'Permission Required',
          'Please allow location access to automatically discover nearby local producers.'
        );
      }
    } catch (e: any) {
      console.warn('GPS location error:', e);
      setLat(26.435);
      setLng(92.03);
    } finally {
      setIsLocating(false);
    }
  };

  // Submit Registration Form
  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert(
        language === 'as' ? 'নাম প্ৰয়োজনীয়' : 'Name Required',
        language === 'as' ? 'অনুগ্ৰহ কৰি আপোনাৰ সম্পূৰ্ণ নাম লিখক।' : 'Please enter your full name.'
      );
      return;
    }

    if (phone.length < 10) {
      Alert.alert(
        language === 'as' ? 'মোবাইল নম্বৰ প্ৰয়োজনীয়' : 'Mobile Number Required',
        language === 'as'
          ? 'অনুগ্ৰহ কৰি সঠিক ১০ টা সংখ্যাৰ মোবাইল নম্বৰ দিয়ক।'
          : 'Please enter a valid 10-digit mobile number.'
      );
      return;
    }

    // Explicit Verification check
    if (!isPhoneVerified) {
      Alert.alert(
        language === 'as' ? 'প্ৰমাণীকৰণ প্ৰয়োজনীয়' : 'Verification Required',
        language === 'as'
          ? 'অনুগ্ৰহ কৰি OTP ৰ জৰিয়তে আপোনাৰ মোবাইল নম্বৰ প্ৰমাণিত কৰক।'
          : 'Please verify your mobile number with OTP before completing registration.'
      );
      return;
    }

    if (!address.trim()) {
      Alert.alert(
        language === 'as' ? 'ঠিকনা প্ৰয়োজনীয়' : 'Address Required',
        language === 'as' ? 'অনুগ্ৰহ কৰি ডেলিভাৰীৰ ঠিকনা লিখক।' : 'Please enter your delivery address or landmark.'
      );
      return;
    }

    triggerHaptic('success');
    setIsSubmitting(true);

    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;

    const res = await registerBuyer({
      phone: formattedPhone,
      name: name.trim(),
      email: email.trim() || undefined,
      district,
      village: village.trim(),
      address: address.trim(),
      pincode: pincode.trim(),
      lat,
      lng,
      language: language as 'en' | 'as',
    });

    setIsSubmitting(false);

    if (res.success) {
      // Reset navigation stack so authenticated screen becomes the root
      const target = selectedEntryRole === 'seller' ? '/seller/register' : '/(tabs)/explore';
      router.replace(target as any);
    } else {
      Alert.alert('Registration Error', res.error || 'Failed to complete registration.');
    }
  };

  const handleSwitchToLogin = () => {
    triggerHaptic('light');
    resetFormState();
    router.push('/(auth)/login');
  };

  const handleBackToWelcome = () => {
    triggerHaptic('light');
    resetFormState();
    router.replace('/');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: COLORS.surface }}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToWelcome}
          >
            <ArrowLeft size={20} color={COLORS.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.langButton}
            onPress={() => {
              triggerHaptic('light');
              toggleLanguage();
            }}
          >
            <Globe size={14} color={COLORS.primary} />
            <Text style={styles.langText}>
              {language === 'en' ? 'অসমীয়া' : 'English'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Title & Onboarding Intro */}
        <View style={styles.header}>
          <View style={styles.heroBadge}>
            <Sparkles size={14} color={COLORS.primary} />
            <Text style={styles.heroBadgeText}>
              {language === 'as' ? 'নতুন ক্ৰেতা পঞ্জীয়ন' : 'Buyer Profile Setup'}
            </Text>
          </View>
          <Text style={styles.title}>
            {language === 'as' ? 'আপোনাৰ প্ৰফাইল সম্পূৰ্ণ কৰক' : 'Complete Your Profile'}
          </Text>
          <Text style={styles.subtitle}>
            {language === 'as'
              ? 'স্থানীয় সতেজ শাক-পাচলি, মুগা-এৰি কাপোৰ আৰু থলুৱা মাছ সহজে লাভ কৰিবলৈ আপোনাৰ ঠিকনা দিয়ক।'
              : 'Enter your location details to discover fresh local produce and handloom artisans near you.'}
          </Text>
        </View>

        {/* Registration Form */}
        <View style={styles.formCard}>
          {/* Full Name */}
          <Text style={styles.inputLabel}>
            {language === 'as' ? 'আপোনাৰ সম্পূৰ্ণ নাম' : 'Full Name'} *
          </Text>
          <View style={styles.inputWrapper}>
            <User size={18} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.textInput}
              placeholder={language === 'as' ? 'যেনে: প্ৰণৱ দাস' : 'e.g. Pranab Das'}
              placeholderTextColor={COLORS.textMuted}
              value={name}
              editable={true}
              onChangeText={setName}
            />
          </View>

          {/* Mobile Number (Fully Editable, with Explicit Verification) */}
          <Text style={[styles.inputLabel, { marginTop: 14 }]}>
            {language === 'as' ? 'মোবাইল নম্বৰ' : 'Mobile Number'} *
          </Text>
          <View style={styles.inputWrapper}>
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
            </View>
            <TextInput
              ref={phoneInputRef}
              style={[
                styles.textInput,
                isPhoneVerified && { color: COLORS.textSecondary },
              ]}
              keyboardType="phone-pad"
              maxLength={10}
              placeholder="98765 43210"
              placeholderTextColor={COLORS.textMuted}
              value={phone}
              editable={!isPhoneVerified}
              onChangeText={(text) => {
                setPhone(text.replace(/\D/g, ''));
                if (isPhoneVerified) {
                  setIsPhoneVerified(false);
                }
                if (otpSent) {
                  setOtpSent(false);
                  setOtp('');
                }
                if (countdown > 0) {
                  if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                  }
                  setCountdown(0);
                }
              }}
            />
            {!isPhoneVerified ? (
              <TouchableOpacity
                style={[
                  styles.verifyOtpBtn,
                  phone.length === 10 && !isSendingOtp && styles.verifyOtpBtnActive,
                ]}
                onPress={handleSendOtp}
                disabled={isSendingOtp || phone.length < 10 || countdown > 0}
              >
                {isSendingOtp ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.verifyOtpBtnText}>
                    {countdown > 0 ? `${countdown}s` : otpSent ? 'Resend' : t('sendOtp')}
                  </Text>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.verifiedBadgeContainer}
                onPress={handleEditPhoneNumber}
                activeOpacity={0.7}
              >
                <CheckCircle2 size={16} color={COLORS.success} />
                <Text style={styles.verifiedBadgeText}>Verified</Text>
                <View style={styles.editPill}>
                  <Edit2 size={11} color={COLORS.primary} />
                  <Text style={styles.editText}>Edit</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Explicit OTP Verification Section if OTP Sent */}
          {otpSent && !isPhoneVerified && (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.inputLabel}>{t('otp')} *</Text>
              <View style={styles.inputWrapper}>
                <KeyRound size={18} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.textInput, { letterSpacing: 4, fontWeight: '800' }]}
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholder="123456"
                  placeholderTextColor={COLORS.textMuted}
                  value={otp}
                  editable={true}
                  onChangeText={setOtp}
                />
                <TouchableOpacity
                  style={[
                    styles.confirmOtpBtn,
                    otp.length >= 4 && !isVerifyingOtp && styles.confirmOtpBtnActive,
                  ]}
                  onPress={handleVerifyOtp}
                  disabled={isVerifyingOtp || otp.length < 4}
                >
                  {isVerifyingOtp ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.confirmOtpBtnText}>Verify OTP</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Email Input Field (Fully Editable) */}
          <Text style={[styles.inputLabel, { marginTop: 14 }]}>
            {language === 'as' ? 'ইমেইল ঠিকনা (ঐচ্ছিক)' : 'Email Address (Optional)'}
          </Text>
          <View style={styles.inputWrapper}>
            <Mail size={18} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.textInput}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="name@example.com"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              editable={true}
              onChangeText={setEmail}
            />
          </View>

          {/* District Selector */}
          <Text style={[styles.inputLabel, { marginTop: 14 }]}>
            {language === 'as' ? 'জিলা নিৰ্বাচন কৰক' : 'Assam District'} *
          </Text>
          <TouchableOpacity
            style={styles.inputWrapper}
            onPress={() => {
              triggerHaptic('light');
              setShowDistrictPicker(!showDistrictPicker);
            }}
          >
            <MapPin size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.text }}>
              {district} District
            </Text>
            <Text style={{ fontSize: 12, color: COLORS.primary, fontWeight: '700' }}>
              {showDistrictPicker ? 'Hide ▲' : 'Change ▼'}
            </Text>
          </TouchableOpacity>

          {/* District Dropdown list */}
          {showDistrictPicker && (
            <View style={styles.districtList}>
              <ScrollView nestedScrollEnabled style={{ maxHeight: 180 }}>
                {ASSAM_DISTRICTS.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.districtItem,
                      district === d && { backgroundColor: COLORS.primaryLight },
                    ]}
                    onPress={() => {
                      triggerHaptic('light');
                      setDistrict(d);
                      setShowDistrictPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.districtItemText,
                        district === d && { color: COLORS.primary, fontWeight: '800' },
                      ]}
                    >
                      📍 {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Village / Town */}
          <Text style={[styles.inputLabel, { marginTop: 14 }]}>
            {language === 'as' ? 'গাওঁ / নগৰ / পৌৰ এলেকা' : 'Town / Village / Gaon'} *
          </Text>
          <View style={styles.inputWrapper}>
            <Home size={18} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.textInput}
              placeholder={language === 'as' ? 'যেনে: মঙলদৈ বা ছিপাজাৰ' : 'e.g. Mangaldai Town / Sipajhar'}
              placeholderTextColor={COLORS.textMuted}
              value={village}
              editable={true}
              onChangeText={setVillage}
            />
          </View>

          {/* Delivery Address */}
          <Text style={[styles.inputLabel, { marginTop: 14 }]}>
            {language === 'as' ? 'সম্পূৰ্ণ ডেলিভাৰী ঠিকনা আৰু চিনাক্ত স্থান' : 'Street Address & Landmark'} *
          </Text>
          <View style={[styles.inputWrapper, { height: 74, alignItems: 'flex-start', paddingTop: 10 }]}>
            <TextInput
              style={[styles.textInput, { height: '100%', textAlignVertical: 'top' }]}
              placeholder={
                language === 'as'
                  ? 'যেনে: ৱাৰ্ড নং ৪, চিকিৎসালয় পথ, এছ বি আই এটিএমৰ কাষত'
                  : 'e.g. Ward No 4, Hospital Road, Near SBI ATM'
              }
              placeholderTextColor={COLORS.textMuted}
              multiline
              value={address}
              editable={true}
              onChangeText={setAddress}
            />
          </View>

          {/* Pincode */}
          <Text style={[styles.inputLabel, { marginTop: 14 }]}>
            {language === 'as' ? 'পিন ক\'ড' : 'PIN Code'}
          </Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="784125"
              placeholderTextColor={COLORS.textMuted}
              value={pincode}
              editable={true}
              onChangeText={setPincode}
            />
          </View>

          {/* Auto-detect Location Button */}
          <TouchableOpacity
            style={styles.locationBtn}
            onPress={handleDetectLocation}
            disabled={isLocating}
          >
            {isLocating ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <>
                <Navigation size={16} color={COLORS.primary} />
                <Text style={styles.locationBtnText}>
                  {language === 'as' ? 'মোৰ জিপিএছ স্থান চিনাক্ত কৰক' : 'Auto-Detect Current GPS Location'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, !isPhoneVerified && styles.submitBtnDisabled]}
            onPress={handleRegister}
            disabled={isSubmitting}
            activeOpacity={0.88}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>
                {language === 'as' ? 'প্ৰফাইল সংৰক্ষণ কৰি আগবাঢ়ক' : 'Save & Start Exploring Local Produce'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer Navigation Switch: Already have account -> Sign In */}
        <View style={styles.footerRow}>
          <TouchableOpacity
            onPress={handleSwitchToLogin}
            style={styles.switchPromptBtn}
          >
            <Text style={styles.switchPromptText}>
              {language === 'as' ? 'ইতিমধ্যে একাউণ্ট আছে? প্ৰৱেশ কৰক' : 'Already have an account? Sign In'}
            </Text>
          </TouchableOpacity>

          <View style={styles.securityBadge}>
            <ShieldCheck size={14} color={COLORS.success} />
            <Text style={styles.securityText}>
              {language === 'as' ? 'সুৰক্ষিত প্ৰমাণীকৰণ (Supabase & Node.js)' : 'Secured with Supabase & Node.js API'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    flexGrow: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  langText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  header: {
    marginBottom: 20,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 48,
  },
  countryCode: {
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    paddingRight: 8,
    marginRight: 8,
  },
  countryCodeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  verifyOtpBtn: {
    backgroundColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  verifyOtpBtnActive: {
    backgroundColor: COLORS.primary,
  },
  verifyOtpBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  confirmOtpBtn: {
    backgroundColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  confirmOtpBtnActive: {
    backgroundColor: COLORS.secondary,
  },
  confirmOtpBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  verifiedBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  verifiedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.success,
  },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  editText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  districtList: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    marginTop: 4,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  districtItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  districtItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(19, 117, 71, 0.25)',
  },
  locationBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    ...SHADOWS.sm,
  },
  submitBtnDisabled: {
    opacity: 0.85,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  footerRow: {
    alignItems: 'center',
    marginTop: 22,
    gap: 14,
  },
  switchPromptBtn: {
    padding: 6,
  },
  switchPromptText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  securityText: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: '600',
  },
});
