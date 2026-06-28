import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { sendMobileNotification } from './mobileNotifications';

/**
 * Checks if the application is currently running as a native app wrap (Android/iOS)
 */
export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Initialises push notifications for the native wrap.
 * Requests native permission, registers the device, retrieves the native FCM Token and logs/sends it to the backend.
 */
export const initializePushNotifications = async (userId: string) => {
  if (!isNativePlatform()) {
    console.log('[PushNotifications] Not running on a native handset. Native push initialization skipped.');
    return;
  }

  try {
    let permStatus = await PushNotifications.checkPermissions();
    
    if (permStatus.receive !== 'granted') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive === 'granted') {
      // Register with FCM/APNS gateway
      await PushNotifications.register();
    } else {
      console.warn('[PushNotifications] Device push permission denied by handset user.');
    }

    // Success registration listener
    await PushNotifications.addListener('registration', async (token) => {
      console.log('[PushNotifications] Native FCM Token registered:', token.value);
      
      // Send the token to the node.js/server backend
      try {
        const response = await fetch('/api/notifications/register-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId
          },
          body: JSON.stringify({ token: token.value })
        });
        
        if (response.ok) {
          console.log('[PushNotifications] Server accepted and stored the FCM token.');
        } else {
          console.warn('[PushNotifications] Server rejected FCM token registration. Status:', response.status);
        }
      } catch (err) {
        console.error('[PushNotifications] Failed to transmit native FCM token to backend:', err);
      }
    });

    // Registration error listener
    await PushNotifications.addListener('registrationError', (error: any) => {
      console.error('[PushNotifications] FCM registration failed on device:', JSON.stringify(error));
    });

    // Foreground push notification event
    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[PushNotifications] Native Push Notification received in foreground:', notification);
      if (notification.title || notification.body) {
        sendMobileNotification(notification.title || "Game Alert", notification.body || "");
      }
    });

    // User action on notification
    await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('[PushNotifications] Push action clicked by user:', action);
    });

  } catch (err) {
    console.error('[PushNotifications] Native initialization sequence encountered an error:', err);
  }
};

/**
 * Establishes an SSE event-stream connection to the backend.
 * If this active connection is severed or breaks, the backend will fallback to push notifications.
 */
export const setupSSEConnection = (userId: string, onEvent: (data: { title: string; body: string }) => void): EventSource => {
  console.log(`[PushNotifications] Starting real-time active SSE session for: ${userId}`);
  
  // Use absolute URL or relative URL (Vite dev server or native builds will proxy appropriately)
  const eventSource = new EventSource(`/api/notifications/stream?userId=${encodeURIComponent(userId)}`);

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('[PushNotifications] Active SSE signal received:', data);
      onEvent(data);
    } catch (err) {
      console.error('[PushNotifications] SSE JSON parsing failed:', err);
    }
  };

  eventSource.onerror = (error) => {
    console.warn('[PushNotifications] SSE stream error or reconnection attempt in progress...', error);
  };

  return eventSource;
};
