export type UserRole = 'buyer' | 'seller' | 'moderator' | 'admin';

export type LanguageCode = 'en' | 'as';

export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'under_review';

export type OrderStatus = 'REQUESTED' | 'ACCEPTED' | 'READY_FOR_PICKUP' | 'OUT_FOR_DELIVERY' | 'COMPLETED' | 'CANCELLED';

export type DeliveryType = 'delivery' | 'pickup';

export type SellerType = 'shg_member' | 'individual' | 'small_business';

export interface User {
  id: string;
  phone: string;
  email?: string;
  name: string;
  role: UserRole;
  language: LanguageCode;
  lat: number;
  lng: number;
  address?: string;
  village?: string;
  district?: string;
  verified: boolean;
  created_at: string;
}

export interface SellerProfile {
  id: string;
  user_id: string;
  business_name: string;
  seller_type: SellerType;
  shg_code?: string;
  village: string;
  district: string;
  upi_id: string;
  bank_account?: string;
  bank_ifsc?: string;
  verification_status: VerificationStatus;
  rating: number;
  reviews_count: number;
  delivery_radius_km: number;
  is_online: boolean;
  documents?: {
    id_proof_url?: string;
    address_proof_url?: string;
    shg_cert_url?: string;
    bank_proof_url?: string;
  };
  today_sales: number;
  total_orders: number;
  created_at: string;
}

export interface ProductCategory {
  id: string;
  slug: string;
  name_en: string;
  name_as: string;
  icon: string;
}

export interface Listing {
  id: string;
  seller_id: string;
  seller_name: string;
  seller_type?: SellerType;
  seller_phone: string;
  category_id: string;
  category_name_en: string;
  category_name_as: string;
  title_en: string;
  title_as: string;
  description_en: string;
  description_as: string;
  price: number;
  unit: string;
  stock: number;
  image_url: string;
  lat: number;
  lng: number;
  village: string;
  district: string;
  haat_name?: string;
  distance_km?: number;
  rating: number;
  status: 'active' | 'inactive' | 'sold_out';
  is_organic?: boolean;
  created_at: string;
}

export interface CartItem {
  listing: Listing;
  quantity: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  listing_id: string;
  title: string;
  quantity: number;
  unit_price: number;
  unit: string;
  line_total: number;
  image_url?: string;
}

export interface Order {
  id: string;
  order_number: string;
  buyer_id: string;
  buyer_name: string;
  buyer_phone: string;
  seller_id: string;
  seller_name: string;
  seller_phone: string;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  status: OrderStatus;
  pickup_or_delivery: DeliveryType;
  delivery_address?: string;
  payment_method: 'upi' | 'card' | 'cod' | 'netbanking';
  payment_status: 'pending' | 'paid' | 'failed';
  created_at: string;
  estimated_delivery?: string;
}

export interface HaatMarket {
  id: string;
  name_en: string;
  name_as: string;
  district: string;
  location: string;
  market_day: string;
  market_day_as: string;
  timings: string;
  specialty_en: string;
  specialty_as: string;
  active_sellers_count: number;
  lat: number;
  lng: number;
  distance_km?: number;
  image_url: string;
}

export interface ContactUnlock {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
  payment_status: 'free_tier' | 'paid';
  created_at: string;
}
