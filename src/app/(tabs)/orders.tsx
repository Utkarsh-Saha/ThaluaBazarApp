import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { ShoppingBag, ChevronRight, PackageCheck, Clock } from 'lucide-react-native';
import { Header } from '../../components/Header';
import { OrderTrackingStepper } from '../../components/OrderTrackingStepper';
import { COLORS, SHADOWS } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useOrders } from '../../context/OrderContext';
import { Order } from '../../types';
import { triggerHaptic } from '../../lib/haptics';

export default function OrdersScreen() {
  const { language, t } = useLanguage();
  const { buyerOrders } = useOrders();
  const [activeFilter, setActiveFilter] = useState<'all' | 'ongoing' | 'completed'>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(buyerOrders[0]?.id || null);

  const filtered = buyerOrders.filter((ord) => {
    if (activeFilter === 'ongoing') return ord.status !== 'COMPLETED' && ord.status !== 'CANCELLED';
    if (activeFilter === 'completed') return ord.status === 'COMPLETED';
    return true;
  });

  const toggleExpand = (id: string) => {
    triggerHaptic('light');
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  return (
    <View style={styles.container}>
      <Header
        subtitle={
          language === 'as' ? 'মোৰ অৰ্ডাৰ আৰু সজীৱ স্থিতি' : 'Live Order Tracking & History'
        }
      />

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'all' && styles.activeFilterChip]}
          onPress={() => {
            triggerHaptic('light');
            setActiveFilter('all');
          }}
        >
          <Text
            style={[styles.filterText, activeFilter === 'all' && styles.activeFilterText]}
          >
            {language === 'as' ? 'সকলো' : 'All'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'ongoing' && styles.activeFilterChip]}
          onPress={() => {
            triggerHaptic('light');
            setActiveFilter('ongoing');
          }}
        >
          <Text
            style={[styles.filterText, activeFilter === 'ongoing' && styles.activeFilterText]}
          >
            {language === 'as' ? 'চলমান অৰ্ডাৰ' : 'Ongoing'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'completed' && styles.activeFilterChip]}
          onPress={() => {
            triggerHaptic('light');
            setActiveFilter('completed');
          }}
        >
          <Text
            style={[styles.filterText, activeFilter === 'completed' && styles.activeFilterText]}
          >
            {language === 'as' ? 'সম্পূৰ্ণ হ’ল' : 'Delivered'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isExpanded = expandedOrderId === item.id;
          return (
            <View style={styles.orderCard}>
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => toggleExpand(item.id)}
                activeOpacity={0.8}
              >
                <View>
                  <View style={styles.orderNumberRow}>
                    <Text style={styles.orderNumber}>{item.order_number}</Text>
                    <View
                      style={[
                        styles.statusTag,
                        item.status === 'COMPLETED'
                          ? styles.statusTagCompleted
                          : styles.statusTagOngoing,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusTagText,
                          item.status === 'COMPLETED'
                            ? styles.statusTextCompleted
                            : styles.statusTextOngoing,
                        ]}
                      >
                        {item.status.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.sellerName}>🌱 {item.seller_name}</Text>
                  <Text style={styles.dateText}>
                    {new Date(item.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>

                <View style={styles.headerRight}>
                  <Text style={styles.orderTotal}>₹{item.total}</Text>
                  <Text style={styles.itemCount}>
                    {item.items.length} {language === 'as' ? 'সামগ্ৰী' : 'items'}
                  </Text>
                  <ChevronRight
                    size={18}
                    color={COLORS.textSecondary}
                    style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
                  />
                </View>
              </TouchableOpacity>

              {/* Items Preview */}
              <View style={styles.itemsPreview}>
                {item.items.map((oi) => (
                  <View key={oi.id} style={styles.itemLine}>
                    <Text style={styles.itemLineTitle} numberOfLines={1}>
                      • {oi.title} ({oi.quantity} {oi.unit})
                    </Text>
                    <Text style={styles.itemLinePrice}>₹{oi.line_total}</Text>
                  </View>
                ))}
              </View>

              {/* Tracking Stepper if expanded */}
              {isExpanded && (
                <View style={styles.expandedSection}>
                  <View style={styles.divider} />
                  <Text style={styles.stepperSectionTitle}>
                    {language === 'as' ? 'অৰ্ডাৰৰ অগ্ৰগতি' : 'Order Tracking Timeline'}
                  </Text>
                  <OrderTrackingStepper currentStatus={item.status} />

                  <View style={styles.deliveryDetailsBox}>
                    <Text style={styles.deliveryDetailsTitle}>
                      {item.pickup_or_delivery === 'delivery'
                        ? language === 'as'
                          ? 'বিতৰণৰ ঠিকনা:'
                          : 'Delivery Address:'
                        : language === 'as'
                        ? 'সংগ্ৰহৰ স্থান:'
                        : 'Self Pickup Location:'}
                    </Text>
                    <Text style={styles.deliveryDetailsAddress}>
                      {item.delivery_address || 'Mangaldai Town Market'}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ShoppingBag size={42} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>
              {language === 'as' ? 'কোনো অৰ্ডাৰ পোৱা নগ’ল' : 'No orders found'}
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeFilterChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeFilterText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  orderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusTagOngoing: {
    backgroundColor: COLORS.secondaryLight,
  },
  statusTagCompleted: {
    backgroundColor: COLORS.successLight,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusTextOngoing: {
    color: COLORS.secondary,
  },
  statusTextCompleted: {
    color: COLORS.success,
  },
  sellerName: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  dateText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  itemCount: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  itemsPreview: {
    backgroundColor: COLORS.background,
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
    gap: 4,
  },
  itemLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemLineTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
    marginRight: 8,
  },
  itemLinePrice: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  expandedSection: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginBottom: 12,
  },
  stepperSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  deliveryDetailsBox: {
    backgroundColor: COLORS.primaryLight,
    padding: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  deliveryDetailsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  deliveryDetailsAddress: {
    fontSize: 12,
    color: COLORS.primaryDark,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 10,
  },
});
