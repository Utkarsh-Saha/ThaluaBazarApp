import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight, Store, Users, User, Building } from 'lucide-react-native';
import { COLORS, SHADOWS } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { SellerType } from '../../types';
import { triggerHaptic } from '../../lib/haptics';

export default function SellerRegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language, t } = useLanguage();
  const { registerSeller } = useAuth();

  const [businessName, setBusinessName] = useState('Pragjyotishpur Mahila SHG');
  const [sellerType, setSellerType] = useState<SellerType>('shg_member');
  const [shgCode, setShgCode] = useState('AS-DRG-SHG-2023-889');
  const [village, setVillage] = useState('Deomornoi');
  const [district, setDistrict] = useState('Darrang');
  const [upiId, setUpiId] = useState('pragjyotishpur@okaxis');

  const handleNext = async () => {
    triggerHaptic('medium');
    await registerSeller({
      business_name: businessName,
      seller_type: sellerType,
      shg_code: shgCode,
      village,
      district,
      upi_id: upiId,
    });
    router.push('/seller/documents');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: COLORS.surface }}
    >
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
        <Text style={styles.headerTitle}>{t('createSellerAccount')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepsIndicator}>
          <View style={[styles.stepDot, styles.activeStepDot]}>
            <Text style={styles.stepNum}>1</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={styles.stepDot}>
            <Text style={styles.stepNumInactive}>2</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={styles.stepDot}>
            <Text style={styles.stepNumInactive}>3</Text>
          </View>
        </View>

        <Text style={styles.formTitle}>
          {language === 'as' ? '১. ব্যৱসায়িক তথ্য' : '1. Producer & Business Details'}
        </Text>

        {/* Seller Type Selector */}
        <Text style={styles.label}>{t('sellerType')}</Text>
        <View style={styles.typeSelectorRow}>
          <TouchableOpacity
            style={[
              styles.typeChoice,
              sellerType === 'shg_member' && styles.activeTypeChoice,
            ]}
            onPress={() => {
              triggerHaptic('light');
              setSellerType('shg_member');
            }}
          >
            <Users
              size={18}
              color={sellerType === 'shg_member' ? COLORS.primary : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.typeChoiceText,
                sellerType === 'shg_member' && styles.activeTypeText,
              ]}
            >
              {t('shgMember')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeChoice,
              sellerType === 'individual' && styles.activeTypeChoice,
            ]}
            onPress={() => {
              triggerHaptic('light');
              setSellerType('individual');
            }}
          >
            <User
              size={18}
              color={sellerType === 'individual' ? COLORS.primary : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.typeChoiceText,
                sellerType === 'individual' && styles.activeTypeText,
              ]}
            >
              {t('individualSeller')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeChoice,
              sellerType === 'small_business' && styles.activeTypeChoice,
            ]}
            onPress={() => {
              triggerHaptic('light');
              setSellerType('small_business');
            }}
          >
            <Building
              size={18}
              color={sellerType === 'small_business' ? COLORS.primary : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.typeChoiceText,
                sellerType === 'small_business' && styles.activeTypeText,
              ]}
            >
              {t('smallBusiness')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Business Name */}
        <Text style={styles.label}>{t('businessName')}</Text>
        <TextInput
          style={styles.input}
          value={businessName}
          onChangeText={setBusinessName}
          placeholder="e.g. Pragjyotishpur Mahila SHG"
          placeholderTextColor={COLORS.textMuted}
        />

        {/* SHG Code (if SHG) */}
        {sellerType === 'shg_member' && (
          <>
            <Text style={styles.label}>{t('shgCode')}</Text>
            <TextInput
              style={styles.input}
              value={shgCode}
              onChangeText={setShgCode}
              placeholder="e.g. AS-DRG-SHG-2023-889"
              placeholderTextColor={COLORS.textMuted}
            />
          </>
        )}

        {/* Village & District */}
        <View style={styles.rowInputs}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{t('village')}</Text>
            <TextInput
              style={styles.input}
              value={village}
              onChangeText={setVillage}
              placeholder="Deomornoi"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{t('district')}</Text>
            <TextInput
              style={styles.input}
              value={district}
              onChangeText={setDistrict}
              placeholder="Darrang"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
        </View>

        {/* Bank / UPI Details */}
        <Text style={styles.label}>{t('upiId')}</Text>
        <TextInput
          style={styles.input}
          value={upiId}
          onChangeText={setUpiId}
          placeholder="producer@okaxis"
          placeholderTextColor={COLORS.textMuted}
        />

        {/* Next CTA */}
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.88}>
          <Text style={styles.nextBtnText}>
            {language === 'as' ? 'নথিপত্ৰ আপলোড কৰক' : 'Proceed to Documents Upload'}
          </Text>
          <ArrowRight size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
    gap: 12,
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
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 4,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  typeChoice: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  activeTypeChoice: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  typeChoiceText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  activeTypeText: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  nextBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 20,
    ...SHADOWS.sm,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
