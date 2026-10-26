import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Bell,
  CheckCircle,
  Truck,
  CheckCircle2,
  DollarSign,
  Sparkles,
  ShoppingBag,
  BellRing,
} from 'lucide-react-native';
import { COLORS, SHADOWS } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { triggerHaptic } from '../lib/haptics';
import { supabase } from '../lib/supabase';
import { sendLocalNotification } from '../lib/notifications';

export interface NotificationItem {
  id: string;
  type: 'order_placed' | 'seller_confirmed' | 'out_for_delivery' | 'delivered' | 'payment_received' | 'product_approved' | 'system' | 'order_update' | string;
  title_en: string;
  title_as: string;
  desc_en: string;
  desc_as: string;
  timestamp: string;
  isRead: boolean;
  orderId?: string;
  category: 'orders' | 'seller' | 'system';
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const { user } = useAuth();
  const userId = user?.id;

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'all' | 'orders' | 'seller' | 'system'>('all');

  const formatTimestamp = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return language === 'as' ? 'এইমাত্ৰ' : 'Just now';
      if (diffMins < 60) return language === 'as' ? `${diffMins} মিনিট আগতে` : `${diffMins}m ago`;
      if (diffHours < 24) return language === 'as' ? `${diffHours} ঘণ্টা আগতে` : `${diffHours}h ago`;
      if (diffDays === 1) return language === 'as' ? 'কালি' : 'Yesterday';
      return date.toLocaleDateString(language === 'as' ? 'as-IN' : 'en-IN', {
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return dateStr;
    }
  };

  const mapDbNotification = useCallback((row: any): NotificationItem => {
    let category: 'orders' | 'seller' | 'system' = 'system';
    if (
      row.type === 'order_update' ||
      row.type === 'order_placed' ||
      row.type === 'out_for_delivery' ||
      row.type === 'seller_confirmed' ||
      row.type === 'delivered'
    ) {
      category = 'orders';
    } else if (
      row.type === 'seller_status' ||
      row.type === 'payment_received' ||
      row.type === 'product_approved'
    ) {
      category = 'seller';
    }

    return {
      id: row.id.toString(),
      type: row.type || 'order_update',
      title_en: row.title_en || 'Thaluwa Bazar Alert',
      title_as: row.title_as || 'থলুৱা বজাৰ জাননী',
      desc_en: row.body_en || '',
      desc_as: row.body_as || '',
      timestamp: formatTimestamp(row.created_at),
      isRead: Boolean(row.is_read),
      orderId: row.data?.orderId,
      category,
    };
  }, [language]);

  const fetchNotifications = useCallback(async () => {
    try {
      let query = supabase.from('notifications').select('*').order('created_at', { ascending: false });

      if (userId) {
        query = query.or(`user_id.eq.${userId},user_id.eq.all,user_id.eq.system`);
      }

      const { data, error } = await query;

      if (!error && data) {
        setNotifications(data.map(mapDbNotification));
      }
    } catch (e) {
      console.warn('[NotificationsScreen] Fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, mapDbNotification]);

  useEffect(() => {
    fetchNotifications();

    // Subscribe to realtime push notification events
    const channel = supabase
      .channel('notifications_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    triggerHaptic('light');
    fetchNotifications();
  };

  const filtered = notifications.filter(
    (n) => activeTab === 'all' || n.category === activeTab
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = async () => {
    triggerHaptic('light');
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    if (user?.id) {
      try {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', user.id);
      } catch (e) {
        console.warn('Mark all read error:', e);
      }
    }
  };

  const handleNotificationPress = async (item: NotificationItem) => {
    triggerHaptic('light');

    if (!item.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );

      try {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', item.id);
      } catch (e) {
        console.warn('Mark read error:', e);
      }
    }

    if (item.orderId) {
      if (user?.role === 'seller') {
        router.push('/seller/orders');
      } else {
        router.push('/(tabs)/orders');
      }
    }
  };

  const handleSendTestNotification = async () => {
    triggerHaptic('medium');
    await sendLocalNotification(
      language === 'as' ? 'অৰ্ডাৰ নিশ্চিত কৰা হ’ল! 🌾' : 'Order Confirmed by Producer! 🌾',
      language === 'as'
        ? 'প্ৰাগজ্যোতিষপুৰ মহিলা আত্মসহায়ক গোটে আপোনাৰ অৰ্ডাৰ গ্ৰহণ কৰিলে।'
        : 'Pragjyotishpur Mahila SHG has accepted your fresh produce order. Preparing for delivery.',
      { orderId: 'demo-101', type: 'order_update' }
    );

    // Also insert record into database so it shows in the notification feed
    if (user?.id) {
      await supabase.from('notifications').insert({
        user_id: user.id,
        title_en: 'Order Confirmed by Producer! 🌾',
        title_as: 'অৰ্ডাৰ নিশ্চিত কৰা হ’ল! 🌾',
        body_en: 'Pragjyotishpur Mahila SHG has accepted your fresh produce order. Preparing for delivery.',
        body_as: 'প্ৰাগজ্যোতিষপুৰ মহিলা আত্মসহায়ক গোটে আপোনাৰ অৰ্ডাৰ গ্ৰহণ কৰিলে।',
        type: 'order_placed',
        data: { orderId: 'demo-101' },
      });
      fetchNotifications();
    }

    Alert.alert(
      language === 'as' ? 'পুশ জাননী প্ৰেৰণ কৰা হ’ল! 🔔' : 'Push Notification Sent! 🔔',
      language === 'as'
        ? 'আপোনাৰ মবাইল স্ক্ৰীণৰ ওপৰত সজীৱ ব্যানাৰ দেখা পাব।'
        : 'A test notification banner has been dispatched to your notification center.'
    );
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'out_for_delivery':
        return <Truck size={20} color={COLORS.secondary} />;
      case 'seller_confirmed':
        return <CheckCircle size={20} color={COLORS.primary} />;
      case 'delivered':
        return <CheckCircle2 size={20} color={COLORS.primary} />;
      case 'payment_received':
        return <DollarSign size={20} color={COLORS.primary} />;
      case 'product_approved':
        return <Sparkles size={20} color={COLORS.secondary} />;
      case 'order_placed':
      case 'order_update':
        return <ShoppingBag size={20} color={COLORS.primary} />;
      default:
        return <Bell size={20} color={COLORS.accent} />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'out_for_delivery':
        return COLORS.secondaryLight;
      case 'payment_received':
      case 'seller_confirmed':
      case 'delivered':
      case 'order_placed':
      case 'order_update':
        return COLORS.primaryLight;
      case 'product_approved':
        return COLORS.secondaryLight;
      default:
        return COLORS.accentLight;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {language === 'as' ? 'জাননীসমূহ' : 'Notifications'}
          </Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount} new</Text>
            </View>
          )}
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.testAlertBtn}
            onPress={handleSendTestNotification}
            activeOpacity={0.7}
          >
            <BellRing size={18} color={COLORS.primary} />
          </TouchableOpacity>

          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllAsRead} activeOpacity={0.7}>
              <Text style={styles.markReadText}>
                {language === 'as' ? 'পঢ়া হৈছে' : 'Mark read'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        {(['all', 'orders', 'seller', 'system'] as const).map((tab) => {
          const tabNames = {
            all: language === 'as' ? 'সকলো' : 'All',
            orders: language === 'as' ? 'অৰ্ডাৰ' : 'Orders',
            seller: language === 'as' ? 'বিক্ৰেতা' : 'Seller Hub',
            system: language === 'as' ? 'বাৰ্তা' : 'System News',
          };
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.filterChip, isActive && styles.activeFilterChip]}
              onPress={() => {
                triggerHaptic('light');
                setActiveTab(tab);
              }}
            >
              <Text
                style={[styles.filterChipText, isActive && styles.activeFilterChipText]}
              >
                {tabNames[tab]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Notification List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Bell size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>
                {language === 'as' ? 'কোনো জাননী নাই' : 'No notifications yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {language === 'as'
                  ? 'অৰ্ডাৰ আৰু বিতৰণৰ সকলো সজীৱ তথ্য আপুনি ইয়াত লাভ কৰিব।'
                  : 'Real-time updates about your farm orders, dispatches, and payments will appear here.'}
              </Text>
              <TouchableOpacity
                style={styles.emptyTestBtn}
                onPress={handleSendTestNotification}
                activeOpacity={0.8}
              >
                <BellRing size={16} color="#FFFFFF" />
                <Text style={styles.emptyTestBtnText}>
                  {language === 'as' ? 'পৰীক্ষামূলক জাননী প্ৰেৰণ কৰক' : 'Send Test Notification'}
                </Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const title = language === 'as' ? item.title_as : item.title_en;
            const desc = language === 'as' ? item.desc_as : item.desc_en;
            return (
              <TouchableOpacity
                style={[styles.notifCard, !item.isRead && styles.unreadNotifCard]}
                onPress={() => handleNotificationPress(item)}
                activeOpacity={0.8}
              >
                <View style={[styles.iconContainer, { backgroundColor: getIconBg(item.type) }]}>
                  {getIcon(item.type)}
                </View>

                <View style={styles.textContainer}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.notifTitle, !item.isRead && styles.unreadText]}>
                      {title}
                    </Text>
                    {!item.isRead && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.notifDesc} numberOfLines={2}>
                    {desc}
                  </Text>
                  <Text style={styles.timestamp}>{item.timestamp}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
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
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  badge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  testAlertBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
  },
  markReadText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: COLORS.surface,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeFilterChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  activeFilterChipText: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  unreadNotifCard: {
    backgroundColor: '#F7FDF9',
    borderColor: 'rgba(19, 117, 71, 0.3)',
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  unreadText: {
    fontWeight: '800',
    color: COLORS.text,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: 6,
  },
  notifDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 17,
  },
  timestamp: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 6,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
  emptyTestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 10,
  },
  emptyTestBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
