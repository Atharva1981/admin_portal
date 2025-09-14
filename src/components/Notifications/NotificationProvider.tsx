import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { MessagePayload } from 'firebase/messaging';
import notificationService from '../../services/notificationService';
import { useAuth } from '../../contexts/AuthContext';

interface NotificationContextType {
  isEnabled: boolean;
  permissionStatus: NotificationPermission;
  enableNotifications: () => Promise<boolean>;
  sendTestNotification: (type: 'confirmation' | 'acknowledgment' | 'resolution') => Promise<void>;
  inAppNotifications: InAppNotification[];
  dismissNotification: (id: string) => void;
}

interface InAppNotification {
  id: string;
  title: string;
  body: string;
  type: 'confirmation' | 'acknowledgment' | 'resolution' | 'info';
  timestamp: Date;
  complaintId?: string;
  isRead: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [inAppNotifications, setInAppNotifications] = useState<InAppNotification[]>([]);

  useEffect(() => {
    if (user?.uid) {
      initializeNotifications();
      setupMessageListener();
    }
  }, [user]);

  const initializeNotifications = async () => {
    if (!user?.uid) return;

    try {
      // Check current permission status
      const permission = Notification.permission;
      setPermissionStatus(permission);

      if (permission === 'granted') {
        const token = await notificationService.setupUserNotifications(user.uid);
        setIsEnabled(!!token);
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  };

  const setupMessageListener = () => {
    // Listen for custom notification events from service worker
    const handleNotification = (event: CustomEvent) => {
      const { title, body, data } = event.detail;
      
      addInAppNotification({
        title,
        body,
        type: data?.type || 'info',
        complaintId: data?.complaintId
      });
    };

    window.addEventListener('civic-notification', handleNotification as EventListener);

    return () => {
      window.removeEventListener('civic-notification', handleNotification as EventListener);
    };
  };

  const enableNotifications = async (): Promise<boolean> => {
    if (!user?.uid) return false;

    try {
      const token = await notificationService.setupUserNotifications(user.uid);
      const success = !!token;
      
      setIsEnabled(success);
      setPermissionStatus(success ? 'granted' : 'denied');
      
      if (success) {
        addInAppNotification({
          title: '🔔 Notifications Enabled',
          body: 'You will now receive updates about your complaints',
          type: 'info'
        });
      }
      
      return success;
    } catch (error) {
      console.error('Error enabling notifications:', error);
      return false;
    }
  };

  const sendTestNotification = async (type: 'confirmation' | 'acknowledgment' | 'resolution') => {
    if (!user?.uid) return;

    try {
      await notificationService.sendTestNotification(user.uid, type);
      
      addInAppNotification({
        title: '🧪 Test Notification Sent',
        body: `Test ${type} notification has been sent`,
        type: 'info'
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  };

  const addInAppNotification = (notification: Omit<InAppNotification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotification: InAppNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      isRead: false
    };

    setInAppNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Keep only 10 notifications
  };

  const dismissNotification = (id: string) => {
    setInAppNotifications(prev => prev.filter(n => n.id !== id));
  };

  const value: NotificationContextType = {
    isEnabled,
    permissionStatus,
    enableNotifications,
    sendTestNotification,
    inAppNotifications,
    dismissNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
