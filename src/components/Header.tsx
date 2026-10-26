import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Globe, Bell } from 'lucide-react-native';
import { COLORS, SHADOWS } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { triggerHaptic } from '../lib/haptics';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showLanguageToggle?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showLanguageToggle = true,
}) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { language, toggleLanguage } = useLanguage();

  const handleLanguageToggle = () => {
    triggerHaptic('light');
    toggleLanguage();
  };

  return (
    <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.topRow}>
        <View style={styles.titleSection}>
          <Text style={styles.appName}>
            {title || (language === 'as' ? 'থলুৱা বজাৰ' : 'Thaluwa Bazar')}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
          ) : (
            <Text style={styles.locationText} numberOfLines={1}>📍 Mangaldai, Darrang (Assam)</Text>
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

          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => {
              triggerHaptic('light');
              router.push('/notifications');
            }}
            activeOpacity={0.8}
          >
            <Bell size={17} color={COLORS.text} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
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
    marginRight: 12,
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
    gap: 10,
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
  notifBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.secondary,
  },
});
