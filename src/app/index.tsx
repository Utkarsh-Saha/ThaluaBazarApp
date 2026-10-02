import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShoppingBag, Store, Globe, ArrowRight, Sparkles } from 'lucide-react-native';
import { COLORS, SHADOWS } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { triggerHaptic } from '../lib/haptics';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language, toggleLanguage, t } = useLanguage();
  const { setSelectedEntryRole, switchRole } = useAuth();

  const handleSelectRole = (role: 'buyer' | 'seller') => {
    triggerHaptic('medium');
    setSelectedEntryRole(role);
    switchRole(role);
    router.push('/(auth)/login');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
      {/* Top Header with Language Switch */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <Text style={styles.brandName}>
            {language === 'as' ? 'থলুৱা বজাৰ' : 'Thaluwa Bazar'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.langBtn}
          onPress={() => {
            triggerHaptic('light');
            toggleLanguage();
          }}
          activeOpacity={0.8}
        >
          <Globe size={14} color={COLORS.primary} />
          <Text style={styles.langText}>
            {language === 'en' ? 'অসমীয়া' : 'English'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Hero Content */}
      <View style={styles.heroSection}>
        <View style={styles.heroBadge}>
          <Sparkles size={14} color={COLORS.secondary} />
          <Text style={styles.heroBadgeText}>
            {language === 'as' ? 'অসমৰ প্ৰথম স্থানীয় বজাৰ' : "Assam's Hyperlocal Market"}
          </Text>
        </View>

        <Text style={styles.welcomeTitle}>{t('welcomeTitle')}</Text>
        <Text style={styles.welcomeSubtitle}>{t('welcomeSubtitle')}</Text>
      </View>

      {/* Two Choice Cards (BUY vs SELL) */}
      <View style={styles.cardsContainer}>
        {/* BUY CARD */}
        <TouchableOpacity
          style={[styles.roleCard, styles.buyCard]}
          onPress={() => handleSelectRole('buyer')}
          activeOpacity={0.88}
        >
          <View style={[styles.iconCircle, { backgroundColor: COLORS.primaryLight }]}>
            <ShoppingBag size={32} color={COLORS.primary} />
          </View>

          <View style={styles.roleCardContent}>
            <Text style={[styles.roleTitle, { color: COLORS.primary }]}>
              {t('buyRoleTitle')}
            </Text>
            <Text style={styles.roleSubtitle}>{t('buyRoleSubtitle')}</Text>
          </View>

          <View style={[styles.arrowButton, { backgroundColor: COLORS.primary }]}>
            <ArrowRight size={18} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* SELL CARD */}
        <TouchableOpacity
          style={[styles.roleCard, styles.sellCard]}
          onPress={() => handleSelectRole('seller')}
          activeOpacity={0.88}
        >
          <View style={[styles.iconCircle, { backgroundColor: COLORS.secondaryLight }]}>
            <Store size={32} color={COLORS.secondary} />
          </View>

          <View style={styles.roleCardContent}>
            <Text style={[styles.roleTitle, { color: COLORS.secondary }]}>
              {t('sellRoleTitle')}
            </Text>
            <Text style={styles.roleSubtitle}>{t('sellRoleSubtitle')}</Text>
          </View>

          <View style={[styles.arrowButton, { backgroundColor: COLORS.secondary }]}>
            <ArrowRight size={18} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Footer login / quick entry */}
      <View style={styles.footerSection}>
        <TouchableOpacity
          style={styles.directLoginButton}
          onPress={() => handleSelectRole('buyer')}
        >
          <Text style={styles.directLoginText}>{t('haveAccount')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandName: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(19, 117, 71, 0.2)',
  },
  langText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  heroSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.secondaryLight,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 6,
    lineHeight: 22,
  },
  cardsContainer: {
    gap: 16,
    marginVertical: 20,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    ...SHADOWS.md,
  },
  buyCard: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(19, 117, 71, 0.25)',
  },
  sellCard: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(198, 139, 23, 0.25)',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleCardContent: {
    flex: 1,
    marginLeft: 16,
    marginRight: 8,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  roleSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  arrowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerSection: {
    alignItems: 'center',
    paddingTop: 10,
  },
  directLoginButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  directLoginText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
