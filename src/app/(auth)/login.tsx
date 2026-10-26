import React, { useState, useEffect, useCallback } from 'react';
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
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ShieldCheck,
  KeyRound,
  Globe,
  ShoppingBag,
  Store,
} from 'lucide-react-native';
import { COLORS, SHADOWS } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { triggerHaptic } from '../../lib/haptics';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language, toggleLanguage, t } = useLanguage();
  const {
    selectedEntryRole,
    setSelectedEntryRole,
    sendOtp,
    verifyOtp,
    sellerProfile,
    user,
    isAuthenticated,
    isLoading: isAuthLoading,
  } = useAuth();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const isSeller = selectedEntryRole === 'seller';

  // Completely reset form state
  const resetFormState = useCallback(() => {
    setPhone('');
    setOtp('');
    setOtpSent(false);
    setCountdown(0);
    setIsLoading(false);
    setIsVerifying(false);
  }, []);

  // Form State Isolation: Reset on focus when navigating between Login & Register
  useFocusEffect(
    useCallback(() => {
      resetFormState();
    }, [resetFormState])
  );

  // Session Protection: Prevent authenticated users from staying in login screen
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && user) {
      const target = isSeller
        ? sellerProfile
          ? '/seller/dashboard'
          : '/seller/register'
        : '/(tabs)/explore';
      router.replace(target as any);
    }
  }, [isAuthLoading, isAuthenticated, user, isSeller, sellerProfile, router]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((c) => c - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

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
    setIsLoading(true);

    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;
    const res = await sendOtp(formattedPhone);
    setIsLoading(false);

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
      Alert.alert('OTP Required', 'Please enter the 6-digit OTP.');
      return;
    }

    triggerHaptic('medium');
    setIsVerifying(true);

    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;
    const res = await verifyOtp(formattedPhone, otp);
    setIsVerifying(false);

    if (res.success) {
      triggerHaptic('success');
      if (res.isNewUser) {
        // Arrived via "Verify and Continue" flow after completing verification:
        // Pass verified credentials to Complete Profile page
        router.push({
          pathname: '/(auth)/register',
          params: {
            phone: formattedPhone,
            verified: 'true',
          },
        });
      } else {
        // Reset navigation stack so authenticated screen becomes the root of the stack
        const target = isSeller
          ? sellerProfile
            ? '/seller/dashboard'
            : '/seller/register'
          : '/(tabs)/explore';
        router.replace(target as any);
      }
    } else {
      Alert.alert('Verification Failed', res.error || 'Invalid OTP code.');
    }
  };

  // Standard registration link (do NOT auto-populate credentials)
  const handleSwitchToRegister = () => {
    triggerHaptic('light');
    resetFormState();
    if (isSeller) {
      router.push('/seller/register');
    } else {
      router.push('/(auth)/register');
    }
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
        {/* Top Navigation Row */}
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

        {/* Role Toggle Selector */}
        <View style={styles.roleToggle}>
          <TouchableOpacity
            style={[styles.roleOption, !isSeller && styles.activeRoleOption]}
            onPress={() => {
              triggerHaptic('light');
              resetFormState();
              setSelectedEntryRole('buyer');
            }}
          >
            <ShoppingBag size={16} color={!isSeller ? COLORS.primary : COLORS.textSecondary} />
            <Text style={[styles.roleOptionText, !isSeller && styles.activeRoleText]}>
              {language === 'as' ? 'ক্ৰেতা (Buyer)' : 'Buyer'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleOption, isSeller && styles.activeRoleOption]}
            onPress={() => {
              triggerHaptic('light');
              resetFormState();
              setSelectedEntryRole('seller');
            }}
          >
            <Store size={16} color={isSeller ? COLORS.secondary : COLORS.textSecondary} />
            <Text style={[styles.roleOptionText, isSeller && styles.activeRoleText]}>
              {language === 'as' ? 'বিক্ৰেতা / গোট (Seller)' : 'Seller / SHG'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Header Title */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {isSeller ? t('sellerLogin') : t('buyerLogin')}
          </Text>
          <Text style={styles.subtitle}>
            {isSeller
              ? language === 'as'
                ? 'আপোনাৰ মোবাইল নম্বৰেৰে বিক্ৰেতা একাউণ্টত প্ৰৱেশ কৰক'
                : 'Access your micro-enterprise dashboard via instant OTP'
              : language === 'as'
              ? 'মোবাইল নম্বৰৰ জৰিয়তে সতেজ সামগ্ৰী অৰ্ডাৰ কৰক'
              : 'Enter your phone number to browse and order fresh local produce'}
          </Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          {/* Mobile Number Input (Fully Editable) */}
          <Text style={styles.inputLabel}>{t('mobileNumber')} *</Text>
          <View style={styles.inputWrapper}>
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
            </View>
            <TextInput
              style={styles.textInput}
              keyboardType="phone-pad"
              maxLength={10}
              placeholder="98765 43210"
              placeholderTextColor={COLORS.textMuted}
              value={phone}
              editable={true}
              onChangeText={(text) => {
                setPhone(text.replace(/\D/g, ''));
                if (otpSent) {
                  setOtpSent(false);
                  setOtp('');
                }
              }}
            />
            <TouchableOpacity
              style={[
                styles.sendOtpBtn,
                phone.length === 10 && !isLoading && styles.sendOtpBtnActive,
              ]}
              onPress={handleSendOtp}
              disabled={isLoading || phone.length < 10 || countdown > 0}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.sendOtpText}>
                  {countdown > 0 ? `${countdown}s` : otpSent ? 'Resend' : t('sendOtp')}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* OTP Input (Explicit Entry) */}
          <Text style={[styles.inputLabel, { marginTop: 16 }]}>{t('otp')}</Text>
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
          </View>

          {/* Verify & Login Button */}
          <TouchableOpacity
            style={[styles.primaryButton, isSeller ? styles.sellerBtn : styles.buyerBtn]}
            onPress={handleVerifyOtp}
            disabled={isVerifying || otp.length < 4}
            activeOpacity={0.88}
          >
            {isVerifying ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {language === 'as' ? 'প্ৰৱেশ কৰক / পঞ্জীয়ন' : 'Verify & Continue'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer info & Navigation switch */}
        <View style={styles.footerRow}>
          {isSeller ? (
            <TouchableOpacity
              onPress={handleSwitchToRegister}
              style={styles.switchPromptBtn}
            >
              <Text style={styles.switchPromptText}>{t('newSellerPrompt')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleSwitchToRegister}
              style={styles.switchPromptBtn}
            >
              <Text style={styles.switchPromptText}>
                {language === 'as' ? '✨ নতুন একাউণ্ট সৃষ্টি কৰক' : '✨ New to Thaluwa Bazar? Register Profile'}
              </Text>
            </TouchableOpacity>
          )}

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
  roleToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
  },
  activeRoleOption: {
    backgroundColor: COLORS.surface,
    ...SHADOWS.sm,
  },
  roleOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeRoleText: {
    color: COLORS.text,
    fontWeight: '800',
  },
  header: {
    marginBottom: 20,
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
    lineHeight: 19,
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 50,
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
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '600',
  },
  sendOtpBtn: {
    backgroundColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  sendOtpBtnActive: {
    backgroundColor: COLORS.primary,
  },
  sendOtpText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  primaryButton: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    ...SHADOWS.sm,
  },
  buyerBtn: {
    backgroundColor: COLORS.primary,
  },
  sellerBtn: {
    backgroundColor: COLORS.secondary,
  },
  primaryButtonText: {
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
