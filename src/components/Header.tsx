import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Globe, Bell, Store, ShoppingBag } from 'lucide-react-native';
import { COLORS, SHADOWS } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { triggerHaptic } from '../lib/haptics';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showLanguageToggle?: boolean;
  showRoleToggle?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showLanguageToggle = true,
  showRoleToggle = true,
}) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { language, toggleLanguage } = useLanguage();
  const { role, switchRole } = useAuth();

  const handleLanguageToggle = () => {
    triggerHaptic('light');
    toggleLanguage();
  };

  const handleRoleToggle = () => {
    triggerHaptic('medium');
    if (role === 'buyer') {
      switchRole('seller');
      router.push('/seller/dashboard');
    } else {
      switchRole('buyer');
      router.push('/(tabs)/explore');
    }
  };

  return (
    <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.topRow}>
        <View style={styles.titleSection}>
          <Text style={styles.appName}>
            {language === 'as' ? 'থলুৱা বজাৰ' : 'Thaluwa Bazar'}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle}>{subtitle}</Text>
          ) : (
            <Text style={styles.locationText}>📍 Mangaldai, Darrang (Assam)</Text>
          )}
        </View>

        <View style={styles.actionsRow}>
          {showLanguageToggle && (
            <TouchableOpacity
              style={styles.langButton}
              onPress={handleLanguageToggle}
              activeOpacity={0.8}
            >
              <Globe size={15} color={COLORS.primary} />
              <Text style={styles.langText}>
                {language === 'en' ? 'অসমীয়া' : 'English'}
              </Text>
            </TouchableOpacity>
          )}

          {showRoleToggle && (
            <TouchableOpacity
              style={[
                styles.roleButton,
                role === 'seller' ? styles.sellerRoleButton : styles.buyerRoleButton,
              ]}
              onPress={handleRoleToggle}
              activeOpacity={0.8}
            >
              {role === 'buyer' ? (
                <>
                  <Store size={14} color="#FFFFFF" />
                  <Text style={styles.roleButtonText}>Sell</Text>
                </>
              ) : (
                <>
                  <ShoppingBag size={14} color="#FFFFFF" />
                  <Text style={styles.roleButtonText}>Shop</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleSection: {
    flex: 1,
  },
  appName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(19, 117, 71, 0.2)',
  },
  langText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  buyerRoleButton: {
    backgroundColor: COLORS.secondary,
  },
  sellerRoleButton: {
    backgroundColor: COLORS.primary,
  },
  roleButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
