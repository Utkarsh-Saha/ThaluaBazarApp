import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Globe,
  Bell,
  Wifi,
  Shield,
  FileText,
  Trash2,
  Info,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import { COLORS, SHADOWS } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { triggerHaptic } from '../lib/haptics';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language, setLanguage } = useLanguage();

  const [orderNotifs, setOrderNotifs] = useState(true);
  const [haatAlerts, setHaatAlerts] = useState(true);
  const [lowDataMode, setLowDataMode] = useState(false);
  const [soundHaptics, setSoundHaptics] = useState(true);

  const handleClearCache = () => {
    Alert.alert(
      language === 'as' ? 'কেশ্ব পৰিষ্কাৰ কৰিবনে?' : 'Clear App Cache?',
      language === 'as'
        ? 'ইয়াৰ দ্বাৰা অফলাইন ইমেজ আৰু পুৰণি ডেটা মচি দিয়া হ’ব।'
        : 'This will free up local storage by clearing offline image caches.',
      [
        { text: language === 'as' ? 'বাতিল' : 'Cancel', style: 'cancel' },
        {
          text: language === 'as' ? 'পৰিষ্কাৰ কৰক' : 'Clear',
          onPress: () => {
            triggerHaptic('success');
            Alert.alert(
              language === 'as' ? 'সফল হ’ল' : 'Cleared',
              language === 'as' ? 'কেশ্ব সফলতাৰে পৰিষ্কাৰ কৰা হ’ল।' : 'Local cache cleared successfully.'
            );
          },
        },
      ]
    );
  };

  const showPrivacyPolicy = () => {
    Alert.alert(
      language === 'as' ? 'গোপনীয়তা নীতি' : 'Privacy Policy',
      'Thaluwa Bazar operates under strict data privacy principles in Assam. Phone numbers are masked for direct buyer-seller interactions. GPS location is used exclusively for hyperlocal 1–25 km matching.'
    );
  };

  const showTerms = () => {
    Alert.alert(
      language === 'as' ? 'চৰ্তাৱলী আৰু নিয়ম' : 'Terms of Service',
      'Thaluwa Bazar empowers Self-Help Groups (SHGs) and local micro-producers in Assam. Listings must comply with authentic organic and local produce standards.'
    );
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
          {language === 'as' ? 'ছেটিংছ আৰু পছন্দসমূহ' : 'Settings & Preferences'}
        </Text>

        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Language Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Globe size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>
              {language === 'as' ? 'ভাষা নিৰ্বাচন' : 'App Language'}
            </Text>
          </View>

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

        {/* Notifications Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Bell size={18} color={COLORS.secondary} />
            <Text style={styles.sectionTitle}>
              {language === 'as' ? 'জাননীসমূহ' : 'Notifications'}
            </Text>
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextContainer}>
              <Text style={styles.toggleTitle}>
                {language === 'as' ? 'অৰ্ডাৰ আৰু ডেলিভাৰী জাননী' : 'Order & Delivery Alerts'}
              </Text>
              <Text style={styles.toggleSubtitle}>
                {language === 'as' ? 'লাইভ অৰ্ডাৰ স্থিতি আপডেট' : 'Real-time order confirmation & delivery updates'}
              </Text>
            </View>
            <Switch
              value={orderNotifs}
              onValueChange={(v) => {
                triggerHaptic('light');
                setOrderNotifs(v);
              }}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextContainer}>
              <Text style={styles.toggleTitle}>
                {language === 'as' ? 'সাপ্তাহিক হাট জাননী' : 'Weekly Haat Alerts'}
              </Text>
              <Text style={styles.toggleSubtitle}>
                {language === 'as' ? 'নিকটৱৰ্তী সাপ্তাহিক বজাৰৰ খবৰ' : 'Reminders before local haat market days'}
              </Text>
            </View>
            <Switch
              value={haatAlerts}
              onValueChange={(v) => {
                triggerHaptic('light');
                setHaatAlerts(v);
              }}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
            />
          </View>
        </View>

        {/* Performance & Network */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Wifi size={18} color={COLORS.accent} />
            <Text style={styles.sectionTitle}>
              {language === 'as' ? 'ইণ্টাৰনেট আৰু ডেটা' : 'Data & Performance'}
            </Text>
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextContainer}>
              <Text style={styles.toggleTitle}>
                {language === 'as' ? 'কম ডেটা মোড (Low Data)' : 'Low Data Mode'}
              </Text>
              <Text style={styles.toggleSubtitle}>
                {language === 'as'
                  ? 'গ্ৰামাঞ্চলৰ দুৰ্বল নেটৱৰ্কত ছবিৰ আকাৰ হ্ৰাস কৰে'
                  : 'Compress images for faster loading in 2G/3G areas'}
              </Text>
            </View>
            <Switch
              value={lowDataMode}
              onValueChange={(v) => {
                triggerHaptic('light');
                setLowDataMode(v);
              }}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextContainer}>
              <Text style={styles.toggleTitle}>
                {language === 'as' ? 'হেপটিক ফিডবেক (Haptics)' : 'Haptic Vibration Feedback'}
              </Text>
              <Text style={styles.toggleSubtitle}>
                {language === 'as' ? 'বুটাম আৰু কাৰ্ট স্পৰ্শত কঁপনি' : 'Tactile feedback on button presses & actions'}
              </Text>
            </View>
            <Switch
              value={soundHaptics}
              onValueChange={(v) => {
                triggerHaptic('light');
                setSoundHaptics(v);
              }}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
            />
          </View>
        </View>

        {/* Legal & About */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Shield size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>
              {language === 'as' ? 'আইনী আৰু নিয়ম' : 'Legal & Privacy'}
            </Text>
          </View>

          <TouchableOpacity style={styles.menuRow} onPress={showPrivacyPolicy} activeOpacity={0.7}>
            <View style={styles.menuRowLeft}>
              <Shield size={16} color={COLORS.textSecondary} />
              <Text style={styles.menuRowText}>
                {language === 'as' ? 'গোপনীয়তা নীতি' : 'Privacy Policy'}
              </Text>
            </View>
            <ChevronRight size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuRow} onPress={showTerms} activeOpacity={0.7}>
            <View style={styles.menuRowLeft}>
              <FileText size={16} color={COLORS.textSecondary} />
              <Text style={styles.menuRowText}>
                {language === 'as' ? 'চৰ্তাৱলী আৰু সেৱা' : 'Terms of Service'}
              </Text>
            </View>
            <ChevronRight size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuRow} onPress={handleClearCache} activeOpacity={0.7}>
            <View style={styles.menuRowLeft}>
              <Trash2 size={16} color={COLORS.error} />
              <Text style={[styles.menuRowText, { color: COLORS.error }]}>
                {language === 'as' ? 'কেশ্ব ডেটা মচক' : 'Clear Offline Cache'}
              </Text>
            </View>
            <ChevronRight size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Version Footer */}
        <View style={styles.versionFooter}>
          <View style={styles.versionBadge}>
            <Sparkles size={14} color={COLORS.primary} />
            <Text style={styles.versionBadgeText}>Thaluwa Bazar MVP v1.0.0</Text>
          </View>
          <Text style={styles.versionText}>Made with ❤️ for Assam Local Producers</Text>
        </View>
      </ScrollView>
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
    gap: 14,
    paddingBottom: 40,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  langSelectorRow: {
    flexDirection: 'row',
    gap: 10,
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  toggleTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  toggleSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 10,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuRowText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  versionFooter: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  versionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  versionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  versionText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
});
