import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Send,
  Mic,
  Trash2,
  Phone,
  MessageCircle,
  ShoppingBag,
  ExternalLink,
  Store,
  User as UserIcon,
} from 'lucide-react-native';
import {
  useAudioRecorder,
  RecordingPresets,
  AudioModule,
  setAudioModeAsync,
  useAudioRecorderState,
} from 'expo-audio';
import { COLORS, SHADOWS } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { triggerHaptic } from '../../lib/haptics';
import {
  getOrCreateConversation,
  getConversationMessages,
  sendMessage,
  markConversationAsRead,
  subscribeToConversation,
  openWhatsAppChat,
  QUICK_INQUIRY_PROMPTS,
} from '../../lib/chat';
import { ChatMessage, Conversation } from '../../types';
import { AudioVoicePlayer } from '../../components/AudioVoicePlayer';

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    id: string;
    buyerId?: string;
    buyerName?: string;
    sellerId?: string;
    sellerName?: string;
    sellerPhone?: string;
    listingId?: string;
    listingTitle?: string;
  }>();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);

  const flatListRef = useRef<FlatList>(null);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Audio recording setup
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const isRecording = recorderState.isRecording;

  const currentUserId = user?.id || 'guest-user';
  const isSeller = conversation ? conversation.seller_id === currentUserId : false;
  const partnerName = conversation
    ? isSeller
      ? conversation.buyer_name
      : conversation.seller_name
    : params.sellerName || params.buyerName || 'Producer';
  const partnerPhone = conversation?.seller_phone || params.sellerPhone;

  // Initialize or load conversation
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function init() {
      setIsLoading(true);
      try {
        let activeConv: Conversation;

        if (params.id && !params.id.startsWith('new') && !params.id.startsWith('temp')) {
          activeConv = await getOrCreateConversation({
            buyerId: params.buyerId || currentUserId,
            buyerName: params.buyerName || user?.name || 'Customer',
            sellerId: params.sellerId || '',
            sellerName: params.sellerName || 'Producer',
            sellerPhone: params.sellerPhone,
            listingId: params.listingId,
            listingTitle: params.listingTitle,
          });
        } else {
          activeConv = await getOrCreateConversation({
            buyerId: currentUserId,
            buyerName: user?.name || 'Customer',
            sellerId: params.sellerId || '',
            sellerName: params.sellerName || 'Producer',
            sellerPhone: params.sellerPhone,
            listingId: params.listingId,
            listingTitle: params.listingTitle,
          });
        }

        setConversation(activeConv);

        // Fetch messages
        const msgs = await getConversationMessages(activeConv.id);
        setMessages(msgs);

        // Mark as read
        const role = activeConv.seller_id === currentUserId ? 'seller' : 'buyer';
        await markConversationAsRead(activeConv.id, role, currentUserId);

        // Subscribe to real-time incoming messages
        unsubscribe = subscribeToConversation(activeConv.id, (newMsg) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          flatListRef.current?.scrollToEnd({ animated: true });
        });
      } catch (err) {
        console.warn('[Chat] Failed to load conversation:', err);
      } finally {
        setIsLoading(false);
      }
    }

    init();

    return () => {
      unsubscribe?.();
    };
  }, [params.id, params.sellerId, params.buyerId, currentUserId, user?.name]);

  // Clean up recording timer on unmount
  useEffect(() => {
    return () => {
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
      }
    };
  }, []);

  // Handle Text Send
  const handleSendText = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !conversation || isSending) return;

    triggerHaptic('medium');
    setIsSending(true);
    setInputText('');

    const senderRole = conversation.seller_id === currentUserId ? 'seller' : 'buyer';
    const recipientId =
      senderRole === 'buyer' ? conversation.seller_id : conversation.buyer_id;

    try {
      const sent = await sendMessage({
        conversationId: conversation.id,
        senderId: currentUserId,
        senderName: user?.name || (senderRole === 'buyer' ? 'Customer' : 'Producer'),
        senderRole,
        recipientId,
        messageType: 'text',
        text,
        metadata: conversation.listing_id
          ? {
              listing_id: conversation.listing_id,
              listing_title: conversation.listing_title,
            }
          : undefined,
      });

      setMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev;
        return [...prev, sent];
      });

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      console.warn('[Chat] Error sending message:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Start Audio Recording
  const handleStartRecording = async () => {
    try {
      triggerHaptic('heavy');
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          language === 'as' ? 'অনুমতি প্ৰয়োজন' : 'Permission Required',
          language === 'as'
            ? 'ভইচ নোট ৰেকৰ্ড কৰিবলৈ মাইক্ৰ’ফোনৰ অনুমতি প্ৰয়োজন।'
            : 'Microphone permission is required to record voice notes.'
        );
        return;
      }

      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setRecordDuration(0);

      // Start duration countdown (max 30s)
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      recordTimerRef.current = setInterval(() => {
        setRecordDuration((prev) => {
          if (prev >= 29) {
            handleStopAndSendRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.warn('[Chat] Failed to start audio recording:', err);
    }
  };

  // Cancel Audio Recording
  const handleCancelRecording = async () => {
    triggerHaptic('medium');
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    try {
      await audioRecorder.stop();
    } catch {}
    setRecordDuration(0);
  };

  // Stop & Send Audio Recording
  const handleStopAndSendRecording = async () => {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    triggerHaptic('success');

    const duration = recordDuration;
    setRecordDuration(0);

    try {
      await audioRecorder.stop();
      const recordedUri = audioRecorder.uri;

      if (!recordedUri || !conversation) return;

      const senderRole = conversation.seller_id === currentUserId ? 'seller' : 'buyer';
      const recipientId =
        senderRole === 'buyer' ? conversation.seller_id : conversation.buyer_id;

      const sent = await sendMessage({
        conversationId: conversation.id,
        senderId: currentUserId,
        senderName: user?.name || (senderRole === 'buyer' ? 'Customer' : 'Producer'),
        senderRole,
        recipientId,
        messageType: 'audio',
        audioUrl: recordedUri,
        audioDurationSeconds: Math.max(1, duration),
        metadata: conversation.listing_id
          ? {
              listing_id: conversation.listing_id,
              listing_title: conversation.listing_title,
            }
          : undefined,
      });

      setMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev;
        return [...prev, sent];
      });

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      console.warn('[Chat] Failed to send audio recording:', err);
    }
  };

  // Open WhatsApp
  const handleOpenWhatsApp = () => {
    if (!partnerPhone) {
      Alert.alert('Phone number unavailable', 'Producer has not listed a phone number.');
      return;
    }
    triggerHaptic('light');
    openWhatsAppChat({
      phone: partnerPhone,
      producerName: partnerName,
      buyerName: user?.name || 'Customer',
      listingTitle: conversation?.listing_title,
      language,
    });
  };

  // Dial Phone
  const handlePhoneCall = () => {
    if (!partnerPhone) return;
    triggerHaptic('light');
    Linking.openURL(`tel:${partnerPhone.replace(/\s+/g, '')}`).catch(() => {
      Alert.alert('Call unavailable', `Phone: ${partnerPhone}`);
    });
  };

  const renderMessageItem = useCallback(
    ({ item }: { item: ChatMessage }) => {
      const isMe = item.sender_id === currentUserId;
      const timeStr = new Date(item.created_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      return (
        <View
          style={[
            styles.messageRow,
            isMe ? styles.messageRowMe : styles.messageRowOther,
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              isMe ? styles.messageBubbleMe : styles.messageBubbleOther,
            ]}
          >
            {/* Sender Label in Group/SHG Context */}
            {!isMe && (
              <Text style={styles.senderNameLabel}>{item.sender_name}</Text>
            )}

            {/* Produce Inquiry Banner */}
            {item.metadata?.listing_title && (
              <TouchableOpacity
                style={[
                  styles.produceContextPill,
                  isMe ? styles.produceContextPillMe : styles.produceContextPillOther,
                ]}
                onPress={() => {
                  if (item.metadata?.listing_id) {
                    router.push(`/product/${item.metadata.listing_id}`);
                  }
                }}
                activeOpacity={0.8}
              >
                <ShoppingBag size={12} color={isMe ? '#FFFFFF' : COLORS.primary} />
                <Text
                  style={[
                    styles.produceContextText,
                    isMe ? { color: '#FFFFFF' } : { color: COLORS.primaryDark },
                  ]}
                  numberOfLines={1}
                >
                  {item.metadata.listing_title}
                </Text>
                <ExternalLink size={10} color={isMe ? '#FFFFFF' : COLORS.primary} />
              </TouchableOpacity>
            )}

            {/* Message Body: Audio or Text */}
            {item.message_type === 'audio' && item.audio_url ? (
              <AudioVoicePlayer
                audioUri={item.audio_url}
                durationSeconds={item.audio_duration_seconds}
                isSender={isMe}
              />
            ) : (
              <Text
                style={[
                  styles.messageText,
                  isMe ? styles.messageTextMe : styles.messageTextOther,
                ]}
              >
                {item.text}
              </Text>
            )}

            {/* Timestamp & Read Check */}
            <View style={styles.timestampRow}>
              <Text
                style={[
                  styles.timestampText,
                  isMe ? styles.timestampTextMe : styles.timestampTextOther,
                ]}
              >
                {timeStr}
              </Text>
              {isMe && (
                <Text style={styles.readCheckText}>
                  {item.is_read ? '✓✓' : '✓'}
                </Text>
              )}
            </View>
          </View>
        </View>
      );
    },
    [currentUserId, router]
  );

  return (
    <View style={styles.screen}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.headerPartnerInfo}>
          <View style={styles.partnerAvatar}>
            {isSeller ? (
              <UserIcon size={16} color={COLORS.primary} />
            ) : (
              <Store size={16} color={COLORS.primary} />
            )}
          </View>
          <View style={styles.partnerTextCol}>
            <Text style={styles.partnerNameText} numberOfLines={1}>
              {partnerName}
            </Text>
            <Text style={styles.partnerStatusText}>
              {conversation?.listing_title
                ? `🌾 ${conversation.listing_title}`
                : language === 'as'
                ? 'থলুৱা বজাৰ সক্ৰিয়'
                : 'Thaluwa Bazar Direct'}
            </Text>
          </View>
        </View>

        {/* WhatsApp & Call Actions */}
        <View style={styles.headerActions}>
          {partnerPhone && (
            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={handleOpenWhatsApp}
              activeOpacity={0.8}
            >
              <MessageCircle size={18} color="#25D366" />
            </TouchableOpacity>
          )}

          {partnerPhone && (
            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={handlePhoneCall}
              activeOpacity={0.8}
            >
              <Phone size={17} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Content */}
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {isLoading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>
              {language === 'as' ? 'মেছেজ লোড হৈ আছে...' : 'Loading messages...'}
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.messagesListContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <MessageCircle size={32} color={COLORS.primary} />
                </View>
                <Text style={styles.emptyTitle}>
                  {language === 'as'
                    ? 'বাৰ্তালাপ আৰম্ভ কৰক'
                    : 'Start the Conversation'}
                </Text>
                <Text style={styles.emptyDesc}>
                  {language === 'as'
                    ? 'ফচলৰ সতেজতা, মূল্য আৰু ডেলিভাৰীৰ বিষয়ে উৎপাদকক পোনপটীয়া মেছেজ বা ভইচ নোট পঠিয়াওক।'
                    : 'Ask the producer about crop harvest, freshness, bulk orders, or send a quick voice note.'}
                </Text>
              </View>
            }
          />
        )}

        {/* Quick Inquiry Prompts Chips Strip */}
        <View style={styles.quickPromptsStrip}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickPromptsContent}
          >
            {QUICK_INQUIRY_PROMPTS.map((prompt) => (
              <TouchableOpacity
                key={prompt.id}
                style={styles.promptChip}
                onPress={() => handleSendText(language === 'as' ? prompt.as : prompt.en)}
                activeOpacity={0.8}
              >
                <Text style={styles.promptChipText}>
                  {language === 'as' ? prompt.as : prompt.en}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Bottom Input / Audio Bar */}
        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {isRecording ? (
            /* Active Voice Recording UI */
            <View style={styles.recordingRow}>
              <TouchableOpacity
                style={styles.recordingCancelBtn}
                onPress={handleCancelRecording}
                activeOpacity={0.8}
              >
                <Trash2 size={18} color={COLORS.error} />
              </TouchableOpacity>

              <View style={styles.recordingTimerContainer}>
                <View style={styles.pulsingRedDot} />
                <Text style={styles.recordingTimeText}>
                  {`00:${recordDuration.toString().padStart(2, '0')} / 00:30`}
                </Text>
                <Text style={styles.recordingHintText}>
                  {language === 'as' ? 'ৰেকৰ্ডিং হৈ আছে...' : 'Recording voice note...'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.recordingSendBtn}
                onPress={handleStopAndSendRecording}
                activeOpacity={0.8}
              >
                <Send size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            /* Standard Text & Mic Input UI */
            <View style={styles.textInputRow}>
              <TextInput
                style={styles.textInput}
                placeholder={
                  language === 'as'
                    ? 'মেছেজ লিখক... (বা ভইচ বাটন টিপক)'
                    : 'Type a message... (or tap mic)'
                }
                placeholderTextColor={COLORS.textMuted}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={600}
              />

              {inputText.trim().length > 0 ? (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.sendBtn]}
                  onPress={() => handleSendText()}
                  disabled={isSending}
                  activeOpacity={0.8}
                >
                  {isSending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Send size={18} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.micBtn]}
                  onPress={handleStartRecording}
                  activeOpacity={0.8}
                >
                  <Mic size={20} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAF9',
  },
  header: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    marginRight: 10,
  },
  headerPartnerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  partnerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerTextCol: {
    flex: 1,
  },
  partnerNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  partnerStatusText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyboardContainer: {
    flex: 1,
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  messagesListContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  messageRow: {
    flexDirection: 'row',
    width: '100%',
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '82%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...SHADOWS.sm,
  },
  messageBubbleMe: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  senderNameLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  produceContextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 6,
  },
  produceContextPillMe: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  produceContextPillOther: {
    backgroundColor: COLORS.primaryLight,
  },
  produceContextText: {
    fontSize: 11,
    fontWeight: '700',
    flexShrink: 1,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextMe: {
    color: '#FFFFFF',
  },
  messageTextOther: {
    color: COLORS.text,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  timestampText: {
    fontSize: 10,
  },
  timestampTextMe: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  timestampTextOther: {
    color: COLORS.textMuted,
  },
  readCheckText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  quickPromptsStrip: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingVertical: 8,
  },
  quickPromptsContent: {
    paddingHorizontal: 14,
    gap: 8,
  },
  promptChip: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  promptChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  inputBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  textInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
  },
  sendBtn: {
    backgroundColor: COLORS.primary,
  },
  micBtn: {
    backgroundColor: COLORS.secondary,
  },
  recordingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  recordingCancelBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingTimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulsingRedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.error,
  },
  recordingTimeText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.error,
  },
  recordingHintText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  recordingSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
