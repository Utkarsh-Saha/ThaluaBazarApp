import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WifiOff, RefreshCw, CheckCircle2, Wifi, ZapOff } from 'lucide-react-native';
import { COLORS } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { offlineSyncManager, NetworkState } from '../lib/offlineSync';
import { triggerHaptic } from '../lib/haptics';

export const OfflineBanner: React.FC = () => {
  const { language } = useLanguage();
  const [netState, setNetState] = useState<NetworkState>(offlineSyncManager.networkState);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [justSynced, setJustSynced] = useState<boolean>(false);

  useEffect(() => {
    const unsubNet = offlineSyncManager.subscribeToNetwork((state) => {
      setNetState(state);
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

  const handleTurnOffManualOffline = async () => {
    triggerHaptic('medium');
    await offlineSyncManager.setManualOfflineMode(false);
  };

  // Condition check: When should banner be hidden?
  // Only show if:
  // 1. justSynced notification active
  // 2. User explicitly turned ON manual offline mode
  // 3. Network probe detected LOW signal (slow latency)
  // 4. Network probe detected REAL OFFLINE (disconnected)
  // 5. Actions are waiting to be uploaded to cloud
  const shouldShow =
    justSynced ||
    netState.isManualOffline ||
    !netState.isOnline ||
    netState.signalQuality === 'low' ||
    pendingCount > 0;

  if (!shouldShow) {
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

  // 1. User explicitly enabled manual offline mode
  if (netState.isManualOffline) {
    return (
      <View style={[styles.bannerContainer, styles.manualOfflineContainer]}>
        <View style={styles.leftCol}>
          <ZapOff size={16} color="#4338CA" />
          <View style={styles.textCol}>
            <Text style={[styles.bannerTitle, { color: '#4338CA' }]}>
              {language === 'as' ? '📡 অফলাইন মোড (অন কৰা আছে)' : '📡 Manual Offline Mode (Active)'}
            </Text>
            <Text style={styles.bannerSubtitle}>
              {language === 'as'
                ? 'আপুনি অফলাইন মোড অন কৰি ৰাখিছে। স্থানীয় তথ্য ব্যৱহাৰ হৈছে।'
                : 'Offline mode is enabled by you. Browsing local cached produce.'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.syncBtn, { backgroundColor: '#4F46E5' }]}
          onPress={handleTurnOffManualOffline}
          activeOpacity={0.8}
        >
          <Text style={styles.syncBtnText}>
            {language === 'as' ? 'অফ কৰক' : 'Turn Off'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 2. Real offline (no connection)
  if (!netState.isOnline) {
    return (
      <View style={[styles.bannerContainer, styles.offlineContainer]}>
        <View style={styles.leftCol}>
          <WifiOff size={16} color="#991B1B" />
          <View style={styles.textCol}>
            <Text style={[styles.bannerTitle, styles.offlineTitle]}>
              {language === 'as' ? '📡 ইণ্টাৰনেট বিচ্ছিন্ন (Offline)' : '📡 No Internet Connection'}
            </Text>
            <Text style={styles.bannerSubtitle}>
              {language === 'as'
                ? 'সংৰক্ষিত স্থানীয় সামগ্ৰী প্ৰদৰ্শিত হৈছে। নেটৱৰ্ক আহিলে সংমিশ্ৰিত হ’ব।'
                : 'Showing saved local produce. Any actions will sync once reconnected.'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.syncBtn, styles.syncBtnRetry]}
          onPress={handleManualSync}
          disabled={isSyncing}
          activeOpacity={0.8}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.syncBtnText}>
              {language === 'as' ? 'পুনৰ পৰীক্ষা' : 'Retry'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  // 3. Low/Weak signal detected
  if (netState.signalQuality === 'low') {
    return (
      <View style={[styles.bannerContainer, styles.pendingSyncContainer]}>
        <View style={styles.leftCol}>
          <Wifi size={16} color="#B45309" />
          <View style={styles.textCol}>
            <Text style={[styles.bannerTitle, styles.pendingTitle]}>
              {language === 'as' ? '📶 দুৰ্বল নেটৱৰ্ক সংকেত (Weak Signal)' : '📶 Weak / Slow Signal Detected'}
            </Text>
            <Text style={styles.bannerSubtitle}>
              {language === 'as'
                ? 'ইণ্টাৰনেট ধীৰ হৈছে। ক্ষিপ্ৰতাৰ বাবে কেচ ব্যৱহাৰ কৰা হৈছে।'
                : 'Connection is slow. Using local cache for smooth browsing.'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.syncBtn, styles.syncBtnActive]}
          onPress={handleManualSync}
          disabled={isSyncing}
          activeOpacity={0.8}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.syncBtnText}>
              {language === 'as' ? 'পৰীক্ষা' : 'Refresh'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  // 4. Pending Cloud Sync queue
  return (
    <View style={[styles.bannerContainer, styles.pendingSyncContainer]}>
      <View style={styles.leftCol}>
        <RefreshCw size={15} color="#B45309" />
        <View style={styles.textCol}>
          <Text style={[styles.bannerTitle, styles.pendingTitle]}>
            {language === 'as' ? 'অসমাপ্ত অফলাইন কাৰ্য (Pending Sync)' : 'Pending Cloud Sync'}
          </Text>
          <Text style={styles.bannerSubtitle}>
            {`${pendingCount} ${language === 'as' ? 'টা কাৰ্য সংমিশ্ৰণৰ অপেক্ষাত আছে' : 'action(s) waiting to upload'}`}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.syncBtn, styles.syncBtnActive]}
        onPress={handleManualSync}
        disabled={isSyncing}
        activeOpacity={0.8}
      >
        {isSyncing ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.syncBtnText}>
            {language === 'as' ? 'সংমিশ্ৰণ' : 'Sync Now'}
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
  manualOfflineContainer: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
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
