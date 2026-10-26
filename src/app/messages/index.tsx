import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  MessageCircle,
  Mic,
  Store,
  User as UserIcon,
  ChevronRight,
  ShoppingBag,
} from 'lucide-react-native';
import { COLORS, SHADOWS } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { triggerHaptic } from '../../lib/haptics';
import { getUserConversations } from '../../lib/chat';
import { Conversation } from '../../types';

export default function MessagesInboxScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const { user } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const currentUserId = user?.id || 'guest-user';
  const userRole = (user?.role as 'buyer' | 'seller') || 'buyer';

  const fetchConversations = useCallback(async () => {
    try {
      const data = await getUserConversations(currentUserId, userRole);
      setConversations(data);
    } catch (err) {
      console.warn('[MessagesInbox] Failed to load conversations:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentUserId, userRole]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleRefresh = () => {
    triggerHaptic('light');
    setIsRefreshing(true);
    fetchConversations();
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const isSeller = item.seller_id === currentUserId;
    const partnerName = isSeller ? item.buyer_name : item.seller_name;
    const unreadCount = isSeller ? item.seller_unread_count : item.buyer_unread_count;
    const isVoiceNote = item.last_message_text?.includes('Voice Note');

    const formattedTime = new Date(item.last_message_at).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    });

    return (
      <TouchableOpacity
        style={[styles.convCard, unreadCount > 0 && styles.convCardUnread]}
        onPress={() => {
          triggerHaptic('light');
          router.push({
            pathname: `/chat/${item.id}`,
            params: {
              sellerId: item.seller_id,
              sellerName: item.seller_name,
              sellerPhone: item.seller_phone,
              buyerId: item.buyer_id,
              buyerName: item.buyer_name,
              listingId: item.listing_id,
              listingTitle: item.listing_title,
            },
          });
        }}
        activeOpacity={0.75}
      >
        <View style={styles.avatarBox}>
          {isSeller ? (
            <UserIcon size={20} color={COLORS.primary} />
          ) : (
            <Store size={20} color={COLORS.primary} />
          )}
          {unreadCount > 0 && <View style={styles.unreadDot} />}
        </View>

        <View style={styles.convDetails}>
          <View style={styles.nameRow}>
            <Text style={styles.partnerName} numberOfLines={1}>
              {partnerName}
            </Text>
            <Text style={styles.timeText}>{formattedTime}</Text>
          </View>

          {item.listing_title && (
            <View style={styles.listingTagRow}>
              <ShoppingBag size={11} color={COLORS.primaryDark} />
              <Text style={styles.listingTagText} numberOfLines={1}>
                {item.listing_title}
              </Text>
            </View>
          )}

          <View style={styles.lastMsgRow}>
            {isVoiceNote && <Mic size={13} color={COLORS.secondary} style={{ marginRight: 4 }} />}
            <Text
              style={[
                styles.lastMsgText,
                unreadCount > 0 && styles.lastMsgTextUnread,
              ]}
              numberOfLines={1}
            >
              {item.last_message_text || 'Tap to view conversation'}
            </Text>

            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </View>

        <ChevronRight size={16} color={COLORS.textMuted} style={styles.chevron} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={COLORS.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {language === 'as' ? 'বাৰ্তালাপ আৰু চাট' : 'Direct Messages'}
        </Text>

        <View style={{ width: 36 }} />
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>
            {language === 'as' ? 'বাৰ্তালাপ লোড হৈ আছে...' : 'Loading messages...'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversationItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <MessageCircle size={36} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>
                {language === 'as' ? 'কোনো বাৰ্তালাপ নাই' : 'No Messages Yet'}
              </Text>
              <Text style={styles.emptyDesc}>
                {language === 'as'
                  ? 'উৎপাদকৰ সৈতে পোনপটীয়া যোগাযোগ কৰিবলৈ যিকোনো ফচলৰ পৃষ্ঠাৰ "চাট / ভইচ নোট" বাটনত টিপক।'
                  : 'Chat directly with local SHG producers and village farmers from any product page.'}
              </Text>
              <TouchableOpacity
                style={styles.exploreBtn}
                onPress={() => router.push('/(tabs)/explore')}
                activeOpacity={0.85}
              >
                <Text style={styles.exploreBtnText}>
                  {language === 'as' ? 'ফচল চাওক' : 'Explore Fresh Produce'}
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
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
    justifyContent: 'space-between',
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
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  convCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  convCardUnread: {
    borderColor: COLORS.primaryLight,
    backgroundColor: '#FAFDFB',
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginRight: 12,
  },
  unreadDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.secondary,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  convDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  partnerName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    flex: 1,
  },
  timeText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  listingTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginVertical: 4,
  },
  listingTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primaryDark,
    maxWidth: 180,
  },
  lastMsgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  lastMsgText: {
    fontSize: 12,
    color: COLORS.textMuted,
    flex: 1,
  },
  lastMsgTextUnread: {
    color: COLORS.text,
    fontWeight: '700',
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  chevron: {
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 70,
    paddingHorizontal: 30,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
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
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    marginBottom: 24,
  },
  exploreBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    ...SHADOWS.sm,
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
