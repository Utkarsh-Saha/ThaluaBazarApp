import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, SellerProfile, UserRole, SellerType } from '../types';
import { supabase } from '../lib/supabase';

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
  toggleSellerOnline: () => Promise<void>;
  switchRole: (newRole: UserRole) => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = '@thaluwa_user';
const SELLER_STORAGE_KEY = '@thaluwa_seller';

const DEFAULT_BUYER: User = {
  id: 'buyer-01',
  phone: '+91 98765 43210',
  name: 'Pranab Das',
  email: 'pranab.darrang@gmail.com',
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
  user_id: 'buyer-01',
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

    // Listen to Supabase auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await syncUserFromSupabase(session.user.id, session.user.phone || '');
      } else if (event === 'SIGNED_OUT') {
        // Keep local cache or clear based on preference
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
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

  const syncUserFromSupabase = async (authId: string, phone: string) => {
    try {
      // Query users table
      const { data: dbUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('phone', phone)
        .single();

      if (dbUser && !userError) {
        const parsedUser: User = {
          id: dbUser.id,
          phone: dbUser.phone,
          name: dbUser.name || 'Assam Resident',
          email: dbUser.email,
          role: (dbUser.role as UserRole) || 'buyer',
          language: dbUser.language || 'en',
          lat: dbUser.lat || 26.4350,
          lng: dbUser.lng || 92.0300,
          address: dbUser.address,
          village: dbUser.village,
          district: dbUser.district,
          verified: dbUser.verified,
          created_at: dbUser.created_at,
        };

        setUser(parsedUser);
        setRole(parsedUser.role);
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(parsedUser));

        // Query seller_profiles table
        const { data: dbSeller } = await supabase
          .from('seller_profiles')
          .select('*')
          .eq('user_id', dbUser.id)
          .single();

        if (dbSeller) {
          const parsedSeller: SellerProfile = {
            id: dbSeller.id,
            user_id: dbSeller.user_id,
            business_name: dbSeller.business_name,
            seller_type: dbSeller.seller_type,
            shg_code: dbSeller.shg_code,
            village: dbSeller.village,
            district: dbSeller.district,
            upi_id: dbSeller.upi_id,
            verification_status: dbSeller.verification_status,
            rating: Number(dbSeller.rating || 5.0),
            reviews_count: dbSeller.reviews_count || 0,
            delivery_radius_km: dbSeller.delivery_radius_km || 15,
            is_online: dbSeller.is_online,
            today_sales: Number(dbSeller.today_sales || 0),
            total_orders: dbSeller.total_orders || 0,
            created_at: dbSeller.created_at,
          };
          setSellerProfile(parsedSeller);
          await AsyncStorage.setItem(SELLER_STORAGE_KEY, JSON.stringify(parsedSeller));
        }
      }
    } catch (err) {
      console.warn('Sync user from Supabase error:', err);
    }
  };

  const sendOtp = async (phone: string): Promise<boolean> => {
    try {
      // Format phone with country code if needed
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) {
        console.log('Supabase OTP notice (fallback enabled):', error.message);
      }
      return true;
    } catch (e) {
      console.warn('sendOtp fallback:', e);
      return true;
    }
  };

  const verifyOtp = async (phone: string, otp: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;

      // Try real Supabase OTP verification
      try {
        const { data: authData, error } = await supabase.auth.verifyOtp({
          phone: formattedPhone,
          token: otp,
          type: 'sms',
        });

        if (!error && authData.user) {
          await syncUserFromSupabase(authData.user.id, formattedPhone);
          setIsLoading(false);
          return true;
        }
      } catch (e) {
        console.log('Supabase verifyOtp offline/mock mode:', e);
      }

      // Hybrid Demo / Offline Flow
      const newUser: User = {
        id: `u-${Date.now()}`,
        phone: formattedPhone,
        name: selectedEntryRole === 'seller' ? 'Pragjyotishpur SHG Producer' : 'Pranab Das',
        role: selectedEntryRole === 'seller' ? 'seller' : 'buyer',
        language: 'en',
        lat: 26.4350,
        lng: 92.0300,
        address: 'Ward No 4, Hospital Road, Mangaldai - 784125',
        village: 'Mangaldai Town',
        district: 'Darrang',
        verified: true,
        created_at: new Date().toISOString(),
      };

      setUser(newUser);
      setRole(newUser.role);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));

      if (selectedEntryRole === 'seller' && !sellerProfile) {
        const newSeller: SellerProfile = {
          id: `sel-${Date.now()}`,
          user_id: newUser.id,
          business_name: 'Pragjyotishpur Mahila SHG',
          seller_type: 'shg_member',
          village: 'Deomornoi',
          district: 'Darrang',
          upi_id: 'pragjyotishpur@okaxis',
          verification_status: 'verified',
          rating: 4.9,
          reviews_count: 14,
          delivery_radius_km: 15,
          is_online: true,
          today_sales: 0,
          total_orders: 0,
          created_at: new Date().toISOString(),
        };
        setSellerProfile(newSeller);
        await AsyncStorage.setItem(SELLER_STORAGE_KEY, JSON.stringify(newSeller));

        // Try inserting into Supabase seller_profiles
        try {
          await supabase.from('seller_profiles').insert([
            {
              business_name: newSeller.business_name,
              seller_type: newSeller.seller_type,
              village: newSeller.village,
              district: newSeller.district,
              upi_id: newSeller.upi_id,
              verification_status: 'verified',
              is_online: true,
            },
          ]);
        } catch (e) {
          // ignore offline
        }
      }

      setIsLoading(false);
      return true;
    } catch (err) {
      console.warn('verifyOtp error:', err);
      setIsLoading(false);
      return true;
    }
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

    // Sync to Supabase
    try {
      await supabase.from('seller_profiles').insert([
        {
          business_name: data.business_name,
          seller_type: data.seller_type,
          shg_code: data.shg_code,
          village: data.village,
          district: data.district,
          upi_id: data.upi_id,
          verification_status: 'pending',
          is_online: true,
        },
      ]);
    } catch (e) {
      console.log('Supabase seller insert fallback:', e);
    }
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

    // Update in Supabase
    try {
      await supabase
        .from('seller_profiles')
        .update({
          id_proof_url: docs.id_proof_url,
          address_proof_url: docs.address_proof_url,
          shg_cert_url: docs.shg_cert_url,
          bank_proof_url: docs.bank_proof_url,
          verification_status: 'pending',
        })
        .eq('user_id', user?.id);
    } catch (e) {
      console.log('Supabase doc update fallback:', e);
    }
  };

  const toggleSellerOnline = async () => {
    if (!sellerProfile) return;
    const nextStatus = !sellerProfile.is_online;
    const updated: SellerProfile = {
      ...sellerProfile,
      is_online: nextStatus,
    };
    setSellerProfile(updated);
    await AsyncStorage.setItem(SELLER_STORAGE_KEY, JSON.stringify(updated));

    try {
      await supabase
        .from('seller_profiles')
        .update({ is_online: nextStatus })
        .eq('id', sellerProfile.id);
    } catch (e) {
      console.log('Supabase toggle status fallback:', e);
    }
  };

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
    if (user) {
      const updatedUser = { ...user, role: newRole };
      setUser(updatedUser);
      AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
    }
  };

  const refreshProfile = async () => {
    if (user?.phone) {
      await syncUserFromSupabase(user.id, user.phone);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // ignore
    }
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
        refreshProfile,
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
