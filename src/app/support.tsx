import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  Mail,
  ChevronDown,
  ChevronUp,
  Send,
  HelpCircle,
  ShieldCheck,
  Clock,
  MapPin,
} from 'lucide-react-native';
import { COLORS, SHADOWS } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { triggerHaptic } from '../lib/haptics';

interface FAQItem {
  id: string;
  q_en: string;
  q_as: string;
  a_en: string;
  a_as: string;
}

const FAQS: FAQItem[] = [
  {
    id: 'f1',
    q_en: 'How does hyperlocal delivery work in Assam?',
    q_as: 'অসমত হাইপাৰলোকেল ডেলিভাৰী কেনেকৈ কাম কৰে?',
    a_en: 'Products are sourced directly from producers within a 1–25 km radius of your location. You can choose home delivery by local riders or self-pickup from the producer/haat.',
    a_as: 'আপোনাৰ স্থানৰ পৰা ১-২৫ কিঃমিঃ ব্যাসাৰ্ধৰ ভিতৰৰ কৃষক আৰু আত্মসহায়ক গোটৰ পৰা সামগ্ৰী পোনে পোনে যোগান ধৰা হয়। আপুনি হোম ডেলিভাৰী বা নিজেই সংগ্ৰহ কৰিব পাৰে।',
  },
  {
    id: 'f2',
    q_en: 'How can SHGs and local farmers register?',
    q_as: 'আত্মসহায়ক গোট আৰু কৃষকসকলে কেনেকৈ পঞ্জীয়ন কৰিব?',
    a_en: 'Switch to "Seller Mode" in Profile, fill your SHG/business details, and upload ID or SHG registration certificate. Our local admin verifies it within 24 hours.',
    a_as: 'প্ৰফাইললৈ গৈ "বিক্ৰেতা মোড" বাছক, আপোনাৰ গোটৰ বিৱৰণ দিয়ক আৰু প্ৰমাণপত্ৰ আপলোড কৰক। ২৪ ঘণ্টাৰ ভিতৰত প্ৰমাণীকৰণ কৰা হয়।',
  },
  {
    id: 'f3',
    q_en: 'What payment methods are supported?',
    q_as: 'কোনবোৰ লেনদেন পদ্ধতি গ্ৰহণ কৰা হয়?',
    a_en: 'We support Cash on Delivery (COD) and direct UPI payments (Google Pay, PhonePe, Paytm, BHIM).',
    a_as: 'আমি কেছ অন ডেলিভাৰী (COD) আৰু পোনপটীয়া UPI পেমেণ্ট (Google Pay, PhonePe, Paytm) সমৰ্থন কৰো।',
  },
  {
    id: 'f4',
    q_en: 'Is phone number masking enabled for safety?',
    q_as: 'সুৰক্ষাৰ বাবে ফোন নম্বৰ মাস্কিং সুবিধা আছেনে?',
    a_en: 'Yes! Buyer and seller personal phone numbers remain protected. Calls are routed through privacy-protected masked channels.',
    a_as: 'হয়! ক্ৰেতা আৰু বিক্ৰেতাৰ ব্যক্তিগত ফোন নম্বৰ সুৰক্ষিত থাকে।',
  },
];

export default function SupportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();

  const [expandedFaq, setExpandedFaq] = useState<string | null>('f1');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCall = () => {
    triggerHaptic('light');
    Linking.openURL('tel:+919435012345');
  };

  const handleWhatsApp = () => {
    triggerHaptic('light');
    Linking.openURL('https://wa.me/919435012345?text=Hello%20Thaluwa%20Bazar%20Support');
  };

  const handleEmail = () => {
    triggerHaptic('light');
    Linking.openURL('mailto:support@thaluwabazar.in?subject=Help%20Request');
  };

  const handleSubmitTicket = () => {
    if (!ticketSubject || !ticketMessage) {
      Alert.alert(
        language === 'as' ? 'তথ্য দিয়ক' : 'Enter Details',
        language === 'as'
          ? 'অনুগ্ৰহ কৰি বিষয় আৰু আপোনাৰ বাৰ্তা লিখক।'
          : 'Please enter a subject and your message.'
      );
      return;
    }

    triggerHaptic('success');
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      Alert.alert(
        language === 'as' ? 'বাৰ্তা প্ৰেৰণ কৰা হ’ল' : 'Query Submitted!',
        language === 'as'
          ? 'আপোনাৰ প্ৰশ্নটো আমি লাভ কৰিলো। অতি সোনকালে আমাৰ দলে যোগাযোগ কৰিব।'
          : 'Our local Assam support team will get back to you within 2 hours.'
      );
      setTicketSubject('');
      setTicketMessage('');
    }, 600);
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
          {language === 'as' ? 'সহায়তা কেন্দ্ৰ' : 'Help & Support'}
        </Text>

        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Support Banner */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerIconCircle}>
            <HelpCircle size={30} color={COLORS.primary} />
          </View>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>
              {language === 'as' ? 'আমি আপোনাক সহায় কৰিবলৈ সাজু' : 'We are here to help!'}
            </Text>
            <Text style={styles.bannerSub}>
              {language === 'as'
                ? 'সোমবাৰৰ পৰা শনিবাৰলৈ, পুৱা ৮ বজাৰ পৰা নিশা ৮ বজালৈ'
                : 'Monday to Saturday, 8:00 AM – 8:00 PM (Assam IST)'}
            </Text>
          </View>
        </View>

        {/* Quick Contact Buttons */}
        <View style={styles.contactRow}>
          <TouchableOpacity style={styles.contactBtn} onPress={handleWhatsApp} activeOpacity={0.85}>
            <View style={[styles.contactIconBg, { backgroundColor: '#E7F8EE' }]}>
              <MessageCircle size={22} color="#25D366" />
            </View>
            <Text style={styles.contactBtnText}>WhatsApp</Text>
            <Text style={styles.contactBtnSub}>Instant Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactBtn} onPress={handleCall} activeOpacity={0.85}>
            <View style={[styles.contactIconBg, { backgroundColor: COLORS.primaryLight }]}>
              <Phone size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.contactBtnText}>Helpline</Text>
            <Text style={styles.contactBtnSub}>+91 94350-BAZAR</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactBtn} onPress={handleEmail} activeOpacity={0.85}>
            <View style={[styles.contactIconBg, { backgroundColor: COLORS.secondaryLight }]}>
              <Mail size={22} color={COLORS.secondary} />
            </View>
            <Text style={styles.contactBtnText}>Email</Text>
            <Text style={styles.contactBtnSub}>support@thaluwa</Text>
          </TouchableOpacity>
        </View>

        {/* FAQs */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            {language === 'as' ? 'সঘনাই সোধা প্ৰশ্ন (FAQs)' : 'Frequently Asked Questions'}
          </Text>

          {FAQS.map((faq) => {
            const isExpanded = expandedFaq === faq.id;
            const q = language === 'as' ? faq.q_as : faq.q_en;
            const a = language === 'as' ? faq.a_as : faq.a_en;
            return (
              <View key={faq.id} style={styles.faqCard}>
                <TouchableOpacity
                  style={styles.faqHeader}
                  onPress={() => {
                    triggerHaptic('light');
                    setExpandedFaq(isExpanded ? null : faq.id);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.faqQuestion}>{q}</Text>
                  {isExpanded ? (
                    <ChevronUp size={18} color={COLORS.primary} />
                  ) : (
                    <ChevronDown size={18} color={COLORS.textMuted} />
                  )}
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.faqAnswerContainer}>
                    <Text style={styles.faqAnswer}>{a}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Submit Ticket Form */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            {language === 'as' ? 'বাৰ্তা প্ৰেৰণ কৰক' : 'Send us a Message'}
          </Text>

          <Text style={styles.inputLabel}>{language === 'as' ? 'বিষয়' : 'Subject'}</Text>
          <TextInput
            style={styles.input}
            placeholder={language === 'as' ? 'যেনে: অৰ্ডাৰ সমস্যা / পেমেণ্ট' : 'e.g. Order query / SHG help'}
            value={ticketSubject}
            onChangeText={setTicketSubject}
          />

          <Text style={styles.inputLabel}>{language === 'as' ? 'আপোনাৰ বাৰ্তা' : 'Message'}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={
              language === 'as'
                ? 'আপোনাৰ সমস্যা বা প্ৰশ্নৰ বিৱৰণ দিয়ক...'
                : 'Describe your question or issue in detail...'
            }
            multiline
            numberOfLines={4}
            value={ticketMessage}
            onChangeText={setTicketMessage}
          />

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmitTicket}
            disabled={submitting}
            activeOpacity={0.85}
          >
            <Send size={16} color="#FFFFFF" />
            <Text style={styles.submitBtnText}>
              {submitting
                ? language === 'as'
                  ? 'প্ৰেৰণ কৰি থকা হৈছে...'
                  : 'Submitting...'
                : language === 'as'
                ? 'বাৰ্তা প্ৰেৰণ কৰক'
                : 'Send Message'}
            </Text>
          </TouchableOpacity>
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
    gap: 16,
    paddingBottom: 40,
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  bannerIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  bannerSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 10,
  },
  contactBtn: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  contactIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  contactBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  contactBtnSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 12,
  },
  faqCard: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    paddingVertical: 10,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  faqQuestion: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    marginRight: 10,
  },
  faqAnswerContainer: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  faqAnswer: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  textArea: {
    height: 85,
    textAlignVertical: 'top',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 16,
    ...SHADOWS.md,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
