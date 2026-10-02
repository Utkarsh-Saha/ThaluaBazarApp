import React, { createContext, useContext, useState } from 'react';
import { Order, OrderStatus, CartItem, DeliveryType, User } from '../types';
import { INITIAL_ORDERS } from '../constants/mockData';
import { triggerHaptic } from '../lib/haptics';

interface OrderContextType {
  orders: Order[];
  buyerOrders: Order[];
  sellerOrders: Order[];
  placeOrder: (
    cart: CartItem[],
    buyer: User,
    deliveryType: DeliveryType,
    deliveryAddress: string,
    paymentMethod: 'upi' | 'card' | 'cod' | 'netbanking'
  ) => Promise<Order>;
  updateOrderStatus: (orderId: string, nextStatus: OrderStatus) => void;
  getOrderById: (orderId: string) => Order | undefined;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);

  // Group by buyer vs seller
  const buyerOrders = orders;
  const sellerOrders = orders;

  const placeOrder = async (
    cart: CartItem[],
    buyer: User,
    deliveryType: DeliveryType,
    deliveryAddress: string,
    paymentMethod: 'upi' | 'card' | 'cod' | 'netbanking'
  ): Promise<Order> => {
    triggerHaptic('success');

    const primarySeller = cart[0]?.listing;
    const subtotal = cart.reduce((acc, item) => acc + item.listing.price * item.quantity, 0);
    const deliveryFee = deliveryType === 'pickup' || subtotal >= 500 ? 0 : 30;
    const total = subtotal + deliveryFee;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      order_number: `#TB-${Math.floor(1000 + Math.random() * 9000)}`,
      buyer_id: buyer.id,
      buyer_name: buyer.name || 'Assam Buyer',
      buyer_phone: buyer.phone || '+91 98765 43210',
      seller_id: primarySeller?.seller_id || 's1',
      seller_name: primarySeller?.seller_name || 'Village SHG Producer',
      seller_phone: primarySeller?.seller_phone || '+91 94350 00000',
      items: cart.map((item, idx) => ({
        id: `oi-${Date.now()}-${idx}`,
        order_id: `ord-${Date.now()}`,
        listing_id: item.listing.id,
        title: item.listing.title_en,
        quantity: item.quantity,
        unit_price: item.listing.price,
        unit: item.listing.unit,
        line_total: item.listing.price * item.quantity,
        image_url: item.listing.image_url,
      })),
      subtotal,
      delivery_fee: deliveryFee,
      discount: 0,
      total,
      status: 'REQUESTED',
      pickup_or_delivery: deliveryType,
      delivery_address: deliveryAddress,
      payment_method: paymentMethod,
      payment_status: paymentMethod === 'cod' ? 'pending' : 'paid',
      created_at: new Date().toISOString(),
      estimated_delivery: deliveryType === 'pickup' ? 'Ready in 1 hour' : 'Today, within 2 hours',
    };

    setOrders((prev) => [newOrder, ...prev]);
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, nextStatus: OrderStatus) => {
    triggerHaptic('medium');
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status: nextStatus } : ord))
    );
  };

  const getOrderById = (orderId: string) => {
    return orders.find((o) => o.id === orderId);
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        buyerOrders,
        sellerOrders,
        placeOrder,
        updateOrderStatus,
        getOrderById,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};
