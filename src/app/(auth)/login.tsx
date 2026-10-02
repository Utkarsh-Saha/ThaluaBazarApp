import React, { useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ShieldCheck, Smartphone, KeyRound, Globe } from 'lucide-react-native';
import { COLORS, SHADOWS } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { triggerHaptic } from '../../lib/haptics';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language, toggleLanguage, t } = useLanguage();
  const { selectedEntryRole, setSelectedEntryRole, sendOtp, verifyOtp } = useAuth();

  const [phone, setPhone] = useState('9876543210');
  const [otp, setOtp] = useState('123456');
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isSeller = selectedEntryRole === 'seller';

  const handleSendOtp = async () => {
    if (phone.length < 10) return;
    triggerHaptic('medium');
    setIsLoading(true);
    await sendOtp(phone);
    setIsLoading(false);
    setOtpSent(true);
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 4) return;
    triggerHaptic('success');
    setIsLoading(true);
    const success = await verifyOtp(phone, otp);
    setIsLoading(false);
    if (success) {
      if (isSeller) {
        router.replace('/seller/dashboard');
      } else {
        router.replace('/(tabs)/explore');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: COLORS.surface }}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20 },
        ]}
      >
        {/* Top navigation */}
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              triggerHaptic('light');
              router.back();
            }}
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

        {/* Role Segmented Selector */}
        <View style={styles.roleToggle}>
          <TouchableOpacity
            style={[styles.roleOption, !isSeller && styles.activeRoleOption]}
            onPress={() => {
              triggerHaptic('light');
              setSelectedEntryRole('buyer');
            }}
          >
            <Text style={[styles.roleOptionText, !isSeller && styles.activeRoleText]}>
              {language === 'as' ? 'ক্ৰেতা (Buyer)' : 'Buyer'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleOption, isSeller && styles.activeRoleOption]}
            onPress={() => {
              triggerHaptic('light');
              setSelectedEntryRole('seller');
            }}
          >
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

        {/* Form */}
        <View style={styles.formCard}>
          {/* Phone Input */}
          <Text style={styles.inputLabel}>{t('mobileNumber')}</Text>
          <View style={styles.inputWrapper}>
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>+91</Text>
            </View>
            <Smartphone size={18} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.textInput}
              keyboardType="phone-pad"
              maxLength={10}
              placeholder="98765 43210"
              placeholderTextColor={COLORS.textMuted}
              value={phone}
              onChangeText={setPhone}
            />
            {!otpSent && (
              <TouchableOpacity
                style={[styles.sendOtpBtn, phone.length === 10 && styles.sendOtpBtnActive]}
                onPress={handleSendOtp}
                disabled={isLoading || phone.length < 10}
              >
                <Text style={styles.sendOtpText}>
                  {isLoading ? '...' : t('sendOtp')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* OTP Input */}
          <Text style={[styles.inputLabel, { marginTop: 18 }]}>{t('otp')}</Text>
          <View style={styles.inputWrapper}>
            <KeyRound size={18} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.textInput}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="123456"
              placeholderTextColor={COLORS.textMuted}
              value={otp}
              onChangeText={setOtp}
            />
          </View>

          {/* Primary Action Button */}
          <TouchableOpacity
            style={[styles.primaryButton, isSeller ? styles.sellerBtn : styles.buyerBtn]}
            onPress={handleVerifyOtp}
            disabled={isLoading}
            activeOpacity={0.88}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>{t('loginRegister')}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Alternate link */}
        <View style={styles.footerRow}>
          {isSeller ? (
            <TouchableOpacity
              onPress={() => router.push('/seller/register')}
              style={styles.switchPromptBtn}
            >
              <Text style={styles.switchPromptText}>{t('newSellerPrompt')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => router.push('/seller/register')}
              style={styles.switchPromptBtn}
            >
              <Text style={styles.switchPromptText}>{t('newSellerPrompt')}</Text>
            </TouchableOpacity>
          )}

          <View style={styles.securityBadge}>
            <ShieldCheck size={14} color={COLORS.success} />
            <Text style={styles.securityText}>
              {language === 'as' ? 'সুৰক্ষিত প্ৰমাণীকৰণ (Supabase Auth)' : 'Secured by Supabase Auth'}
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
    paddingVertical: 10,
    alignItems: 'center',
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
    color: COLORS.primary,
    fontWeight: '800',
  },
  header: {
    marginBottom: 24,
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
    paddingRight: 10,
    marginRight: 10,
  },
  countryCodeText: {
    fontSize: 14,
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
    paddingVertical: 6,
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
    marginTop: 24,
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
    marginTop: 28,
    gap: 16,
  },
  switchPromptBtn: {
    padding: 8,
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
