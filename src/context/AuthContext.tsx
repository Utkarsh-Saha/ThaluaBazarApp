import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, SellerProfile, UserRole, SellerType, VerificationStatus } from '../types';

interface AuthContextType {
  user: User | null;
  sellerProfile: SellerProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  selectedEntryRole: 'buyer' | 'seller';
  setSelectedEntryRole: (role: 'buyer' | 'seller') => void;
  sendOtp: (phone: string) => Promise<boolean>;
  verifyOtp: (phone: string, otp: string) => Promise<boolean>;
  registerSeller: (data: {
    business_name: string;
    seller_type: SellerType;
    shg_code?: string;
    village: string;
    district: string;
    upi_id: string;
  }) => Promise<void>;
  uploadSellerDocuments: (docs: {
    id_proof_url?: string;
    address_proof_url?: string;
    shg_cert_url?: string;
    bank_proof_url?: string;
  }) => Promise<void>;
  toggleSellerOnline: () => void;
  switchRole: (newRole: UserRole) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = '@thaluwa_user';
const SELLER_STORAGE_KEY = '@thaluwa_seller';

const DEFAULT_BUYER: User = {
  id: 'buyer-01',
  phone: '+91 98765 43210',
  name: 'John Doe',
  email: 'john.assam@example.com',
  role: 'buyer',
  language: 'en',
  lat: 26.4350,
  lng: 92.0300,
  address: 'Ward No 4, Hospital Road, Mangaldai - 784125',
  village: 'Mangaldai Town',
  district: 'Darrang',
  verified: true,
  created_at: new Date().toISOString(),
};

const DEFAULT_SELLER: SellerProfile = {
  id: 'seller-01',
  user_id: 'user-seller-01',
  business_name: 'Pragjyotishpur Mahila SHG',
  seller_type: 'shg_member',
  shg_code: 'AS-DRG-SHG-2023-889',
  village: 'Deomornoi',
  district: 'Darrang',
  upi_id: 'pragjyotishpur@okaxis',
  verification_status: 'verified',
  rating: 4.8,
  reviews_count: 38,
  delivery_radius_km: 15,
  is_online: true,
  today_sales: 2450,
  total_orders: 12,
  created_at: new Date().toISOString(),
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(DEFAULT_BUYER);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(DEFAULT_SELLER);
  const [role, setRole] = useState<UserRole>('buyer');
  const [selectedEntryRole, setSelectedEntryRole] = useState<'buyer' | 'seller'>('buyer');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadStoredSession();
  }, []);

  const loadStoredSession = async () => {
    try {
      const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
      const storedSeller = await AsyncStorage.getItem(SELLER_STORAGE_KEY);
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setRole(parsed.role || 'buyer');
      }
      if (storedSeller) {
        setSellerProfile(JSON.parse(storedSeller));
      }
    } catch (e) {
      console.warn('Session load error', e);
    } finally {
      setIsLoading(false);
    }
  };

  const sendOtp = async (phone: string): Promise<boolean> => {
    // Simulated OTP generation (or Supabase signInWithOtp)
    return new Promise((resolve) => setTimeout(() => resolve(true), 600));
  };

  const verifyOtp = async (phone: string, otp: string): Promise<boolean> => {
    setIsLoading(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        const newUser: User = {
          id: `u-${Date.now()}`,
          phone,
          name: selectedEntryRole === 'seller' ? 'XYZ SHG Member' : 'John Doe',
          role: selectedEntryRole === 'seller' ? 'seller' : 'buyer',
          language: 'en',
          lat: 26.4350,
          lng: 92.0300,
          address: 'Mangaldai, Assam',
          village: 'Mangaldai',
          district: 'Darrang',
          verified: true,
          created_at: new Date().toISOString(),
        };

        setUser(newUser);
        setRole(newUser.role);
        AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));

        if (selectedEntryRole === 'seller' && !sellerProfile) {
          const newSeller: SellerProfile = {
            id: `sel-${Date.now()}`,
            user_id: newUser.id,
            business_name: 'Assam Green SHG',
            seller_type: 'shg_member',
            village: 'Mangaldai',
            district: 'Darrang',
            upi_id: 'seller@upi',
            verification_status: 'pending',
            rating: 5.0,
            reviews_count: 0,
            delivery_radius_km: 10,
            is_online: true,
            today_sales: 0,
            total_orders: 0,
            created_at: new Date().toISOString(),
          };
          setSellerProfile(newSeller);
          AsyncStorage.setItem(SELLER_STORAGE_KEY, JSON.stringify(newSeller));
        }

        setIsLoading(false);
        resolve(true);
      }, 700);
    });
  };

  const registerSeller = async (data: {
    business_name: string;
    seller_type: SellerType;
    shg_code?: string;
    village: string;
    district: string;
    upi_id: string;
  }) => {
    if (!user) return;
    const newProfile: SellerProfile = {
      id: `sel-${Date.now()}`,
      user_id: user.id,
      business_name: data.business_name,
      seller_type: data.seller_type,
      shg_code: data.shg_code,
      village: data.village,
      district: data.district,
      upi_id: data.upi_id,
      verification_status: 'pending',
      rating: 5.0,
      reviews_count: 0,
      delivery_radius_km: 15,
      is_online: true,
      today_sales: 0,
      total_orders: 0,
      created_at: new Date().toISOString(),
    };
    setSellerProfile(newProfile);
    setRole('seller');
    const updatedUser: User = { ...user, role: 'seller' };
    setUser(updatedUser);
    await AsyncStorage.setItem(SELLER_STORAGE_KEY, JSON.stringify(newProfile));
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
  };

  const uploadSellerDocuments = async (docs: {
    id_proof_url?: string;
    address_proof_url?: string;
    shg_cert_url?: string;
    bank_proof_url?: string;
  }) => {
    if (!sellerProfile) return;
    const updated: SellerProfile = {
      ...sellerProfile,
      documents: {
        ...sellerProfile.documents,
        ...docs,
      },
      verification_status: 'pending',
    };
    setSellerProfile(updated);
    await AsyncStorage.setItem(SELLER_STORAGE_KEY, JSON.stringify(updated));
  };

  const toggleSellerOnline = () => {
    if (!sellerProfile) return;
    const updated: SellerProfile = {
      ...sellerProfile,
      is_online: !sellerProfile.is_online,
    };
    setSellerProfile(updated);
    AsyncStorage.setItem(SELLER_STORAGE_KEY, JSON.stringify(updated));
  };

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
    if (user) {
      const updatedUser = { ...user, role: newRole };
      setUser(updatedUser);
      AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
    await AsyncStorage.removeItem(SELLER_STORAGE_KEY);
    setUser(null);
    setSellerProfile(null);
    setRole('buyer');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        sellerProfile,
        role,
        isAuthenticated: !!user,
        isLoading,
        selectedEntryRole,
        setSelectedEntryRole,
        sendOtp,
        verifyOtp,
        registerSeller,
        uploadSellerDocuments,
        toggleSellerOnline,
        switchRole,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
