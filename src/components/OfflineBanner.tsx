import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react-native';
import { COLORS } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { offlineSyncManager } from '../lib/offlineSync';
import { triggerHaptic } from '../lib/haptics';

export const OfflineBanner: React.FC = () => {
  const { language } = useLanguage();
  const [isOnline, setIsOnline] = useState<boolean>(offlineSyncManager.isOnline);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [justSynced, setJustSynced] = useState<boolean>(false);

  useEffect(() => {
    const unsubNet = offlineSyncManager.subscribeToNetwork((online) => {
      setIsOnline(online);
    });

    const unsubQueue = offlineSyncManager.subscribeToQueue((count) => {
      setPendingCount(count);
    });

    return () => {
      unsubNet();
      unsubQueue();
    };
  }, []);

  const handleManualSync = async () => {
    triggerHaptic('medium');
    setIsSyncing(true);
    try {
      const isConnected = await offlineSyncManager.checkConnectivity();
      if (isConnected) {
        const res = await offlineSyncManager.processSyncQueue();
        if (res.synced > 0) {
          triggerHaptic('success');
          setJustSynced(true);
          setTimeout(() => setJustSynced(false), 3000);
        }
      } else {
        triggerHaptic('error');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  if (isOnline && pendingCount === 0 && !justSynced) {
    return null;
  }

  if (justSynced) {
    return (
      <View style={[styles.bannerContainer, styles.successContainer]}>
        <CheckCircle2 size={15} color="#065F46" />
        <Text style={styles.successText}>
          {language === 'as' ? 'অফলাইন কাৰ্যকলাপ সফলভাৱে সংমিশ্ৰিত হ’ল! (Synced)' : 'Offline changes synced with cloud!'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.bannerContainer, isOnline ? styles.pendingSyncContainer : styles.offlineContainer]}>
      <View style={styles.leftCol}>
        {isOnline ? (
          <RefreshCw size={15} color="#B45309" />
        ) : (
          <WifiOff size={15} color="#991B1B" />
        )}
        <View style={styles.textCol}>
          <Text style={[styles.bannerTitle, isOnline ? styles.pendingTitle : styles.offlineTitle]}>
            {!isOnline
              ? language === 'as'
                ? '📡 অফলাইন মোড (Offline Mode)'
                : '📡 Offline Mode (Local Cache)'
              : language === 'as'
              ? 'অসমাপ্ত অফলাইন কাৰ্য (Pending Sync)'
              : 'Pending Cloud Sync'}
          </Text>
          <Text style={styles.bannerSubtitle}>
            {!isOnline
              ? language === 'as'
                ? 'সংৰক্ষিত সজীৱ সামগ্ৰী প্ৰদৰ্শিত হৈছে। নেটৱৰ্ক আহিলে স্বয়ংক্ৰিয়ভাৱে সংমিশ্ৰিত হ’ব।'
                : 'Showing saved local produce. Any actions will sync once reconnected.'
              : `${pendingCount} ${language === 'as' ? 'টা কাৰ্য সংমিশ্ৰণৰ অপেক্ষাত আছে' : 'action(s) waiting to upload'}`}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.syncBtn, isOnline ? styles.syncBtnActive : styles.syncBtnRetry]}
        onPress={handleManualSync}
        disabled={isSyncing}
        activeOpacity={0.8}
      >
        {isSyncing ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.syncBtnText}>
            {isOnline
              ? language === 'as' ? 'সংমিশ্ৰণ' : 'Sync Now'
              : language === 'as' ? 'পুনৰ পৰীক্ষা' : 'Retry'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  offlineContainer: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  pendingSyncContainer: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  successContainer: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    justifyContent: 'center',
    gap: 8,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  textCol: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  offlineTitle: {
    color: '#991B1B',
  },
  pendingTitle: {
    color: '#B45309',
  },
  bannerSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  successText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
  },
  syncBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncBtnActive: {
    backgroundColor: COLORS.primary,
  },
  syncBtnRetry: {
    backgroundColor: '#DC2626',
  },
  syncBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
