import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import { ListingsProvider } from '../context/ListingsContext';
import { CartProvider } from '../context/CartContext';
import { OrderProvider } from '../context/OrderContext';
import { COLORS } from '../constants/theme';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <LanguageProvider>
            <ListingsProvider>
              <CartProvider>
                <OrderProvider>
                  <StatusBar style="dark" />
                  <Stack
                    screenOptions={{
                      headerShown: false,
                      contentStyle: { backgroundColor: COLORS.background },
                      animation: 'slide_from_right',
                    }}
                  >
                    <Stack.Screen name="index" />
                    <Stack.Screen name="(auth)/login" />
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="product/[id]" />
                    <Stack.Screen name="checkout/index" />
                    <Stack.Screen name="checkout/confirmation" />
                    <Stack.Screen name="seller/dashboard" />
                    <Stack.Screen name="seller/register" />
                    <Stack.Screen name="seller/documents" />
                    <Stack.Screen name="seller/verification" />
                    <Stack.Screen name="seller/products" />
                    <Stack.Screen name="seller/add-product" />
                    <Stack.Screen name="seller/orders" />
                    <Stack.Screen name="seller/earnings" />
                    <Stack.Screen name="seller/analytics" />
                    <Stack.Screen name="seller/subscription" />
                    <Stack.Screen name="notifications" />
                    <Stack.Screen name="wishlist" />
                    <Stack.Screen name="addresses" />
                    <Stack.Screen name="support" />
                    <Stack.Screen name="settings" />
                    <Stack.Screen name="admin/index" />
                  </Stack>
                </OrderProvider>
              </CartProvider>
            </ListingsProvider>
          </LanguageProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
