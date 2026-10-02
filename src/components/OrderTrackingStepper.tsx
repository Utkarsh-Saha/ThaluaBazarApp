import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle2, Clock, Package, Truck, Check } from 'lucide-react-native';
import { OrderStatus } from '../types';
import { COLORS } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';

interface OrderTrackingStepperProps {
  currentStatus: OrderStatus;
}

interface StepItem {
  key: OrderStatus;
  labelEn: string;
  labelAs: string;
  icon: any;
}

const STEPS: StepItem[] = [
  {
    key: 'REQUESTED',
    labelEn: 'Order Placed',
    labelAs: 'অৰ্ডাৰ পালোঁ',
    icon: Clock,
  },
  {
    key: 'ACCEPTED',
    labelEn: 'Seller Confirmed',
    labelAs: 'বিক্ৰেতাই গ্ৰহণ কৰিলে',
    icon: CheckCircle2,
  },
  {
    key: 'READY_FOR_PICKUP',
    labelEn: 'Preparing',
    labelAs: 'পেকেট সাজু',
    icon: Package,
  },
  {
    key: 'OUT_FOR_DELIVERY',
    labelEn: 'Out for Delivery',
    labelAs: 'বিতৰণৰ বাবে ওলাল',
    icon: Truck,
  },
  {
    key: 'COMPLETED',
    labelEn: 'Delivered',
    labelAs: 'বিতৰণ সম্পূৰ্ণ',
    icon: Check,
  },
];

const STATUS_PROGRESSION: Record<OrderStatus, number> = {
  REQUESTED: 0,
  ACCEPTED: 1,
  READY_FOR_PICKUP: 2,
  OUT_FOR_DELIVERY: 3,
  COMPLETED: 4,
  CANCELLED: -1,
};

export const OrderTrackingStepper: React.FC<OrderTrackingStepperProps> = ({ currentStatus }) => {
  const { language } = useLanguage();
  const currentIndex = STATUS_PROGRESSION[currentStatus] ?? 0;

  if (currentStatus === 'CANCELLED') {
    return (
      <View style={styles.cancelledBox}>
        <Text style={styles.cancelledText}>
          {language === 'as' ? 'এই অৰ্ডাৰটো বাতিল কৰা হৈছে' : 'This order was cancelled'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {STEPS.map((step, index) => {
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;
        const StepIcon = step.icon;
        const label = language === 'as' ? step.labelAs : step.labelEn;

        return (
          <View key={step.key} style={styles.stepRow}>
            {/* Step Icon & Vertical Line */}
            <View style={styles.leftColumn}>
              <View
                style={[
                  styles.circle,
                  isCompleted && styles.circleCompleted,
                  isCurrent && styles.circleCurrent,
                ]}
              >
                <StepIcon
                  size={14}
                  color={isCompleted ? '#FFFFFF' : COLORS.textMuted}
                />
              </View>

              {index < STEPS.length - 1 && (
                <View
                  style={[
                    styles.verticalLine,
                    index < currentIndex && styles.verticalLineCompleted,
                  ]}
                />
              )}
            </View>

            {/* Step Label */}
            <View style={styles.rightColumn}>
              <Text
                style={[
                  styles.stepTitle,
                  isCompleted && styles.stepTitleCompleted,
                  isCurrent && styles.stepTitleCurrent,
                ]}
              >
                {label}
              </Text>
              {isCurrent && (
                <Text style={styles.currentStatusHint}>
                  {language === 'as' ? 'বৰ্তমান স্থিতি' : 'Current progress'}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 52,
  },
  leftColumn: {
    alignItems: 'center',
    width: 32,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  circleCompleted: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  circleCurrent: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  verticalLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  verticalLineCompleted: {
    backgroundColor: COLORS.primary,
  },
  rightColumn: {
    flex: 1,
    paddingLeft: 12,
    paddingTop: 4,
  },
  stepTitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  stepTitleCompleted: {
    color: COLORS.text,
    fontWeight: '700',
  },
  stepTitleCurrent: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  currentStatusHint: {
    fontSize: 11,
    color: COLORS.secondary,
    fontWeight: '600',
    marginTop: 2,
  },
  cancelledBox: {
    padding: 16,
    backgroundColor: COLORS.errorLight,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelledText: {
    color: COLORS.error,
    fontWeight: '700',
    fontSize: 14,
  },
});
