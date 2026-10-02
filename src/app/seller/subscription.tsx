import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Crown,
  CheckCircle,
  Sparkles,
  Calendar,
  CreditCard,
  ShieldCheck,
  Zap,
  ArrowRight,
  X,
  QrCode,
} from 'lucide-react-native';
import { COLORS, SHADOWS } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { triggerHaptic } from '../../lib/haptics';

export default function SellerSubscriptionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const { sellerProfile } = useAuth();

  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'pro'>('basic');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [renewing, setRenewing] = useState(false);

  const handleRenew = () => {
    triggerHaptic('medium');
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = () => {
    triggerHaptic('success');
    setRenewing(true);
    setTimeout(() => {
      setRenewing(false);
      setShowPaymentModal(false);
      Alert.alert(
        language === 'as' ? 'পেকেজ নবীকৰণ সফল!' : 'Subscription Renewed!',
        language === 'as'
          ? 'আপোনাৰ বিক্ৰেতা পৰিকল্পনা অহা ৩০ দিনৰ বাবে বৃদ্ধি কৰা হ’ল।'
          : 'Your seller plan has been extended for another 30 days.'
      );
    }, 1000);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color={COLORS.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {language === 'as' ? 'বিক্ৰেতা চাবস্ক্ৰিপশ্বন' : 'Seller Subscription'}
        </Text>

        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Active Plan Card (from Blueprint) */}
        <View style={styles.activePlanCard}>
          <View style={styles.planHeader}>
            <View>
              <Text style={styles.planLabel}>
                {language === 'as' ? 'বৰ্তমানৰ পৰিকল্পনা' : 'Current Plan'}
              </Text>
              <Text style={styles.activePlanName}>
                {language === 'as' ? 'বেছিক প্লেন (Basic Plan)' : 'Basic Producer Plan'}
              </Text>
            </View>
            <View style={styles.crownCircle}>
              <Crown size={22} color={COLORS.secondary} />
            </View>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceAmount}>₹20</Text>
            <Text style={styles.pricePeriod}>/ {language === 'as' ? 'মাহেকীয়া' : 'month'}</Text>
          </View>

          <View style={styles.validityRow}>
            <Calendar size={14} color={COLORS.textSecondary} />
            <Text style={styles.validityText}>
              {language === 'as' ? 'বৈধতা: ১০ নৱেম্বৰ ২০২৬ লৈ' : 'Valid till: 10 Nov 2026'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.renewBtn}
            onPress={handleRenew}
            activeOpacity={0.85}
          >
            <Zap size={16} color="#FFFFFF" />
            <Text style={styles.renewBtnText}>
              {language === 'as' ? 'এতিয়াই নবীকৰণ কৰক' : 'Renew Plan Now'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Upgrade Plan Options */}
        <Text style={styles.sectionHeading}>
          {language === 'as' ? 'পেকেজসমূহ বাছক' : 'Available Plans for Producers & SHGs'}
        </Text>

        {/* Plan 1: Basic */}
        <TouchableOpacity
          style={[styles.planCard, selectedPlan === 'basic' && styles.selectedPlanCard]}
          onPress={() => {
            triggerHaptic('light');
            setSelectedPlan('basic');
          }}
          activeOpacity={0.88}
        >
          <View style={styles.planCardTop}>
            <View>
              <Text style={styles.planTitle}>Basic Plan</Text>
              <Text style={styles.planSub}>For individual micro-farmers & small stalls</Text>
            </View>
            <Text style={styles.cardPrice}>₹20<Text style={styles.cardPricePeriod}>/mo</Text></Text>
          </View>

          <View style={styles.featureList}>
            <View style={styles.featureRow}>
              <CheckCircle size={14} color={COLORS.primary} />
              <Text style={styles.featureText}>Up to 15 active product listings</Text>
            </View>
            <View style={styles.featureRow}>
              <CheckCircle size={14} color={COLORS.primary} />
              <Text style={styles.featureText}>15 km hyperlocal buyer discovery radius</Text>
            </View>
            <View style={styles.featureRow}>
              <CheckCircle size={14} color={COLORS.primary} />
              <Text style={styles.featureText}>Direct UPI settlements with 0% gateway cuts</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Plan 2: Pro SHG */}
        <TouchableOpacity
          style={[styles.planCard, selectedPlan === 'pro' && styles.selectedPlanCard]}
          onPress={() => {
            triggerHaptic('light');
            setSelectedPlan('pro');
          }}
          activeOpacity={0.88}
        >
          <View style={styles.proBadge}>
            <Sparkles size={12} color="#FFFFFF" />
            <Text style={styles.proBadgeText}>RECOMMENDED FOR SHGs</Text>
          </View>

          <View style={styles.planCardTop}>
            <View>
              <Text style={styles.planTitle}>Pro SHG Cluster Plan</Text>
              <Text style={styles.planSub}>For registered Mahila SHGs & Organic Cooperatives</Text>
            </View>
            <Text style={[styles.cardPrice, { color: COLORS.secondary }]}>₹50<Text style={styles.cardPricePeriod}>/mo</Text></Text>
          </View>

          <View style={styles.featureList}>
            <View style={styles.featureRow}>
              <CheckCircle size={14} color={COLORS.secondary} />
              <Text style={styles.featureText}>Unlimited product listings & bulk stock</Text>
            </View>
            <View style={styles.featureRow}>
              <CheckCircle size={14} color={COLORS.secondary} />
              <Text style={styles.featureText}>25 km wide-radius district visibility</Text>
            </View>
            <View style={styles.featureRow}>
              <CheckCircle size={14} color={COLORS.secondary} />
              <Text style={styles.featureText}>Featured banner spotlight in Weekly Haats</Text>
            </View>
            <View style={styles.featureRow}>
              <CheckCircle size={14} color={COLORS.secondary} />
              <Text style={styles.featureText}>Dedicated WhatsApp manager support</Text>
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Payment Modal */}
      <Modal visible={showPaymentModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {language === 'as' ? 'UPI দ্বাৰা পৰিশোধ' : 'UPI Instant Renewal'}
              </Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <X size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.qrBox}>
              <QrCode size={100} color={COLORS.primary} />
              <Text style={styles.qrText}>Scan via Google Pay / PhonePe / BHIM</Text>
              <Text style={styles.qrAmount}>
                ₹{selectedPlan === 'basic' ? '20' : '50'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.confirmPayBtn}
              onPress={handleConfirmPayment}
              disabled={renewing}
              activeOpacity={0.85}
            >
              <CreditCard size={16} color="#FFFFFF" />
              <Text style={styles.confirmPayText}>
                {renewing
                  ? language === 'as'
                    ? 'যাচাই কৰি থকা হৈছে...'
                    : 'Verifying UPI Payment...'
                  : language === 'as'
                  ? 'পৰিশোধ সম্পূৰ্ণ কৰক'
                  : 'Confirm ₹' + (selectedPlan === 'basic' ? '20' : '50') + ' Payment'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  activePlanCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(198, 139, 23, 0.4)',
    ...SHADOWS.md,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  activePlanName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 2,
  },
  crownCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 12,
  },
  priceAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.primary,
  },
  pricePeriod: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  validityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  validityText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  renewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.secondary,
    paddingVertical: 12,
    borderRadius: 12,
    ...SHADOWS.sm,
  },
  renewBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 6,
  },
  planCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  selectedPlanCard: {
    borderColor: COLORS.primary,
    backgroundColor: '#F7FDF9',
  },
  proBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  proBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  planCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  planSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    maxWidth: 200,
  },
  cardPrice: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primary,
  },
  cardPricePeriod: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  featureList: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 12,
    color: COLORS.text,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  qrBox: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: '100%',
    gap: 8,
  },
  qrText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  qrAmount: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.primary,
  },
  confirmPayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 20,
    ...SHADOWS.md,
  },
  confirmPayText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
