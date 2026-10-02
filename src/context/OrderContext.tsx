import React, { createContext, useContext, useState, useEffect } from 'react';
import { Order, OrderStatus, CartItem, DeliveryType, User } from '../types';
import { INITIAL_ORDERS } from '../constants/mockData';
import { triggerHaptic } from '../lib/haptics';
import { supabase } from '../lib/supabase';

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
  updateOrderStatus: (orderId: string, nextStatus: OrderStatus) => Promise<void>;
  getOrderById: (orderId: string) => Order | undefined;
  refreshOrders: () => Promise<void>;
  isLoading: boolean;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Group by buyer vs seller
  const buyerOrders = orders;
  const sellerOrders = orders;

  useEffect(() => {
    fetchLiveOrders();

    // Subscribe to realtime updates on orders
    const channel = supabase
      .channel('realtime_orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newOrd = mapDbOrder(payload.new);
            setOrders((prev) => [newOrd, ...prev.filter((o) => o.id !== newOrd.id)]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedOrd = mapDbOrder(payload.new);
            setOrders((prev) =>
              prev.map((ord) => (ord.id === updatedOrd.id ? { ...ord, ...updatedOrd } : ord))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const mapDbOrder = (row: any, items: any[] = []): Order => ({
    id: row.id.toString(),
    order_number: row.order_number,
    buyer_id: row.buyer_id,
    buyer_name: row.buyer_name,
    buyer_phone: row.buyer_phone,
    seller_id: row.seller_id,
    seller_name: row.seller_name,
    seller_phone: row.seller_phone,
    items: items.length > 0 ? items.map((it) => ({
      id: it.id.toString(),
      order_id: it.order_id.toString(),
      listing_id: it.listing_id ? it.listing_id.toString() : '',
      title: it.title,
      quantity: it.quantity,
      unit_price: Number(it.unit_price),
      unit: it.unit,
      line_total: Number(it.line_total),
      image_url: it.image_url,
    })) : [
      {
        id: `oi-${row.id}`,
        order_id: row.id.toString(),
        listing_id: 'l1',
        title: 'Assam Produce Order',
        quantity: 1,
        unit_price: Number(row.subtotal),
        unit: 'kg',
        line_total: Number(row.subtotal),
        image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600',
      },
    ],
    subtotal: Number(row.subtotal),
    delivery_fee: Number(row.delivery_fee || 0),
    discount: Number(row.discount || 0),
    total: Number(row.total),
    status: row.status as OrderStatus,
    pickup_or_delivery: row.pickup_or_delivery as DeliveryType,
    delivery_address: row.delivery_address,
    payment_method: row.payment_method || 'cod',
    payment_status: row.payment_status || 'pending',
    created_at: row.created_at || new Date().toISOString(),
    estimated_delivery: row.estimated_delivery || 'Within 2 hours',
  });

  const fetchLiveOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped = data.map((row: any) => mapDbOrder(row, row.order_items || []));
        setOrders(mapped);
      }
    } catch (e) {
      console.log('Supabase orders fetch error, fallback:', e);
    } finally {
      setIsLoading(false);
    }
  };

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
    const orderNumber = `#TB-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      order_number: orderNumber,
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

    // Insert to Supabase
    try {
      const { data: dbOrder, error: ordErr } = await supabase
        .from('orders')
        .insert([
          {
            order_number: orderNumber,
            buyer_id: buyer.id,
            buyer_name: buyer.name,
            buyer_phone: buyer.phone,
            seller_id: newOrder.seller_id,
            seller_name: newOrder.seller_name,
            seller_phone: newOrder.seller_phone,
            subtotal,
            delivery_fee: deliveryFee,
            discount: 0,
            total,
            status: 'REQUESTED',
            pickup_or_delivery: deliveryType,
            delivery_address: deliveryAddress,
            payment_method: paymentMethod,
            payment_status: paymentMethod === 'cod' ? 'pending' : 'paid',
            estimated_delivery: newOrder.estimated_delivery,
          },
        ])
        .select()
        .single();

      if (dbOrder && !ordErr) {
        // Insert order items
        const orderItemsPayload = cart.map((item) => ({
          order_id: dbOrder.id,
          listing_id: item.listing.id.startsWith('l-') || item.listing.id.startsWith('l1') ? null : item.listing.id,
          title: item.listing.title_en,
          quantity: item.quantity,
          unit_price: item.listing.price,
          unit: item.listing.unit,
          line_total: item.listing.price * item.quantity,
          image_url: item.listing.image_url,
        }));

        await supabase.from('order_items').insert(orderItemsPayload);
      }
    } catch (e) {
      console.log('Supabase place order fallback:', e);
    }

    return newOrder;
  };

  const updateOrderStatus = async (orderId: string, nextStatus: OrderStatus) => {
    triggerHaptic('medium');
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status: nextStatus } : ord))
    );

    try {
      await supabase
        .from('orders')
        .update({ status: nextStatus })
        .eq('id', orderId);
    } catch (e) {
      console.log('Supabase update order status fallback:', e);
    }
  };

  const getOrderById = (orderId: string) => {
    return orders.find((o) => o.id === orderId);
  };

  const refreshOrders = async () => {
    await fetchLiveOrders();
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
        refreshOrders,
        isLoading,
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
