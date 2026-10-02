import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Clock, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react-native';
import { COLORS, SHADOWS } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { triggerHaptic } from '../../lib/haptics';

export default function SellerVerificationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language, t } = useLanguage();
  const { sellerProfile } = useAuth();

  const isVerified = sellerProfile?.verification_status === 'verified';

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 30, paddingBottom: insets.bottom + 20 },
      ]}
    >
      <View style={styles.centerBox}>
        <View
          style={[
            styles.iconBox,
            { backgroundColor: isVerified ? COLORS.successLight : COLORS.secondaryLight },
          ]}
        >
          {isVerified ? (
            <CheckCircle2 size={64} color={COLORS.success} />
          ) : (
            <Clock size={64} color={COLORS.secondary} />
          )}
        </View>

        <Text style={styles.title}>
          {isVerified
            ? language === 'as'
              ? 'একাউণ্ট প্ৰমাণিত হ’ল!'
              : 'Producer Account Verified!'
            : t('verificationPending')}
        </Text>

        <Text style={styles.subtitle}>
          {isVerified
            ? language === 'as'
              ? 'আপোনাৰ আত্মসহায়ক গোট আৰু নথি-পত্ৰসমূহ চৰকাৰীভাৱে পৰীক্ষা কৰি অনুমোদন কৰা হৈছে।'
              : 'Your SHG registration and KYC credentials have been approved by the district coordinator.'
            : t('verificationMsg')}
        </Text>

        {/* Verification Checklist */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Verification Checklist</Text>

          <View style={styles.checkItem}>
            <CheckCircle2 size={16} color={COLORS.success} />
            <Text style={styles.checkText}>Identity & Aadhaar Validation</Text>
          </View>

          <View style={styles.checkItem}>
            <CheckCircle2 size={16} color={COLORS.success} />
            <Text style={styles.checkText}>SHG / Enterprise Code Registered</Text>
          </View>

          <View style={styles.checkItem}>
            <CheckCircle2 size={16} color={COLORS.success} />
            <Text style={styles.checkText}>Bank / Direct UPI Link Active</Text>
          </View>

          <View style={styles.checkItem}>
            <CheckCircle2
              size={16}
              color={isVerified ? COLORS.success : COLORS.secondary}
            />
            <Text style={styles.checkText}>
              {isVerified
                ? 'District Coordinator Approved'
                : 'District Coordinator Review (In Progress)'}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.dashboardBtn}
        onPress={() => {
          triggerHaptic('medium');
          router.replace('/seller/dashboard');
        }}
        activeOpacity={0.88}
      >
        <Text style={styles.dashboardBtnText}>{t('goToDashboard')}</Text>
        <ArrowRight size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  centerBox: {
    alignItems: 'center',
    paddingTop: 30,
  },
  iconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    ...SHADOWS.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.background,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 28,
    gap: 12,
  },
  cardHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
  dashboardBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    ...SHADOWS.sm,
  },
  dashboardBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
