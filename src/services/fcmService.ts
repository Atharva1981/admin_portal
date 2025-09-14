import { getMessaging, getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { doc, setDoc, updateDoc, getDoc, collection, addDoc, Timestamp } from 'firebase/firestore';
import { userDb } from '../config/firebase';

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
}

export interface FCMTokenData {
  userId: string;
  token: string;
  deviceType: 'web' | 'android' | 'ios';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
}

export interface NotificationLog {
  id?: string;
  userId: string;
  complaintId: string;
  type: 'confirmation' | 'acknowledgment' | 'resolution';
  title: string;
  body: string;
  sentAt: Timestamp;
  status: 'sent' | 'failed' | 'delivered';
  fcmToken?: string;
}

class FCMService {
  private messaging: any;
  private vapidKey = 'YOUR_VAPID_KEY'; // You need to get this from Firebase Console

  constructor() {
    if (typeof window !== 'undefined') {
      this.messaging = getMessaging();
    }
  }

  /**
   * Request notification permission and get FCM token
   */
  async requestPermissionAndGetToken(userId: string): Promise<string | null> {
    try {
      if (!this.messaging) {
        console.warn('FCM not available in this environment');
        return null;
      }

      // Request permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return null;
      }

      // Get FCM token
      const token = await getToken(this.messaging, {
        vapidKey: this.vapidKey
      });

      if (token) {
        // Save token to Firestore
        await this.saveTokenToFirestore(userId, token);
        console.log('✅ FCM token obtained and saved:', token);
        return token;
      } else {
        console.log('No registration token available');
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Save FCM token to Firestore
   */
  private async saveTokenToFirestore(userId: string, token: string): Promise<void> {
    try {
      const tokenData: FCMTokenData = {
        userId,
        token,
        deviceType: 'web',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        isActive: true
      };

      const tokenRef = doc(userDb, 'fcmTokens', `${userId}_web`);
      await setDoc(tokenRef, tokenData, { merge: true });
      
      console.log('✅ FCM token saved to Firestore');
    } catch (error) {
      console.error('❌ Error saving FCM token:', error);
    }
  }

  /**
   * Listen for foreground messages
   */
  setupForegroundMessageListener(callback: (payload: MessagePayload) => void): void {
    if (!this.messaging) return;

    onMessage(this.messaging, (payload) => {
      console.log('📱 Received foreground message:', payload);
      
      // Show notification if app is in foreground
      if (payload.notification) {
        this.showLocalNotification(payload.notification);
      }
      
      callback(payload);
    });
  }

  /**
   * Show local notification
   */
  private showLocalNotification(notification: any): void {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(notification.title || 'New Notification', {
          body: notification.body,
          icon: notification.icon || '/notification-icon.png',
          badge: notification.badge || '/badge-icon.png',
          tag: 'civic-complaint',
          requireInteraction: true,
          actions: [
            {
              action: 'view',
              title: 'View Details'
            },
            {
              action: 'dismiss',
              title: 'Dismiss'
            }
          ]
        });
      });
    }
  }

  /**
   * Send notification via backend (you'll need to implement the backend endpoint)
   */
  async sendNotification(
    userId: string,
    complaintId: string,
    type: 'confirmation' | 'acknowledgment' | 'resolution',
    payload: NotificationPayload
  ): Promise<boolean> {
    try {
      // Get user's FCM token
      const tokenRef = doc(userDb, 'fcmTokens', `${userId}_web`);
      const tokenDoc = await getDoc(tokenRef);
      
      if (!tokenDoc.exists()) {
        console.log('No FCM token found for user:', userId);
        return false;
      }

      const tokenData = tokenDoc.data() as FCMTokenData;
      
      if (!tokenData.isActive) {
        console.log('FCM token is inactive for user:', userId);
        return false;
      }

      // Log notification attempt
      const notificationLog: NotificationLog = {
        userId,
        complaintId,
        type,
        title: payload.title,
        body: payload.body,
        sentAt: Timestamp.now(),
        status: 'sent',
        fcmToken: tokenData.token
      };

      // In a real implementation, you would call your backend API here
      // For now, we'll just log the notification
      await this.logNotification(notificationLog);
      
      console.log('📤 Notification sent:', payload.title);
      return true;
      
    } catch (error) {
      console.error('❌ Error sending notification:', error);
      
      // Log failed notification
      const failedLog: NotificationLog = {
        userId,
        complaintId,
        type,
        title: payload.title,
        body: payload.body,
        sentAt: Timestamp.now(),
        status: 'failed'
      };
      
      await this.logNotification(failedLog);
      return false;
    }
  }

  /**
   * Log notification to Firestore
   */
  private async logNotification(log: NotificationLog): Promise<void> {
    try {
      const logsRef = collection(userDb, 'notificationLogs');
      await addDoc(logsRef, log);
    } catch (error) {
      console.error('❌ Error logging notification:', error);
    }
  }

  /**
   * Generate notification content based on type and complaint data
   */
  generateNotificationContent(
    type: 'confirmation' | 'acknowledgment' | 'resolution',
    complaintData: any
  ): NotificationPayload {
    const { complaintId, category, description } = complaintData;
    
    switch (type) {
      case 'confirmation':
        return {
          title: '✅ Complaint Submitted Successfully',
          body: `Your ${category} complaint (#${complaintId}) has been received and is being processed.`,
          icon: '/icons/confirmation.png',
          data: {
            complaintId,
            type: 'confirmation',
            action: 'view_complaint'
          }
        };
        
      case 'acknowledgment':
        return {
          title: '🔄 Complaint Acknowledged',
          body: `Your ${category} complaint (#${complaintId}) has been assigned and is now in progress.`,
          icon: '/icons/in-progress.png',
          data: {
            complaintId,
            type: 'acknowledgment',
            action: 'view_progress'
          }
        };
        
      case 'resolution':
        return {
          title: '✨ Complaint Resolved',
          body: `Great news! Your ${category} complaint (#${complaintId}) has been resolved.`,
          icon: '/icons/resolved.png',
          data: {
            complaintId,
            type: 'resolution',
            action: 'view_resolution'
          }
        };
        
      default:
        return {
          title: 'Complaint Update',
          body: `Your complaint (#${complaintId}) has been updated.`,
          icon: '/icons/notification.png',
          data: { complaintId }
        };
    }
  }

  /**
   * Remove FCM token (when user logs out)
   */
  async removeToken(userId: string): Promise<void> {
    try {
      const tokenRef = doc(userDb, 'fcmTokens', `${userId}_web`);
      await updateDoc(tokenRef, {
        isActive: false,
        updatedAt: Timestamp.now()
      });
      
      console.log('✅ FCM token deactivated');
    } catch (error) {
      console.error('❌ Error removing FCM token:', error);
    }
  }
}

export default new FCMService();
