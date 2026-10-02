import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Check,
  X,
  Package,
  Truck,
  Phone,
  Clock,
  CheckCircle2,
} from 'lucide-react-native';
import { COLORS, SHADOWS } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useOrders } from '../../context/OrderContext';
import { OrderStatus, Order } from '../../types';
import { triggerHaptic } from '../../lib/haptics';

export default function SellerOrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language, t } = useLanguage();
  const { sellerOrders, updateOrderStatus } = useOrders();

  const [activeTab, setActiveTab] = useState<'new' | 'accepted' | 'ready' | 'all'>('new');

  const filteredOrders = sellerOrders.filter((ord) => {
    if (activeTab === 'new') return ord.status === 'REQUESTED';
    if (activeTab === 'accepted') return ord.status === 'ACCEPTED';
    if (activeTab === 'ready') return ord.status === 'READY_FOR_PICKUP' || ord.status === 'OUT_FOR_DELIVERY';
    return true;
  });

  const handleAccept = (orderId: string) => {
    triggerHaptic('success');
    updateOrderStatus(orderId, 'ACCEPTED');
  };

  const handleMarkReady = (orderId: string) => {
    triggerHaptic('medium');
    updateOrderStatus(orderId, 'READY_FOR_PICKUP');
  };

  const handleMarkDelivered = (orderId: string) => {
    triggerHaptic('success');
    updateOrderStatus(orderId, 'COMPLETED');
  };

  const handleReject = (orderId: string) => {
    triggerHaptic('warning');
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: () => updateOrderStatus(orderId, 'CANCELLED'),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.topHeader, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            triggerHaptic('light');
            router.back();
          }}
        >
          <ArrowLeft size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {language === 'as' ? 'অৰ্ডাৰ পৰিচালনা' : 'Seller Order Fulfilment'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* State Filter Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabChip, activeTab === 'new' && styles.activeTabChip]}
          onPress={() => {
            triggerHaptic('light');
            setActiveTab('new');
          }}
        >
          <Text style={[styles.tabText, activeTab === 'new' && styles.activeTabText]}>
            {language === 'as' ? 'নতুন (New)' : 'New Orders'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabChip, activeTab === 'accepted' && styles.activeTabChip]}
          onPress={() => {
            triggerHaptic('light');
            setActiveTab('accepted');
          }}
        >
          <Text style={[styles.tabText, activeTab === 'accepted' && styles.activeTabText]}>
            {language === 'as' ? 'প্ৰস্তুত চলিছে' : 'Accepted'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabChip, activeTab === 'ready' && styles.activeTabChip]}
          onPress={() => {
            triggerHaptic('light');
            setActiveTab('ready');
          }}
        >
          <Text style={[styles.tabText, activeTab === 'ready' && styles.activeTabText]}>
            {language === 'as' ? 'সাজু / ওলাইছে' : 'Ready / Out'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabChip, activeTab === 'all' && styles.activeTabChip]}
          onPress={() => {
            triggerHaptic('light');
            setActiveTab('all');
          }}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            {language === 'as' ? 'সকলো' : 'All'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          return (
            <View style={styles.orderCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.orderNumber}>{item.order_number}</Text>
                  <Text style={styles.buyerName}>👤 {item.buyer_name}</Text>
                  <Text style={styles.buyerPhone}>📞 {item.buyer_phone}</Text>
                </View>

                <View style={styles.headerRight}>
                  <Text style={styles.orderAmount}>₹{item.total}</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>
                      {item.status.replace('_', ' ')}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Items List */}
              <View style={styles.itemsBox}>
                {item.items.map((oi) => (
                  <View key={oi.id} style={styles.itemRow}>
                    <Text style={styles.itemTitle}>
                      {oi.quantity}x {oi.title} ({oi.unit})
                    </Text>
                    <Text style={styles.itemPrice}>₹{oi.line_total}</Text>
                  </View>
                ))}
              </View>

              {/* Delivery Address */}
              <View style={styles.addressBox}>
                <Text style={styles.addressLabel}>
                  {item.pickup_or_delivery === 'delivery'
                    ? '🚚 Home Delivery to:'
                    : '🏪 Store Pickup by Buyer'}
                </Text>
                <Text style={styles.addressText}>{item.delivery_address}</Text>
              </View>

              {/* State Machine Action Controls */}
              <View style={styles.actionsContainer}>
                {item.status === 'REQUESTED' && (
                  <View style={styles.buttonPair}>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => handleReject(item.id)}
                    >
                      <X size={16} color={COLORS.error} />
                      <Text style={styles.rejectText}>Reject</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => handleAccept(item.id)}
                    >
                      <Check size={16} color="#FFFFFF" />
                      <Text style={styles.acceptText}>
                        {language === 'as' ? 'অৰ্ডাৰ গ্ৰহণ কৰক' : 'Accept Order'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {item.status === 'ACCEPTED' && (
                  <TouchableOpacity
                    style={styles.stateTransitionBtn}
                    onPress={() => handleMarkReady(item.id)}
                  >
                    <Package size={16} color="#FFFFFF" />
                    <Text style={styles.stateTransitionText}>
                      {language === 'as' ? 'পেকেট সাজু বুলি চিহ্নিত কৰক' : 'Mark Ready for Pickup / Dispatch'}
                    </Text>
                  </TouchableOpacity>
                )}

                {(item.status === 'READY_FOR_PICKUP' || item.status === 'OUT_FOR_DELIVERY') && (
                  <TouchableOpacity
                    style={styles.completeBtn}
                    onPress={() => handleMarkDelivered(item.id)}
                  >
                    <CheckCircle2 size={16} color="#FFFFFF" />
                    <Text style={styles.completeBtnText}>
                      {language === 'as' ? 'বিতৰণ সম্পূৰ্ণ নিশ্চিত কৰক' : 'Confirm Order Delivered'}
                    </Text>
                  </TouchableOpacity>
                )}

                {item.status === 'COMPLETED' && (
                  <View style={styles.completedBadge}>
                    <CheckCircle2 size={16} color={COLORS.success} />
                    <Text style={styles.completedText}>
                      {language === 'as' ? 'সফলভাৱে বিতৰণ হ’ল' : 'Order Completed & Payment Settled'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Clock size={40} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>
              {language === 'as' ? 'কোনো অৰ্ডাৰ পোৱা নগ’ল' : 'No active orders in this queue'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeTabChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  orderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  buyerName: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '600',
    marginTop: 2,
  },
  buyerPhone: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  orderAmount: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.text,
  },
  statusBadge: {
    backgroundColor: COLORS.secondaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  itemsBox: {
    backgroundColor: COLORS.background,
    padding: 10,
    borderRadius: 10,
    gap: 4,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  addressBox: {
    backgroundColor: COLORS.primaryLight,
    padding: 10,
    borderRadius: 10,
  },
  addressLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  addressText: {
    fontSize: 12,
    color: COLORS.primaryDark,
    marginTop: 2,
  },
  actionsContainer: {
    marginTop: 4,
  },
  buttonPair: {
    flexDirection: 'row',
    gap: 10,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.errorLight,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  rejectText: {
    color: COLORS.error,
    fontWeight: '700',
    fontSize: 12,
  },
  acceptBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  acceptText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  stateTransitionBtn: {
    backgroundColor: COLORS.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  stateTransitionText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  completeBtn: {
    backgroundColor: COLORS.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  completeBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.success,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
});
