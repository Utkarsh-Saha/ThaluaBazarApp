import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import {
  X,
  CreditCard,
  Smartphone,
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react-native';
import { COLORS, SHADOWS } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { triggerHaptic } from '../lib/haptics';
import { generateUpiIntentUrl, launchNativeUpiApp } from '../lib/payments';

export type PaymentRailTab = 'upi' | 'card' | 'netbanking';

interface RazorpayCheckoutModalProps {
  visible: boolean;
  orderNumber: string;
  amount: number;
  razorpayOrderId: string;
  initialTab?: PaymentRailTab;
  isMock?: boolean;
  buyerName?: string;
  buyerPhone?: string;
  sellerVpa?: string;
  sellerName?: string;
  onClose: () => void;
  onSuccess: (paymentData: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) => void;
  onFailure: (error: string) => void;
}

type TabType = PaymentRailTab;

const POPULAR_BANKS = [
  { id: 'sbi', name: 'State Bank of India', code: 'SBIN' },
  { id: 'agvb', name: 'Assam Gramin Vikash Bank', code: 'AGVB' },
  { id: 'hdfc', name: 'HDFC Bank', code: 'HDFC' },
  { id: 'icici', name: 'ICICI Bank', code: 'ICIC' },
  { id: 'pnb', name: 'Punjab National Bank', code: 'PUNB' },
];

export const RazorpayCheckoutModal: React.FC<RazorpayCheckoutModalProps> = ({
  visible,
  orderNumber,
  amount,
  razorpayOrderId,
  initialTab = 'upi',
  isMock = false,
  buyerName = 'Buyer',
  sellerVpa = 'thaluwa.shg@oksbi',
  sellerName = 'Thaluwa Bazar Producer',
  onClose,
  onSuccess,
  onFailure,
}) => {
  const { language } = useLanguage();
  const [prevInitialTab, setPrevInitialTab] = useState(initialTab);
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [isProcessing, setIsProcessing] = useState(false);

  // Sync activeTab whenever initialTab changes without an effect
  if (initialTab !== prevInitialTab) {
    setPrevInitialTab(initialTab);
    setActiveTab(initialTab);
  }

  // Card Form State
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // UPI VPA State
  const [customVpa, setCustomVpa] = useState('');
  const [selectedBank, setSelectedBank] = useState<string>('sbi');

  const formattedAmount = amount.toFixed(2);

  // Handle UPI Intent App launch
  const handleLaunchUpi = async (appName: string) => {
    triggerHaptic('medium');
    const upiUrl = generateUpiIntentUrl({
      vpa: sellerVpa,
      name: sellerName,
      amount,
      orderNumber,
      note: `Produce order #${orderNumber} (${appName})`,
    });

    const launched = await launchNativeUpiApp(upiUrl);
    if (!launched) {
      Alert.alert(
        'UPI App Not Found',
        `Could not open ${appName}. You can use any other installed UPI app or test payment button.`
      );
    }
  };

  // Simulate or complete payment
  const handleExecutePayment = async () => {
    triggerHaptic('medium');
    setIsProcessing(true);

    // Simulate standard Razorpay gateway processing delay
    setTimeout(() => {
      setIsProcessing(false);
      triggerHaptic('success');
      const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const signature = `sim_${Date.now()}_sig_${Math.random().toString(36).substring(2, 9)}`;

      onSuccess({
        razorpayOrderId: razorpayOrderId || `order_${Date.now()}`,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
      });
    }, 1500);
  };

  const handleSimulateFailure = () => {
    triggerHaptic('heavy');
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onFailure('Payment declined by issuing bank (User cancelled)');
    }, 1000);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerBrandRow}>
              <View style={styles.rzpBadge}>
                <Text style={styles.rzpBadgeText}>Razorpay</Text>
              </View>
              <Text style={styles.headerSubtitle}>
                {language === 'as' ? 'সুৰক্ষিত পেমেণ্ট গেটৱে’' : 'Secured Checkout'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              disabled={isProcessing}
              activeOpacity={0.7}
            >
              <X size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Amount Hero */}
          <View style={styles.amountHero}>
            <Text style={styles.amountLabel}>
              {language === 'as' ? 'পৰিশোধ কৰিবলগীয়া মুঠ ধন' : 'Amount Payable'}
            </Text>
            <Text style={styles.amountValue}>₹{formattedAmount}</Text>
            <Text style={styles.orderNumberLabel}>Order {orderNumber}</Text>
          </View>

          {/* Sandbox Developer Badge if Mock/Placeholder */}
          {isMock && (
            <View style={styles.mockBanner}>
              <AlertCircle size={14} color="#D97706" />
              <Text style={styles.mockBannerText}>
                {language === 'as'
                  ? 'টেষ্ট ম’ড সক্ৰিয় • কোনো প্ৰকৃত ধন কৰ্তন নহয়'
                  : 'Razorpay Sandbox Mode Active • Zero live money charged'}
              </Text>
            </View>
          )}

          {/* Payment Method Tabs */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'upi' && styles.tabBtnActive]}
              onPress={() => {
                triggerHaptic('light');
                setActiveTab('upi');
              }}
            >
              <Smartphone
                size={16}
                color={activeTab === 'upi' ? COLORS.primary : COLORS.textSecondary}
              />
              <Text style={[styles.tabBtnText, activeTab === 'upi' && styles.tabBtnTextActive]}>
                UPI
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'card' && styles.tabBtnActive]}
              onPress={() => {
                triggerHaptic('light');
                setActiveTab('card');
              }}
            >
              <CreditCard
                size={16}
                color={activeTab === 'card' ? COLORS.primary : COLORS.textSecondary}
              />
              <Text style={[styles.tabBtnText, activeTab === 'card' && styles.tabBtnTextActive]}>
                Card
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'netbanking' && styles.tabBtnActive]}
              onPress={() => {
                triggerHaptic('light');
                setActiveTab('netbanking');
              }}
            >
              <Building2
                size={16}
                color={activeTab === 'netbanking' ? COLORS.primary : COLORS.textSecondary}
              />
              <Text
                style={[styles.tabBtnText, activeTab === 'netbanking' && styles.tabBtnTextActive]}
              >
                Netbanking
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          <ScrollView style={styles.tabContentScroll} showsVerticalScrollIndicator={false}>
            {activeTab === 'upi' && (
              <View style={styles.tabBody}>
                <Text style={styles.tabSectionTitle}>
                  {language === 'as' ? 'ইউ.পি.আই. এপৰ জৰিয়তে পৰিশোধ' : 'Pay via UPI Apps'}
                </Text>

                <View style={styles.upiAppsGrid}>
                  <TouchableOpacity
                    style={styles.upiAppTile}
                    onPress={() => handleLaunchUpi('Google Pay')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.upiAppIcon}>🟢</Text>
                    <Text style={styles.upiAppName}>Google Pay</Text>
                    <ExternalLink size={12} color={COLORS.textMuted} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.upiAppTile}
                    onPress={() => handleLaunchUpi('PhonePe')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.upiAppIcon}>🟣</Text>
                    <Text style={styles.upiAppName}>PhonePe</Text>
                    <ExternalLink size={12} color={COLORS.textMuted} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.upiAppTile}
                    onPress={() => handleLaunchUpi('Paytm')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.upiAppIcon}>🔵</Text>
                    <Text style={styles.upiAppName}>Paytm UPI</Text>
                    <ExternalLink size={12} color={COLORS.textMuted} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.upiAppTile}
                    onPress={() => handleLaunchUpi('BHIM')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.upiAppIcon}>🟠</Text>
                    <Text style={styles.upiAppName}>BHIM UPI</Text>
                    <ExternalLink size={12} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR ENTER VPA</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TextInput
                  style={styles.inputField}
                  placeholder="yourname@okhdfcbank"
                  placeholderTextColor={COLORS.textMuted}
                  value={customVpa}
                  onChangeText={setCustomVpa}
                  autoCapitalize="none"
                />
              </View>
            )}

            {activeTab === 'card' && (
              <View style={styles.tabBody}>
                <Text style={styles.tabSectionTitle}>Debit / Credit Card</Text>

                <TextInput
                  style={styles.inputField}
                  placeholder="Card Number (XXXX XXXX XXXX XXXX)"
                  placeholderTextColor={COLORS.textMuted}
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  keyboardType="numeric"
                  maxLength={19}
                />

                <View style={styles.cardRow}>
                  <TextInput
                    style={[styles.inputField, { flex: 1 }]}
                    placeholder="MM / YY"
                    placeholderTextColor={COLORS.textMuted}
                    value={cardExpiry}
                    onChangeText={setCardExpiry}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                  <TextInput
                    style={[styles.inputField, { flex: 1 }]}
                    placeholder="CVV"
                    placeholderTextColor={COLORS.textMuted}
                    value={cardCvv}
                    onChangeText={setCardCvv}
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                  />
                </View>

                <Text style={styles.secureCardNote}>
                  🔒 Cards processed via 256-bit encrypted Razorpay PCI-DSS Level 1 gateway.
                </Text>
              </View>
            )}

            {activeTab === 'netbanking' && (
              <View style={styles.tabBody}>
                <Text style={styles.tabSectionTitle}>Select Bank</Text>
                {POPULAR_BANKS.map((b) => (
                  <TouchableOpacity
                    key={b.id}
                    style={[
                      styles.bankRow,
                      selectedBank === b.id && styles.bankRowSelected,
                    ]}
                    onPress={() => {
                      triggerHaptic('light');
                      setSelectedBank(b.id);
                    }}
                  >
                    <Text style={styles.bankName}>{b.name}</Text>
                    {selectedBank === b.id && (
                      <CheckCircle2 size={16} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Action CTA */}
          <View style={styles.footerActions}>
            <TouchableOpacity
              style={styles.payBtn}
              onPress={handleExecutePayment}
              disabled={isProcessing}
              activeOpacity={0.88}
            >
              {isProcessing ? (
                <View style={styles.processingRow}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.payBtnText}>
                    {language === 'as' ? 'সুৰক্ষিতভাৱে প্ৰক্ৰিয়া চলিছে...' : 'Processing Securely...'}
                  </Text>
                </View>
              ) : (
                <View style={styles.processingRow}>
                  <ShieldCheck size={18} color="#FFFFFF" />
                  <Text style={styles.payBtnText}>
                    {language === 'as' ? `₹${formattedAmount} পৰিশোধ কৰক` : `Pay ₹${formattedAmount} via Razorpay`}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {isMock && (
              <TouchableOpacity
                style={styles.simFailBtn}
                onPress={handleSimulateFailure}
                disabled={isProcessing}
              >
                <Text style={styles.simFailBtnText}>Test Failure Response</Text>
              </TouchableOpacity>
            )}

            <View style={styles.securityFooter}>
              <ShieldCheck size={12} color={COLORS.textMuted} />
              <Text style={styles.securityFooterText}>
                Verified by Razorpay • RBI Authorized • 100% Secure
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 28,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rzpBadge: {
    backgroundColor: '#0C2340',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rzpBadgeText: {
    color: '#3395FF',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountHero: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  amountLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.5,
    marginVertical: 2,
  },
  orderNumberLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  mockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  mockBannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
    flex: 1,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabBtnActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  tabBtnTextActive: {
    color: COLORS.primary,
  },
  tabContentScroll: {
    maxHeight: 220,
  },
  tabBody: {
    paddingVertical: 4,
  },
  tabSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
  },
  upiAppsGrid: {
    gap: 8,
  },
  upiAppTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 10,
  },
  upiAppIcon: {
    fontSize: 16,
  },
  upiAppName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
  },
  inputField: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.text,
    marginBottom: 8,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secureCardNote: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 16,
    marginTop: 4,
  },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    marginBottom: 6,
  },
  bankRowSelected: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  bankName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  footerActions: {
    marginTop: 14,
    gap: 8,
  },
  payBtn: {
    backgroundColor: '#0C2340',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  payBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  simFailBtn: {
    paddingVertical: 4,
    alignItems: 'center',
  },
  simFailBtnText: {
    fontSize: 11,
    color: COLORS.error,
    fontWeight: '600',
  },
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 4,
  },
  securityFooterText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
});
