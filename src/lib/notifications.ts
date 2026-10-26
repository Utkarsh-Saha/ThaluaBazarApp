import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure foreground notification banner behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions and register the device for push notifications
 */
export async function registerForPushNotificationsAsync(userId?: string): Promise<string | null> {
  let token: string | null = null;

  try {
    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Thaluwa Bazar Orders & Market Alerts',
          importance: AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#137547',
          enableVibrate: true,
        });
      } catch (channelErr) {
        console.warn('[Notifications] Android notification channel setup skipped/failed:', channelErr);
      }
    }

    if (!Device.isDevice) {
      console.log('[Notifications] Push notifications require a physical device.');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Notifications] Permission not granted for push notifications.');
      return null;
    }

    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

      const pushTokenData = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      );
      token = pushTokenData?.data ?? null;

      // Sync push token with user profile in Supabase
      if (userId && token) {
        await supabase
          .from('users')
          .update({ expo_push_token: token })
          .eq('id', userId);
      }
    } catch (e) {
      console.warn('[Notifications] Error fetching Expo push token (expected in Expo Go Android):', e);
    }
  } catch (err) {
    console.warn('[Notifications] registerForPushNotificationsAsync encountered an error:', err);
  }

  return token;
}

/**
 * Triggers an immediate local notification on device
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<string | undefined> {
  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: 'default',
      },
      trigger: null,
    });
  } catch (e) {
    console.warn('[Notifications] Error scheduling local notification:', e);
    return undefined;
  }
}
