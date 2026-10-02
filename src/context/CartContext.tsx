import React, { createContext, useContext, useState } from 'react';
import { CartItem, Listing, DeliveryType } from '../types';
import { triggerHaptic } from '../lib/haptics';

interface CartContextType {
  cart: CartItem[];
  addToCart: (listing: Listing, quantity?: number) => void;
  removeFromCart: (listingId: string) => void;
  updateQuantity: (listingId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryType: DeliveryType;
  setDeliveryType: (type: DeliveryType) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([
    // Initial sample cart item
    {
      listing: {
        id: 'l1',
        seller_id: 's1',
        seller_name: 'Pragjyotishpur Mahila SHG',
        seller_phone: '+91 94350 12345',
        category_id: '1',
        category_name_en: 'Joha & Bora Rice',
        category_name_as: 'জোহা আৰু বৰা ধান',
        title_en: 'Kola Joha Aromatic Rice (A-Grade)',
        title_as: 'সুগন্ধি ক’লা জোহা চাউল (প্ৰথম শ্ৰেণী)',
        description_en: 'Directly sourced from organic paddy fields of Darrang.',
        description_as: 'দৰঙৰ জৈৱিক ধাননিৰ পৰা সংগৃহীত সুগন্ধি জোহা চাউল।',
        price: 120,
        unit: 'kg',
        stock: 45,
        image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
        lat: 26.4350,
        lng: 92.0300,
        village: 'Deomornoi',
        district: 'Darrang',
        rating: 4.8,
        status: 'active',
        created_at: new Date().toISOString(),
      },
      quantity: 2,
    },
  ]);

  const [deliveryType, setDeliveryType] = useState<DeliveryType>('delivery');

  const addToCart = (listing: Listing, quantity: number = 1) => {
    triggerHaptic('medium');
    setCart((prev) => {
      const existing = prev.find((item) => item.listing.id === listing.id);
      if (existing) {
        return prev.map((item) =>
          item.listing.id === listing.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { listing, quantity }];
    });
  };

  const removeFromCart = (listingId: string) => {
    triggerHaptic('light');
    setCart((prev) => prev.filter((item) => item.listing.id !== listingId));
  };

  const updateQuantity = (listingId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(listingId);
      return;
    }
    triggerHaptic('light');
    setCart((prev) =>
      prev.map((item) =>
        item.listing.id === listingId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  // Server-trusted pricing model simulation
  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cart.reduce((acc, item) => acc + item.listing.price * item.quantity, 0);
  
  // Delivery calculation: FREE if pickup or if order is >= ₹500, otherwise flat ₹30
  const deliveryFee = deliveryType === 'pickup' || subtotal >= 500 || subtotal === 0 ? 0 : 30;
  const total = subtotal + deliveryFee;

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal,
        deliveryFee,
        total,
        deliveryType,
        setDeliveryType,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
