import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import {
  X,
  Mic,
  Volume2,
  Sparkles,
  Search,
  CheckCircle2,
} from 'lucide-react-native';
import {
  useAudioRecorder,
  RecordingPresets,
  AudioModule,
  setAudioModeAsync,
} from 'expo-audio';
import { COLORS, SHADOWS } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { triggerHaptic } from '../lib/haptics';

interface AssameseVoiceSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectQuery: (query: string) => void;
}

export interface AssameseCommodity {
  id: string;
  nameAs: string;
  nameEn: string;
  category: string;
  keywords: string[];
}

export const POPULAR_ASSAM_COMMODITIES: AssameseCommodity[] = [
  {
    id: 'joha',
    nameAs: 'জহা চাউল',
    nameEn: 'Joha Rice',
    category: 'Rice & Grains',
    keywords: ['joha', 'saul', 'rice', 'chawal', 'জহা', 'চাউল'],
  },
  {
    id: 'nemu',
    nameAs: 'কাজি নেমু',
    nameEn: 'Kaji Nemu',
    category: 'Fruits & Citrus',
    keywords: ['nemu', 'kaji', 'lemon', 'citrus', 'নেমু', 'কাজি'],
  },
  {
    id: 'bhut',
    nameAs: 'ভোট জলকীয়া',
    nameEn: 'Bhut Jolokia',
    category: 'Spices',
    keywords: ['bhut', 'jolokia', 'chilli', 'chili', 'king chilli', 'জলকীয়া', 'ভোট'],
  },
  {
    id: 'tel',
    nameAs: 'সৰিয়হৰ তেল',
    nameEn: 'Mustard Oil',
    category: 'Oils',
    keywords: ['tel', 'soriyoho', 'mustard', 'oil', 'সৰিয়হ', 'তেল'],
  },
  {
    id: 'khorisa',
    nameAs: 'বাঁহৰ গাজ / খৰিচা',
    nameEn: 'Bamboo Shoot',
    category: 'Pickles & Forest',
    keywords: ['bamboo', 'khorisa', 'gaj', 'shoot', 'খৰিচা', 'গাজ'],
  },
  {
    id: 'muga',
    nameAs: 'মুগা আৰু এৰি কাপোৰ',
    nameEn: 'Muga & Eri Silk',
    category: 'Handloom',
    keywords: ['muga', 'eri', 'silk', 'handloom', 'chador', 'কাপোৰ', 'মুগা', 'এৰি'],
  },
  {
    id: 'maas',
    nameAs: 'খলিহনা মাছ',
    nameEn: 'Local River Fish',
    category: 'Fish',
    keywords: ['maas', 'fish', 'kholihana', 'puthi', 'rou', 'মাছ', 'খলিহনা'],
  },
  {
    id: 'pitha',
    nameAs: 'অসমীয়া পিঠা আৰু লাড়ু',
    nameEn: 'Assam Pitha & Laru',
    category: 'Traditional Snacks',
    keywords: ['pitha', 'laru', 'til pitha', 'ghila', 'পিঠা', 'লাড়ু'],
  },
  {
    id: 'koni',
    nameAs: 'গাঁৱৰ স্থানীয় কণী',
    nameEn: 'Country Chicken Eggs',
    category: 'Poultry',
    keywords: ['koni', 'egg', 'eggs', 'local egg', 'কণী'],
  },
  {
    id: 'ghee',
    nameAs: 'খাঁটি ঘিউ',
    nameEn: 'Pure Cow Ghee',
    category: 'Dairy',
    keywords: ['ghee', 'ghiu', 'ঘিউ', 'মাখন'],
  },
  {
    id: 'bora',
    nameAs: 'বৰা চাউল',
    nameEn: 'Bora Sticky Rice',
    category: 'Rice & Grains',
    keywords: ['bora', 'sticky rice', 'saul', 'বৰা', 'চাউল'],
  },
  {
    id: 'halodhi',
    nameAs: 'কেঁচা হালধি',
    nameEn: 'Organic Turmeric',
    category: 'Spices',
    keywords: ['halodhi', 'turmeric', 'curcuma', 'হালধি'],
  },
];

export const CONVERSATIONAL_PHRASES = [
  {
    textAs: 'মোক সতেজ জহা চাউল লাগে',
    textEn: 'I need fresh Joha Rice',
    query: 'Joha Rice',
  },
  {
    textAs: 'কাজি নেমু ক’ত পাম?',
    textEn: 'Where can I find Kaji Nemu?',
    query: 'Kaji Nemu',
  },
  {
    textAs: 'ভোট জলকীয়া আছেনে?',
    textEn: 'Do you have Bhut Jolokia?',
    query: 'Bhut Jolokia',
  },
  {
    textAs: 'খাঁটি সৰিয়হৰ তেল বিচাৰিছোঁ',
    textEn: 'Looking for pure mustard oil',
    query: 'Mustard Oil',
  },
  {
    textAs: 'স্থানীয় খলিহনা মাছ',
    textEn: 'Local river fish',
    query: 'Local Fish',
  },
  {
    textAs: 'বাঁহৰ খৰিচা আৰু গাজ',
    textEn: 'Bamboo shoots and Khorisa',
    query: 'Bamboo Shoot',
  },
];

// Natural Assamese speech intent matching engine
export function matchProduceFromSpeech(transcript: string): AssameseCommodity | null {
  if (!transcript || transcript.trim().length === 0) return null;
  const clean = transcript.toLowerCase().trim();

  // 1. Check keywords of known Assam commodities
  for (const item of POPULAR_ASSAM_COMMODITIES) {
    for (const kw of item.keywords) {
      if (clean.includes(kw.toLowerCase())) {
        return item;
      }
    }
  }

  // 2. Check Assamese and English names
  for (const item of POPULAR_ASSAM_COMMODITIES) {
    if (
      clean.includes(item.nameAs.toLowerCase()) ||
      clean.includes(item.nameEn.toLowerCase())
    ) {
      return item;
    }
  }

  // 3. Fallback: If user spoke something custom (e.g. "বিলাহী" / "Tomato", "আলু" / "Potato")
  if (clean.length >= 2) {
    return {
      id: `custom_${Date.now()}`,
      nameAs: transcript.trim(),
      nameEn: transcript.trim(),
      category: 'Fresh Produce',
      keywords: [clean],
    };
  }

  return null;
}

export const AssameseVoiceSearchModal: React.FC<AssameseVoiceSearchModalProps> = ({
  visible,
  onClose,
  onSelectQuery,
}) => {
  const { language } = useLanguage();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recognizedItem, setRecognizedItem] = useState<AssameseCommodity | null>(null);
  const [liveSpokenText, setLiveSpokenText] = useState<string>('');
  const [noMatchWarning, setNoMatchWarning] = useState<boolean>(false);
  const [prevVisible, setPrevVisible] = useState(visible);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recordIntervalRef = useRef<any>(null);
  const speechRecRef = useRef<any>(null);

  // Animation values for audio wave pulsation
  const [pulseAnim] = useState(() => new Animated.Value(1));
  const [waveAnim1] = useState(() => new Animated.Value(0.3));
  const [waveAnim2] = useState(() => new Animated.Value(0.6));
  const [waveAnim3] = useState(() => new Animated.Value(0.4));

  // Reset state when modal opens
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      setRecognizedItem(null);
      setLiveSpokenText('');
      setNoMatchWarning(false);
      setRecordingSeconds(0);
      setIsRecording(false);
    }
  }

  useEffect(() => {
    if (isRecording) {
      // Loop wave ripple animations
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim1, { toValue: 1, duration: 400, useNativeDriver: false }),
          Animated.timing(waveAnim1, { toValue: 0.2, duration: 400, useNativeDriver: false }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim2, { toValue: 0.9, duration: 550, useNativeDriver: false }),
          Animated.timing(waveAnim2, { toValue: 0.3, duration: 550, useNativeDriver: false }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim3, { toValue: 1, duration: 480, useNativeDriver: false }),
          Animated.timing(waveAnim3, { toValue: 0.25, duration: 480, useNativeDriver: false }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      waveAnim1.setValue(0.3);
      waveAnim2.setValue(0.6);
      waveAnim3.setValue(0.4);
    }
  }, [isRecording, pulseAnim, waveAnim1, waveAnim2, waveAnim3]);

  const startVoiceRecording = async () => {
    triggerHaptic('medium');
    setNoMatchWarning(false);
    setLiveSpokenText('');
    setRecognizedItem(null);

    // Initialize Web Speech API if in web/browser environment
    if (
      typeof window !== 'undefined' &&
      (('SpeechRecognition' in window) || ('webkitSpeechRecognition' in window))
    ) {
      try {
        const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const rec = new SpeechRec();
        rec.lang = 'as-IN';
        rec.interimResults = true;
        rec.continuous = false;
        rec.maxAlternatives = 3;

        rec.onresult = (e: any) => {
          let text = '';
          for (let i = 0; i < e.results.length; i++) {
            text += e.results[i][0].transcript;
          }
          if (text) {
            setLiveSpokenText(text);
            const match = matchProduceFromSpeech(text);
            if (match) {
              setRecognizedItem(match);
            }
          }
        };

        rec.onerror = (e: any) => {
          console.warn('[AssameseVoiceSearch] Speech Recognition error:', e?.error);
        };

        rec.start();
        speechRecRef.current = rec;
      } catch (err) {
        console.warn('[AssameseVoiceSearch] SpeechRec start failed:', err);
      }
    }

    try {
      if (Platform.OS !== 'web') {
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: true,
        });

        const status = await AudioModule.requestRecordingPermissionsAsync();
        if (!status.granted) {
          return;
        }

        await audioRecorder.record();
      }

      setIsRecording(true);
      setRecordingSeconds(0);

      recordIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 6) {
            // Auto stop after 6 seconds of speech sample
            stopVoiceRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (e) {
      console.warn('[AssameseVoiceSearch] Recording start error:', e);
      setIsRecording(true);
    }
  };

  const stopVoiceRecording = async () => {
    triggerHaptic('success');
    if (recordIntervalRef.current) {
      clearInterval(recordIntervalRef.current);
      recordIntervalRef.current = null;
    }

    if (speechRecRef.current) {
      try {
        speechRecRef.current.stop();
      } catch {}
      speechRecRef.current = null;
    }

    try {
      if (Platform.OS !== 'web') {
        await audioRecorder.stop();
      }
    } catch {}

    setIsRecording(false);

    // Accurately evaluate transcribed speech
    if (liveSpokenText && liveSpokenText.trim().length > 0) {
      const matched = matchProduceFromSpeech(liveSpokenText);
      if (matched) {
        setRecognizedItem(matched);
        setNoMatchWarning(false);
      } else {
        setNoMatchWarning(true);
      }
    } else if (!recognizedItem) {
      // Speech could not be captured clearly
      setNoMatchWarning(true);
    }
  };

  const handleApplyQuery = (query: string) => {
    triggerHaptic('success');
    onSelectQuery(query);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.sparkleBox}>
                <Sparkles size={16} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.sheetTitle}>
                  {language === 'as' ? 'অসমীয়া কণ্ঠ অনুসন্ধান' : 'Assamese Voice Search'}
                </Text>
                <Text style={styles.sheetSubtitle}>
                  {language === 'as'
                    ? 'ক’বলৈ মাইক্ৰ’ফোন টিপক (Speak in Assamese)'
                    : 'Tap microphone to speak produce name'}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
              <X size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Animated Microphone Area */}
            <View style={styles.micSection}>
              <Animated.View
                style={[
                  styles.pulseRing,
                  {
                    transform: [{ scale: pulseAnim }],
                    borderColor: isRecording ? COLORS.primary : COLORS.border,
                    backgroundColor: isRecording ? 'rgba(46, 125, 50, 0.08)' : 'transparent',
                  },
                ]}
              >
                <TouchableOpacity
                  style={[styles.micButton, isRecording && styles.micButtonActive]}
                  onPress={isRecording ? stopVoiceRecording : startVoiceRecording}
                  activeOpacity={0.85}
                >
                  {isRecording ? (
                    <Mic size={36} color="#FFFFFF" />
                  ) : (
                    <Mic size={34} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              </Animated.View>

              {/* Status / Waveform */}
              {isRecording ? (
                <View style={styles.recordingStatusBox}>
                  <View style={styles.waveformRow}>
                    <Animated.View
                      style={[
                        styles.waveBar,
                        {
                          height: waveAnim1.interpolate({
                            inputRange: [0, 1],
                            outputRange: [6, 26],
                          }),
                        },
                      ]}
                    />
                    <Animated.View
                      style={[
                        styles.waveBar,
                        {
                          height: waveAnim2.interpolate({
                            inputRange: [0, 1],
                            outputRange: [10, 32],
                          }),
                        },
                      ]}
                    />
                    <Animated.View
                      style={[
                        styles.waveBar,
                        {
                          height: waveAnim3.interpolate({
                            inputRange: [0, 1],
                            outputRange: [8, 28],
                          }),
                        },
                      ]}
                    />
                    <Animated.View
                      style={[
                        styles.waveBar,
                        {
                          height: waveAnim1.interpolate({
                            inputRange: [0, 1],
                            outputRange: [12, 30],
                          }),
                        },
                      ]}
                    />
                  </View>

                  <Text style={styles.recordingTimerText}>
                    {language === 'as' ? 'শুনি আছোঁ...' : 'Listening...'} ({recordingSeconds}s)
                  </Text>
                  <Text style={styles.recordingHintText}>
                    {language === 'as'
                      ? 'সম্পূৰ্ণ হ’লে মাইক টিপি বন্ধ কৰক'
                      : 'Tap mic again when finished'}
                  </Text>
                </View>
              ) : (
                <Text style={styles.idlePromptText}>
                  {language === 'as'
                    ? '“মোক ২ কেজি জহা চাউল লাগে” বা “কাজি নেমু” কওক'
                    : 'Tap mic and say "Joha Rice", "Kaji Nemu", or "Mustard Oil"'}
                </Text>
              )}
            </View>

            {/* Live Heard Speech Pill */}
            {isRecording && !!liveSpokenText && (
              <View style={styles.liveSpeechBox}>
                <Text style={styles.liveSpeechLabel}>
                  {language === 'as' ? 'শুনি থকা হৈছে:' : 'Hearing:'}
                </Text>
                <Text style={styles.liveSpeechText}>{`"${liveSpokenText}"`}</Text>
              </View>
            )}

            {/* Warning when speech could not be recognized */}
            {noMatchWarning && !isRecording && (
              <View style={styles.warningCard}>
                <Text style={styles.warningTitle}>
                  {language === 'as' ? 'কণ্ঠ চিনাক্ত হোৱা নাই' : 'Could not catch voice clearly'}
                </Text>
                <Text style={styles.warningSubtitle}>
                  {language === 'as'
                    ? 'অনুগ্ৰহ কৰি মাইক্ৰ’ফোনৰ ওচৰৰ পৰা কওক (যেনে: “জহা চাউল”, “কাজি নেমু”) বা তলৰ সামগ্ৰীত টিপক।'
                    : 'Please speak closer to the mic (e.g. "Joha Rice", "Kaji Nemu") or tap a produce chip below.'}
                </Text>
              </View>
            )}

            {/* Recognition Result Banner */}
            {recognizedItem && !isRecording && (
              <View style={styles.resultCard}>
                <View style={styles.resultLeft}>
                  <CheckCircle2 size={20} color={COLORS.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultTag}>
                      {language === 'as' ? 'চিনাক্ত উৎপাদিত সামগ্ৰী:' : 'Recognized Produce:'}
                    </Text>
                    <Text style={styles.resultTitle}>
                      {recognizedItem.nameAs} {recognizedItem.nameAs !== recognizedItem.nameEn ? `(${recognizedItem.nameEn})` : ''}
                    </Text>
                    <Text style={styles.resultCategory}>{recognizedItem.category}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.searchNowBtn}
                  onPress={() => handleApplyQuery(recognizedItem.nameEn || recognizedItem.nameAs)}
                  activeOpacity={0.88}
                >
                  <Search size={14} color="#FFFFFF" />
                  <Text style={styles.searchNowBtnText}>
                    {language === 'as' ? 'বিচাৰক' : 'Search'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Quick Conversational Prompts */}
            <View style={styles.sectionBox}>
              <View style={styles.sectionHeader}>
                <Volume2 size={15} color={COLORS.primary} />
                <Text style={styles.sectionHeading}>
                  {language === 'as'
                    ? 'সাধাৰণ কথিত বাক্যাংশ (Tap to Search)'
                    : 'Common Assamese Voice Phrases'}
                </Text>
              </View>

              <View style={styles.phrasesGrid}>
                {CONVERSATIONAL_PHRASES.map((phrase, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.phraseChip}
                    onPress={() => handleApplyQuery(phrase.query)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.phraseAs}>{`"${phrase.textAs}"`}</Text>
                    <Text style={styles.phraseEn}>{phrase.textEn}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Popular Assamese Produce Chips */}
            <View style={styles.sectionBox}>
              <Text style={styles.sectionHeading}>
                {language === 'as' ? 'জনপ্ৰিয় থলুৱা সামগ্ৰী' : 'Popular Local Commodities'}
              </Text>
              <View style={styles.commoditiesRow}>
                {POPULAR_ASSAM_COMMODITIES.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={styles.commodityPill}
                    onPress={() => handleApplyQuery(c.nameEn)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.commodityAs}>{c.nameAs}</Text>
                    <Text style={styles.commodityEn}>{c.nameEn}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 20,
    maxHeight: '85%',
    ...SHADOWS.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sparkleBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  sheetSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingVertical: 16,
    paddingBottom: 40,
  },
  micSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  pulseRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButton: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  micButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: '#1B5E20',
  },
  recordingStatusBox: {
    alignItems: 'center',
    marginTop: 16,
  },
  waveformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    marginBottom: 8,
  },
  waveBar: {
    width: 5,
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  recordingTimerText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  recordingHintText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 3,
  },
  idlePromptText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  liveSpeechBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'center',
    marginTop: -8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveSpeechLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  liveSpeechText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  warningCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  warningTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  warningSubtitle: {
    fontSize: 11,
    color: '#92400E',
    textAlign: 'center',
    marginTop: 3,
    lineHeight: 16,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  resultLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  resultTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
    textTransform: 'uppercase',
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#047857',
    marginTop: 2,
  },
  resultCategory: {
    fontSize: 11,
    color: '#059669',
    marginTop: 1,
  },
  searchNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  searchNowBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionBox: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
  },
  phrasesGrid: {
    gap: 8,
  },
  phraseChip: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  phraseAs: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  phraseEn: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  commoditiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  commodityPill: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  commodityAs: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  commodityEn: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
});
