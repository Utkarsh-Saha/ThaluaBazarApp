import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Compass, Store, ShoppingBag, ShoppingCart, User } from 'lucide-react-native';
import { COLORS } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';

export default function TabLayout() {
  const { language, t } = useLanguage();
  const { itemCount } = useCart();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.borderLight,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="explore"
        options={{
          title: t('tabHome'),
          tabBarIcon: ({ color, focused }) => (
            <Compass size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="haats"
        options={{
          title: t('tabHaats'),
          tabBarIcon: ({ color, focused }) => (
            <Store size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: t('tabOrders'),
          tabBarIcon: ({ color, focused }) => (
            <ShoppingBag size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: t('tabCart'),
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.cartIconWrapper}>
              <ShoppingCart size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
              {itemCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{itemCount}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabProfile'),
          tabBarIcon: ({ color, focused }) => (
            <User size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  cartIconWrapper: {
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: COLORS.secondary,
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
});
