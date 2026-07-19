import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

/**
 * Checks if the application is currently running as a native app wrap (Android/iOS)
 */
export const isCapacitorActive = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Requests display notification configuration permission from either the phone or the web page
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isCapacitorActive()) {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        let permission: NotificationPermission = 'default';
        try {
          permission = Notification.permission;
        } catch (e) {
          console.warn('[Notifications] Cannot read Notification.permission in this sandbox/iframe environment:', e);
          return false;
        }

        if (permission === 'granted') {
          return true;
        }
        if (permission !== 'denied') {
          try {
            const res = await Notification.requestPermission();
            return res === 'granted';
          } catch (e) {
            console.warn('[Notifications] Notification.requestPermission is blocked or failed in this sandbox/iframe environment:', e);
            return false;
          }
        }
      }
    } catch (err) {
      console.warn('[Notifications] Error requesting web notification permission:', err);
    }
    return false;
  }

  try {
    const status = await LocalNotifications.checkPermissions();
    if (status.display === 'granted') {
      return true;
    }
    
    const requestStatus = await LocalNotifications.requestPermissions();
    return requestStatus.display === 'granted';
  } catch (err) {
    console.warn('[Notifications] Error retrieving Capacitor permissions:', err);
    return false;
  }
};

/**
 * Sends a native mobile device notification, falling back to desktop browser push alerts if native bridge not active.
 */
export const sendMobileNotification = async (title: string, body: string, customId?: number) => {
  console.log(`[Notification Dispatcher] Triggering alert: "${title}" => "${body}"`);

  if (!isCapacitorActive()) {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        let permission: NotificationPermission = 'default';
        try {
          permission = Notification.permission;
        } catch (e) {
          console.warn('[Notifications] Cannot read Notification.permission in this sandbox/iframe context:', e);
          return;
        }

        if (permission === 'granted') {
          try {
            new Notification(title, { body });
            return;
          } catch (err) {
            console.warn('[Notifications] Web standard constructor rejected, trying ServiceWorker context:', err);
            if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
              navigator.serviceWorker.ready.then((reg) => {
                reg.showNotification(title, { body });
              }).catch(() => {});
              return;
            }
          }
        } else {
          console.log('[Notifications] Web push disabled: permission is', permission);
        }
      }
    } catch (err) {
      console.warn('[Notifications] Web standard notification send rejected:', err);
    }
    return;
  }

  // Native Mobile Local Notifications
  try {
    const permStatus = await LocalNotifications.checkPermissions();
    if (permStatus.display !== 'granted') {
      const requested = await LocalNotifications.requestPermissions();
      if (requested.display !== 'granted') {
        console.warn('[Notifications] Permission denied on native handset device.');
        return;
      }
    }

    const notificationId = customId || Math.floor(Math.random() * 1000000);
    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id: notificationId,
          smallIcon: 'ic_stat_action_bell',
          sound: 'default',
          extra: {
            dispatchedAt: Date.now()
          }
        }
      ]
    });
    console.log(`[Notifications] Capacitor Local Notification deployed! ID: ${notificationId}`);
  } catch (err) {
    console.error('[Notifications] Failed to schedule device Local Notification:', err);
  }
};
