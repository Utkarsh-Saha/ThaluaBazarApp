import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Upload,
  CheckCircle,
  FileText,
  Building2,
  ShieldCheck,
  CreditCard,
} from 'lucide-react-native';
import { COLORS, SHADOWS } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { triggerHaptic } from '../../lib/haptics';

export default function SellerDocumentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language, t } = useLanguage();
  const { uploadSellerDocuments } = useAuth();

  const [idUploaded, setIdUploaded] = useState(true);
  const [addressUploaded, setAddressUploaded] = useState(true);
  const [shgCertUploaded, setShgCertUploaded] = useState(true);
  const [bankUploaded, setBankUploaded] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    triggerHaptic('success');
    setIsSubmitting(true);
    await uploadSellerDocuments({
      id_proof_url: 'mock-id-proof.pdf',
      address_proof_url: 'mock-address.pdf',
      shg_cert_url: 'mock-shg-cert.pdf',
      bank_proof_url: 'mock-passbook.pdf',
    });
    setIsSubmitting(false);
    router.replace('/seller/verification');
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <View style={[styles.topHeader, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            triggerHaptic('light');
            router.back();
          }}
        >
          <ArrowLeft size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('uploadDocuments')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepsIndicator}>
          <View style={[styles.stepDot, styles.completedStepDot]}>
            <CheckCircle size={14} color="#FFFFFF" />
          </View>
          <View style={[styles.stepLine, styles.completedStepLine]} />
          <View style={[styles.stepDot, styles.activeStepDot]}>
            <Text style={styles.stepNum}>2</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={styles.stepDot}>
            <Text style={styles.stepNumInactive}>3</Text>
          </View>
        </View>

        <Text style={styles.formTitle}>
          {language === 'as' ? '২. নথিপত্ৰ পৰীক্ষণ' : '2. Compliance & Verification Uploads'}
        </Text>
        <Text style={styles.formSubtitle}>
          {language === 'as'
            ? 'প্ৰমাণিত বিক্ৰেতা বেজ লাভ কৰিবলৈ চৰকাৰী নথিপত্ৰ আপলোড কৰক'
            : 'Upload valid KYC and SHG documents for verified producer badge.'}
        </Text>

        {/* Document 1: ID Proof */}
        <View style={styles.docCard}>
          <View style={styles.docLeft}>
            <View style={styles.docIconBox}>
              <ShieldCheck size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.docName}>{t('idProof')}</Text>
              <Text style={styles.docHint}>Aadhaar Card, Voter ID, or PAN</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.uploadBtn, idUploaded && styles.uploadedBtn]}
            onPress={() => {
              triggerHaptic('light');
              setIdUploaded(!idUploaded);
            }}
          >
            {idUploaded ? (
              <Text style={styles.uploadedText}>{t('uploaded')}</Text>
            ) : (
              <>
                <Upload size={14} color={COLORS.primary} />
                <Text style={styles.uploadText}>{t('upload')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Document 2: Address Proof */}
        <View style={styles.docCard}>
          <View style={styles.docLeft}>
            <View style={styles.docIconBox}>
              <FileText size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.docName}>{t('addressProof')}</Text>
              <Text style={styles.docHint}>Electricity Bill, PRC, or Gaonburah Certificate</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.uploadBtn, addressUploaded && styles.uploadedBtn]}
            onPress={() => {
              triggerHaptic('light');
              setAddressUploaded(!addressUploaded);
            }}
          >
            {addressUploaded ? (
              <Text style={styles.uploadedText}>{t('uploaded')}</Text>
            ) : (
              <>
                <Upload size={14} color={COLORS.primary} />
                <Text style={styles.uploadText}>{t('upload')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Document 3: SHG Certificate */}
        <View style={styles.docCard}>
          <View style={styles.docLeft}>
            <View style={styles.docIconBox}>
              <Building2 size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.docName}>{t('shgCert')}</Text>
              <Text style={styles.docHint}>NRLM / ASRLM Certificate or Registration</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.uploadBtn, shgCertUploaded && styles.uploadedBtn]}
            onPress={() => {
              triggerHaptic('light');
              setShgCertUploaded(!shgCertUploaded);
            }}
          >
            {shgCertUploaded ? (
              <Text style={styles.uploadedText}>{t('uploaded')}</Text>
            ) : (
              <>
                <Upload size={14} color={COLORS.primary} />
                <Text style={styles.uploadText}>{t('upload')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Document 4: Bank Proof */}
        <View style={styles.docCard}>
          <View style={styles.docLeft}>
            <View style={styles.docIconBox}>
              <CreditCard size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.docName}>{t('bankProof')}</Text>
              <Text style={styles.docHint}>Bank Passbook Front Page or Cancelled Cheque</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.uploadBtn, bankUploaded && styles.uploadedBtn]}
            onPress={() => {
              triggerHaptic('light');
              setBankUploaded(!bankUploaded);
            }}
          >
            {bankUploaded ? (
              <Text style={styles.uploadedText}>{t('uploaded')}</Text>
            ) : (
              <>
                <Upload size={14} color={COLORS.primary} />
                <Text style={styles.uploadText}>{t('upload')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Submit for Verification */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.88}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>{t('submitForVerification')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  content: {
    padding: 20,
    gap: 14,
  },
  stepsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedStepDot: {
    backgroundColor: COLORS.success,
  },
  activeStepDot: {
    backgroundColor: COLORS.primary,
  },
  stepNum: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  stepNumInactive: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
  },
  completedStepLine: {
    backgroundColor: COLORS.success,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  formSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  docLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  docIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  docName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  docHint: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(19, 117, 71, 0.2)',
  },
  uploadedBtn: {
    backgroundColor: COLORS.successLight,
    borderColor: COLORS.success,
  },
  uploadText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  uploadedText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.success,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 20,
    ...SHADOWS.sm,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
