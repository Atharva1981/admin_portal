# Firebase Cloud Messaging (FCM) Notification Setup Guide

This guide explains how to implement push notifications for your Civic Issue Reporting & Resolution app using Firebase Cloud Messaging (FCM).

## Overview

The notification system triggers at 3 key stages:
1. **Confirmation** - When complaint is first submitted (status: `submitted`)
2. **Acknowledgment** - When complaint is assigned (status: `in-progress`)  
3. **Resolution** - When complaint is resolved (status: `resolved`)

## Setup Steps

### 1. Firebase Configuration

#### Update Firebase Config
Replace the placeholder values in `/public/firebase-messaging-sw.js`:

```javascript
firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN", 
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
});
```

#### Get VAPID Key
1. Go to Firebase Console → Project Settings → Cloud Messaging
2. Generate a new Web Push certificate
3. Copy the VAPID key and update in `/src/services/fcmService.ts`:

```typescript
private vapidKey = 'YOUR_VAPID_KEY_HERE';
```

### 2. Install Dependencies

```bash
npm install firebase
```

### 3. Deploy Cloud Functions

```bash
cd functions
npm install
firebase deploy --only functions
```

### 4. Set Firebase Config for Functions

```bash
firebase functions:config:set app.url="https://your-app-domain.com"
```

## Usage Examples

### Basic Integration

#### 1. Setup Notifications on User Login

```typescript
import notificationService from './services/notificationService';

// When user logs in
async function onUserLogin(userId: string) {
  const token = await notificationService.setupUserNotifications(userId);
  if (token) {
    console.log('Notifications enabled for user:', userId);
  }
}
```

#### 2. Submit New Complaint (Triggers Confirmation)

```typescript
import notificationService from './services/notificationService';

async function submitComplaint(complaintData: any) {
  // Save complaint to database first
  const complaintId = await saveComplaintToDatabase(complaintData);
  
  // Trigger confirmation notification
  await notificationService.submitComplaint(complaintId, complaintData.userId);
}
```

#### 3. Assign Complaint (Triggers Acknowledgment)

```typescript
import notificationService from './services/notificationService';

async function assignComplaintToStaff(complaintId: string, staffId: string, department: string) {
  await notificationService.assignComplaint(
    complaintId,
    staffId,
    department,
    'admin-user-id',
    'Complaint has been assigned to our team for resolution'
  );
}
```

#### 4. Resolve Complaint (Triggers Resolution)

```typescript
import notificationService from './services/notificationService';

async function resolveComplaint(complaintId: string, resolutionDetails: string) {
  await notificationService.resolveComplaint(
    complaintId,
    'staff-user-id',
    resolutionDetails
  );
}
```

### Advanced Usage

#### Custom Status Updates

```typescript
import notificationService from './services/notificationService';

// Update status without triggering standard notifications
await notificationService.updateStatusAndNotify(
  'complaint-123',
  'in-progress',
  'admin-id',
  {
    assignedTo: 'john-doe',
    department: 'Public Works',
    notes: 'Escalated to senior engineer'
  }
);
```

#### Manual Notifications via Cloud Function

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const sendCustomNotification = httpsCallable(functions, 'sendCustomNotification');

await sendCustomNotification({
  userId: 'user-123',
  complaintId: 'complaint-456',
  title: 'Important Update',
  body: 'Your complaint requires additional information',
  type: 'info'
});
```

#### Test Notifications (Development)

```typescript
import notificationService from './services/notificationService';

// Test different notification types
await notificationService.sendTestNotification('user-id', 'confirmation');
await notificationService.sendTestNotification('user-id', 'acknowledgment');
await notificationService.sendTestNotification('user-id', 'resolution');
```

## React Component Integration

### Notification Permission Component

```typescript
import React, { useEffect, useState } from 'react';
import notificationService from '../services/notificationService';

const NotificationSetup: React.FC<{ userId: string }> = ({ userId }) => {
  const [permissionStatus, setPermissionStatus] = useState<string>('default');

  useEffect(() => {
    // Setup notifications when component mounts
    setupNotifications();
    
    // Listen for custom notification events
    const handleNotification = (event: CustomEvent) => {
      // Handle in-app notifications
      showToast(event.detail.title, event.detail.body);
    };
    
    window.addEventListener('civic-notification', handleNotification as EventListener);
    
    return () => {
      window.removeEventListener('civic-notification', handleNotification as EventListener);
    };
  }, [userId]);

  const setupNotifications = async () => {
    try {
      const token = await notificationService.setupUserNotifications(userId);
      setPermissionStatus(token ? 'granted' : 'denied');
    } catch (error) {
      console.error('Error setting up notifications:', error);
      setPermissionStatus('error');
    }
  };

  const requestPermission = async () => {
    await setupNotifications();
  };

  if (permissionStatus === 'granted') {
    return (
      <div className="notification-status success">
        ✅ Notifications enabled
      </div>
    );
  }

  return (
    <div className="notification-setup">
      <button onClick={requestPermission}>
        Enable Notifications
      </button>
    </div>
  );
};

export default NotificationSetup;
```

### Admin Panel Integration

```typescript
import React from 'react';
import notificationService from '../services/notificationService';

const AdminComplaintActions: React.FC<{ complaint: any }> = ({ complaint }) => {
  const handleAssign = async (staffId: string, department: string) => {
    try {
      await notificationService.assignComplaint(
        complaint.id,
        staffId,
        department,
        'current-admin-id'
      );
      alert('Complaint assigned and user notified!');
    } catch (error) {
      console.error('Error assigning complaint:', error);
    }
  };

  const handleResolve = async (resolutionNotes: string) => {
    try {
      await notificationService.resolveComplaint(
        complaint.id,
        'current-admin-id',
        resolutionNotes
      );
      alert('Complaint resolved and user notified!');
    } catch (error) {
      console.error('Error resolving complaint:', error);
    }
  };

  return (
    <div className="admin-actions">
      <button onClick={() => handleAssign('staff-123', 'Public Works')}>
        Assign to Public Works
      </button>
      <button onClick={() => handleResolve('Issue has been fixed')}>
        Mark as Resolved
      </button>
    </div>
  );
};
```

## Database Structure

### FCM Tokens Collection (`fcmTokens`)

```typescript
{
  "userId_web": {
    userId: "user-123",
    token: "fcm-token-string",
    deviceType: "web",
    createdAt: Timestamp,
    updatedAt: Timestamp,
    isActive: true
  }
}
```

### Notification Logs Collection (`notificationLogs`)

```typescript
{
  userId: "user-123",
  complaintId: "complaint-456",
  type: "confirmation" | "acknowledgment" | "resolution",
  title: "Notification title",
  body: "Notification body",
  sentAt: Timestamp,
  status: "sent" | "failed" | "delivered",
  fcmToken: "fcm-token-string"
}
```

### Status History Collection (`statusHistory`)

```typescript
{
  complaintId: "complaint-456",
  previousStatus: "submitted",
  newStatus: "in-progress",
  updatedBy: "admin-123",
  updatedAt: Timestamp,
  notes: "Optional update notes"
}
```

## Troubleshooting

### Common Issues

1. **Notifications not received**
   - Check if user granted notification permission
   - Verify VAPID key is correct
   - Ensure service worker is registered

2. **Cloud Functions not triggering**
   - Check Firestore security rules
   - Verify function deployment
   - Check function logs: `firebase functions:log`

3. **Token registration fails**
   - Ensure HTTPS (required for FCM)
   - Check Firebase project configuration
   - Verify domain is authorized in Firebase Console

### Testing

```bash
# Test Cloud Functions locally
cd functions
npm run serve

# Deploy and test
firebase deploy --only functions
firebase functions:log --only onComplaintStatusChange
```

## Security Considerations

1. **Firestore Rules**: Ensure proper security rules for FCM tokens
2. **Authentication**: Verify user permissions before sending notifications
3. **Token Management**: Regularly clean up inactive tokens
4. **Data Privacy**: Don't include sensitive data in notification payload

## Performance Tips

1. **Batch Operations**: Use batched writes for multiple status updates
2. **Token Cleanup**: Implement automatic cleanup of old/invalid tokens
3. **Rate Limiting**: Implement rate limiting for notification sends
4. **Caching**: Cache frequently accessed complaint data

This completes your FCM notification system setup! The system will automatically handle the three notification stages and provide a robust foundation for user engagement.
