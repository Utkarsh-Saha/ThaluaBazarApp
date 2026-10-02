import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  User as UserIcon,
  Globe,
  Store,
  Shield,
  MapPin,
  HelpCircle,
  LogOut,
  ChevronRight,
  Sparkles,
  Heart,
  Bell,
  Settings as SettingsIcon,
  Crown,
} from 'lucide-react-native';
import { Header } from '../../components/Header';
import { COLORS, SHADOWS } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useListings } from '../../context/ListingsContext';
import { triggerHaptic } from '../../lib/haptics';

export default function ProfileScreen() {
  const router = useRouter();
  const { language, toggleLanguage, setLanguage, t } = useLanguage();
  const { user, role, switchRole, logout } = useAuth();
  const { wishlist } = useListings();

  const handleToggleLanguage = () => {
    triggerHaptic('light');
    toggleLanguage();
  };

  const handleLogout = async () => {
    triggerHaptic('medium');
    await logout();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <Header subtitle={language === 'as' ? 'প্ৰফাইল আৰু পছন্দসমূহ' : 'Account & Preferences'} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <UserIcon size={32} color={COLORS.primary} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Assam User'}</Text>
            <Text style={styles.userPhone}>{user?.phone || '+91 98765 43210'}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>
                {role === 'seller' ? '🌱 Producer / SHG Member' : '🛍️ Verified Buyer'}
              </Text>
            </View>
          </View>
        </View>

        {/* SECTION D: Common Features from Blueprint */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>
            {language === 'as' ? 'প্ৰধান সেৱাসমূহ' : 'Account Quick Access'}
          </Text>

          {/* Wishlist */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              triggerHaptic('light');
              router.push('/wishlist');
            }}
          >
            <View style={[styles.menuIconBox, { backgroundColor: '#FEECEC' }]}>
              <Heart size={18} color={COLORS.error} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuItemTitle}>
                {language === 'as' ? 'প্ৰিয় তালিকা (Wishlist)' : 'Wishlist & Saved Items'}
              </Text>
              <Text style={styles.menuItemSub}>
                {language === 'as'
                  ? `${wishlist.length} টা সংৰক্ষিত সামগ্ৰী`
                  : `${wishlist.length} saved local products`}
              </Text>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* Addresses */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              triggerHaptic('light');
              router.push('/addresses');
            }}
          >
            <View style={[styles.menuIconBox, { backgroundColor: COLORS.primaryLight }]}>
              <MapPin size={18} color={COLORS.primary} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuItemTitle}>
                {language === 'as' ? 'ঠিকনাসমূহ (Addresses)' : 'Delivery Addresses'}
              </Text>
              <Text style={styles.menuItemSub}>
                {language === 'as'
                  ? 'ডেলিভাৰী স্থান পৰিচালনা কৰক'
                  : 'Manage home, work & farm drop points'}
              </Text>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* Notifications */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              triggerHaptic('light');
              router.push('/notifications');
            }}
          >
            <View style={[styles.menuIconBox, { backgroundColor: COLORS.secondaryLight }]}>
              <Bell size={18} color={COLORS.secondary} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuItemTitle}>
                {language === 'as' ? 'জাননীসমূহ (Notifications)' : 'Notifications & Alerts'}
              </Text>
              <Text style={styles.menuItemSub}>
                {language === 'as'
                  ? 'অৰ্ডাৰ, সাপ্তাহিক হাট আৰু মূল্যৰ খবৰ'
                  : 'Order status, weekly haat alerts'}
              </Text>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Switch Hub Actions */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>
            {language === 'as' ? 'মুড সলনি কৰক' : 'Platform Portals'}
          </Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              triggerHaptic('medium');
              switchRole('seller');
              router.push('/seller/dashboard');
            }}
          >
            <View style={[styles.menuIconBox, { backgroundColor: COLORS.secondaryLight }]}>
              <Store size={18} color={COLORS.secondary} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuItemTitle}>
                {language === 'as' ? 'বিক্ৰেতা কেন্দ্ৰ (Seller Hub)' : 'Seller Hub (SHG & Producers)'}
              </Text>
              <Text style={styles.menuItemSub}>
                {language === 'as'
                  ? 'সামগ্ৰী যোগ কৰক, অৰ্ডাৰ পৰিচালনা কৰক'
                  : 'Manage products, incoming orders & payouts'}
              </Text>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              triggerHaptic('medium');
              router.push('/seller/subscription');
            }}
          >
            <View style={[styles.menuIconBox, { backgroundColor: '#FFF6E0' }]}>
              <Crown size={18} color={COLORS.secondary} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuItemTitle}>
                {language === 'as' ? 'বিক্ৰেতা চাবস্ক্ৰিপশ্বন' : 'Seller Subscription (Basic Plan ₹20/mo)'}
              </Text>
              <Text style={styles.menuItemSub}>
                {language === 'as'
                  ? 'প্লেন নবীকৰণ আৰু সুবিধা বৃদ্ধি'
                  : 'Renew monthly membership & unlock SHG perks'}
              </Text>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              triggerHaptic('medium');
              router.push('/admin');
            }}
          >
            <View style={[styles.menuIconBox, { backgroundColor: COLORS.accentLight }]}>
              <Shield size={18} color={COLORS.accent} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuItemTitle}>
                {language === 'as' ? 'এডমিন পেনেল (Admin Dashboard)' : 'Admin & Moderation Panel'}
              </Text>
              <Text style={styles.menuItemSub}>
                {language === 'as'
                  ? 'প্লেটফৰ্ম পৰিসংখ্যা আৰু অনুমোদন'
                  : 'Platform analytics, commission & KYC approvals'}
              </Text>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Language Selection */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>{t('changeLanguage')}</Text>

          <View style={styles.langSelectorRow}>
            <TouchableOpacity
              style={[styles.langChoice, language === 'en' && styles.activeLangChoice]}
              onPress={() => {
                triggerHaptic('light');
                setLanguage('en');
              }}
            >
              <Text style={[styles.langChoiceText, language === 'en' && styles.activeLangText]}>
                English
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.langChoice, language === 'as' && styles.activeLangChoice]}
              onPress={() => {
                triggerHaptic('light');
                setLanguage('as');
              }}
            >
              <Text style={[styles.langChoiceText, language === 'as' && styles.activeLangText]}>
                অসমীয়া (Assamese)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings & Support */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>
            {language === 'as' ? 'ছেটিংছ আৰু সহায়' : 'Settings & Support'}
          </Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              triggerHaptic('light');
              router.push('/settings');
            }}
          >
            <View style={[styles.menuIconBox, { backgroundColor: COLORS.primaryLight }]}>
              <SettingsIcon size={18} color={COLORS.primary} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuItemTitle}>
                {language === 'as' ? 'ছেটিংছ (Settings)' : 'App Settings & Preferences'}
              </Text>
              <Text style={styles.menuItemSub}>
                {language === 'as' ? 'জাননী, অফলাইন কেশ্ব আৰু নীতি' : 'Notifications, low data mode & policies'}
              </Text>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              triggerHaptic('light');
              router.push('/support');
            }}
          >
            <View style={[styles.menuIconBox, { backgroundColor: COLORS.warningLight }]}>
              <HelpCircle size={18} color={COLORS.warning} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuItemTitle}>
                {language === 'as' ? 'সহায়তা কেন্দ্ৰ (Support)' : '24x7 Local Producer Support'}
              </Text>
              <Text style={styles.menuItemSub}>
                {language === 'as' ? 'WhatsApp, ফোন আৰু প্ৰশ্নোত্তৰ' : 'WhatsApp chat, helpline & FAQs'}
              </Text>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <LogOut size={18} color={COLORS.error} />
          <Text style={styles.logoutText}>
            {language === 'as' ? 'লগআউট কৰক' : 'Log Out'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    marginLeft: 14,
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },
  userPhone: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  menuSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  menuItemStatic: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 6,
  },
  menuItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  menuItemSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  langSelectorRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  langChoice: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  activeLangChoice: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  langChoiceText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  activeLangText: {
    color: '#FFFFFF',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.errorLight,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  logoutText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '700',
  },
});
