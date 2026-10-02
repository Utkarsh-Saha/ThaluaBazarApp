import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Bell,
  Package,
  CheckCircle,
  Truck,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  Sparkles,
  ShoppingBag,
} from 'lucide-react-native';
import { COLORS, SHADOWS } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { triggerHaptic } from '../lib/haptics';

interface NotificationItem {
  id: string;
  type: 'order_placed' | 'seller_confirmed' | 'out_for_delivery' | 'delivered' | 'payment_received' | 'product_approved' | 'system';
  title_en: string;
  title_as: string;
  desc_en: string;
  desc_as: string;
  timestamp: string;
  isRead: boolean;
  orderId?: string;
  category: 'orders' | 'seller' | 'system';
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    type: 'out_for_delivery',
    title_en: 'Out for Delivery 🚚',
    title_as: 'ডেলিভাৰীৰ বাবে ওলাইছে 🚚',
    desc_en: 'Your order #TB-8842 from Pragjyotishpur Mahila SHG is on the way.',
    desc_as: 'প্ৰাগজ্যোতিষপুৰ মহিলা আত্মসহায়ক গোটৰ পৰা আপোনাৰ অৰ্ডাৰ #TB-8842 আহি আছে।',
    timestamp: '10 mins ago',
    isRead: false,
    orderId: 'ord-01',
    category: 'orders',
  },
  {
    id: 'n2',
    type: 'payment_received',
    title_en: 'Payment Received ₹1,880 💰',
    title_as: 'ধনাগমন সম্পূৰ্ণ ₹১,৮৮০ 💰',
    desc_en: 'Payment of ₹1,880 credited for Order #TB-8840 via UPI.',
    desc_as: 'UPI ৰ জৰিয়তে অৰ্ডাৰ #TB-8840 ৰ বাবে ₹১,৮৮০ জমা হৈছে।',
    timestamp: '2 hours ago',
    isRead: false,
    orderId: 'ord-02',
    category: 'seller',
  },
  {
    id: 'n3',
    type: 'seller_confirmed',
    title_en: 'Seller Confirmed Order ✅',
    title_as: 'বিক্ৰেতাই অৰ্ডাৰ নিশ্চিত কৰিলে ✅',
    desc_en: 'Village Green Farms has accepted your order #TB-8842.',
    desc_as: 'ভিলেজ গ্ৰীন ফাৰ্মছে আপোনাৰ অৰ্ডাৰ #TB-8842 গ্ৰহণ কৰিছে।',
    timestamp: '4 hours ago',
    isRead: true,
    orderId: 'ord-01',
    category: 'orders',
  },
  {
    id: 'n4',
    type: 'product_approved',
    title_en: 'Product Approved by Moderator 🌟',
    title_as: 'সামগ্ৰী অনুমোদন কৰা হ’ল 🌟',
    desc_en: 'Your listing "Kola Joha Rice (1kg)" is now live in the hyperlocal catalog.',
    desc_as: 'আপোনাৰ "ক’লা জোহা চাউল (১ কেজি)" তালিকাখন বজাৰত লাইভ কৰা হৈছে।',
    timestamp: '1 day ago',
    isRead: true,
    category: 'seller',
  },
  {
    id: 'n5',
    type: 'order_placed',
    title_en: 'Order Placed Successfully 🛍️',
    title_as: 'অৰ্ডাৰ সফলতাৰে প্ৰেৰণ কৰা হ’ল 🛍️',
    desc_en: 'We have received your order #TB-8842. Seller is preparing the fresh items.',
    desc_as: 'আমি আপোনাৰ অৰ্ডাৰ লাভ কৰিছো। বিক্ৰেতাই সামগ্ৰী প্ৰস্তুত কৰিছে।',
    timestamp: 'Yesterday',
    isRead: true,
    orderId: 'ord-01',
    category: 'orders',
  },
  {
    id: 'n6',
    type: 'system',
    title_en: 'Deomornoi Weekly Haat Tomorrow! 🛖',
    title_as: 'কাইলৈ দেওমৰনৈ সাপ্তাহিক হাট! 🛖',
    desc_en: 'Over 40+ local SHG stalls open tomorrow from 7:00 AM to 5:00 PM.',
    desc_as: 'কাইলৈ পুৱা ৭ বজাৰ পৰা ৪০+ আত্মসহায়ক গোটৰ বিপনী উপলব্ধ হ’ব।',
    timestamp: '2 days ago',
    isRead: true,
    category: 'system',
  },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState<'all' | 'orders' | 'seller' | 'system'>('all');

  const filtered = notifications.filter(
    (n) => activeTab === 'all' || n.category === activeTab
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = () => {
    triggerHaptic('light');
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleNotificationPress = (item: NotificationItem) => {
    triggerHaptic('light');
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
    );
    if (item.orderId) {
      router.push('/(tabs)/orders');
    }
  };

  const getIcon = (type: NotificationItem['type']) => {
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
        return <ShoppingBag size={20} color={COLORS.primary} />;
      default:
        return <Bell size={20} color={COLORS.accent} />;
    }
  };

  const getIconBg = (type: NotificationItem['type']) => {
    switch (type) {
      case 'out_for_delivery':
        return COLORS.secondaryLight;
      case 'payment_received':
      case 'seller_confirmed':
      case 'delivered':
      case 'order_placed':
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

        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllAsRead} activeOpacity={0.7}>
            <Text style={styles.markReadText}>
              {language === 'as' ? 'পঢ়া হৈছে' : 'Mark read'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        {(['all', 'orders', 'seller', 'system'] as const).map((tab) => {
          const tabNames = {
            all: language === 'as' ? 'সকলো' : 'All',
            orders: language === 'as' ? 'অৰ্ডাৰ' : 'Orders',
            seller: language === 'as' ? 'বিক্ৰেতা' : 'Seller Hub',
            system: language === 'as' ? 'হাট & বাৰ্তা' : 'Haat News',
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
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Bell size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>
              {language === 'as' ? 'কোনো জাননী নাই' : 'No notifications yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {language === 'as'
                ? 'অৰ্ডাৰ আৰু ডেলিভাৰীৰ সকলো তথ্য ইয়াত দেখা যাব'
                : 'Updates about your orders and local markets will appear here'}
            </Text>
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
    maxWidth: 260,
  },
});
