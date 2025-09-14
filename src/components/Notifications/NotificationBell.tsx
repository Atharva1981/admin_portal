import React, { useState } from 'react';
import { Bell, BellOff, X, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useNotifications } from './NotificationProvider';

const NotificationBell: React.FC = () => {
  const { 
    isEnabled, 
    permissionStatus, 
    enableNotifications, 
    inAppNotifications, 
    dismissNotification 
  } = useNotifications();
  
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = inAppNotifications.filter(n => !n.isRead).length;

  const handleEnableNotifications = async () => {
    const success = await enableNotifications();
    if (success) {
      setIsOpen(true);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'confirmation':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'acknowledgment':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'resolution':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (permissionStatus === 'denied') {
    return (
      <div className="relative">
        <button
          onClick={handleEnableNotifications}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          title="Notifications are disabled"
        >
          <BellOff className="h-5 w-5" />
        </button>
      </div>
    );
  }

  if (!isEnabled) {
    return (
      <div className="relative">
        <button
          onClick={handleEnableNotifications}
          className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
          title="Enable notifications"
        >
          <Bell className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-600 hover:text-blue-600 transition-colors relative"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Notification Panel */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {inAppNotifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {inAppNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        !notification.isRead ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.body}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              {formatTime(notification.timestamp)}
                            </span>
                            {notification.complaintId && (
                              <span className="text-xs text-blue-600 font-medium">
                                #{notification.complaintId}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => dismissNotification(notification.id)}
                          className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {inAppNotifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => {
                    inAppNotifications.forEach(n => dismissNotification(n.id));
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
