# Flutter App FCM Notification Integration Guide

This guide explains how to integrate the FCM notification system with your Flutter user app while using this admin web portal for status management.

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Flutter App   │    │  Firebase Cloud  │    │  Admin Portal   │
│  (User Mobile)  │    │   Functions      │    │   (Web Admin)   │
│                 │    │                  │    │                 │
│ • FCM Tokens    │◄──►│ • Auto Triggers  │◄──►│ • Status Mgmt   │
│ • Notifications │    │ • Send Messages  │    │ • Manual Sends  │
│ • User Actions  │    │ • Token Storage  │    │ • Analytics     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Admin Portal Role

The admin portal (this web app) will:
- ✅ **Update complaint status** using `complaintStatusService.ts`
- ✅ **Trigger Cloud Functions** that send notifications to Flutter app
- ✅ **Manage complaint lifecycle** (assign, resolve, etc.)
- ✅ **View notification logs** and analytics

## Flutter App Setup

### 1. Add FCM Dependencies

```yaml
# pubspec.yaml
dependencies:
  firebase_core: ^2.24.2
  firebase_messaging: ^14.7.10
  flutter_local_notifications: ^16.3.2
```

### 2. Initialize Firebase in Flutter

```dart
// main.dart
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  
  // Initialize FCM
  await FirebaseMessaging.instance.requestPermission();
  
  runApp(MyApp());
}
```

### 3. FCM Token Management

```dart
// services/fcm_service.dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class FCMService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Get and save FCM token
  static Future<void> initializeFCM(String userId) async {
    // Request permission
    NotificationSettings settings = await _messaging.requestPermission();
    
    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      // Get FCM token
      String? token = await _messaging.getToken();
      
      if (token != null) {
        // Save token to Firestore (same collection as web app)
        await _firestore.collection('fcmTokens').doc('${userId}_mobile').set({
          'userId': userId,
          'token': token,
          'deviceType': 'mobile',
          'platform': Platform.isIOS ? 'ios' : 'android',
          'createdAt': FieldValue.serverTimestamp(),
          'updatedAt': FieldValue.serverTimestamp(),
          'isActive': true,
        });
      }
    }
  }

  // Listen for foreground messages
  static void setupForegroundListener() {
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      // Handle foreground notifications
      _showLocalNotification(message);
    });
  }

  // Handle notification taps
  static void setupNotificationTapHandler() {
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      // Navigate to complaint details
      String? complaintId = message.data['complaintId'];
      if (complaintId != null) {
        // Navigate to complaint screen
        navigateToComplaint(complaintId);
      }
    });
  }
}
```

### 4. Local Notifications Setup

```dart
// services/local_notification_service.dart
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class LocalNotificationService {
  static final FlutterLocalNotificationsPlugin _notifications = 
      FlutterLocalNotificationsPlugin();

  static Future<void> initialize() async {
    const AndroidInitializationSettings androidSettings = 
        AndroidInitializationSettings('@mipmap/ic_launcher');
    
    const DarwinInitializationSettings iosSettings = 
        DarwinInitializationSettings();

    const InitializationSettings settings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _notifications.initialize(settings);
  }

  static Future<void> showNotification(RemoteMessage message) async {
    const AndroidNotificationDetails androidDetails = 
        AndroidNotificationDetails(
      'civic_complaints',
      'Civic Complaints',
      channelDescription: 'Notifications for civic complaint updates',
      importance: Importance.high,
      priority: Priority.high,
    );

    const NotificationDetails details = NotificationDetails(
      android: androidDetails,
      iOS: DarwinNotificationDetails(),
    );

    await _notifications.show(
      message.hashCode,
      message.notification?.title ?? 'Complaint Update',
      message.notification?.body ?? 'Your complaint has been updated',
      details,
    );
  }
}
```

## Admin Portal Integration

### 1. Use Existing Services

The admin portal already has all necessary services:

```typescript
// Use these services in your admin components:
import notificationService from '../services/notificationService';
import complaintStatusService from '../services/complaintStatusService';

// When admin assigns complaint:
await notificationService.assignComplaint(
  complaintId,
  staffId,
  department,
  adminId,
  'Your complaint has been assigned to our team'
);

// When admin resolves complaint:
await notificationService.resolveComplaint(
  complaintId,
  staffId,
  'Issue has been resolved. Thank you for reporting!'
);
```

### 2. Admin Dashboard Integration

```typescript
// Add to existing admin components
import ComplaintStatusManager from '../components/Admin/ComplaintStatusManager';

// In your complaint details page:
<ComplaintStatusManager 
  complaint={selectedComplaint} 
  onStatusUpdate={() => refreshComplaintData()}
/>
```

## Cloud Functions (Already Created)

The Cloud Functions in `/functions/index.js` will automatically:
- ✅ Detect status changes in Firestore
- ✅ Send notifications to both web and mobile tokens
- ✅ Log notification delivery
- ✅ Handle failed deliveries

## Testing the Integration

### 1. Test Flutter App Notifications

```dart
// Add to your Flutter app for testing
class NotificationTestScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Test Notifications')),
      body: Column(
        children: [
          ElevatedButton(
            onPressed: () async {
              // Test token registration
              await FCMService.initializeFCM('test-user-id');
            },
            child: Text('Register for Notifications'),
          ),
          ElevatedButton(
            onPressed: () {
              // Test local notification
              LocalNotificationService.showNotification(
                // Create test RemoteMessage
              );
            },
            child: Text('Test Local Notification'),
          ),
        ],
      ),
    );
  }
}
```

### 2. Test from Admin Portal

1. Open admin portal
2. Navigate to complaint management
3. Use `ComplaintStatusManager` to assign/resolve complaints
4. Check Flutter app receives notifications

## Notification Flow

```
1. User submits complaint in Flutter app
   ↓
2. Flutter app calls Firebase to create complaint
   ↓
3. Cloud Function triggers → sends "Confirmation" notification
   ↓
4. Admin sees complaint in web portal
   ↓
5. Admin assigns complaint using ComplaintStatusManager
   ↓
6. Cloud Function triggers → sends "Acknowledgment" notification
   ↓
7. Admin resolves complaint
   ↓
8. Cloud Function triggers → sends "Resolution" notification
```

## Database Collections

Both apps share these Firestore collections:

```typescript
// complaints - User complaints
{
  complaintId: string,
  userId: string,
  status: 'submitted' | 'in-progress' | 'resolved',
  category: string,
  description: string,
  // ... other fields
}

// fcmTokens - Device tokens
{
  "userId_mobile": {
    userId: string,
    token: string,
    deviceType: 'mobile',
    platform: 'ios' | 'android',
    isActive: boolean
  }
}

// notificationLogs - Delivery tracking
{
  userId: string,
  complaintId: string,
  type: 'confirmation' | 'acknowledgment' | 'resolution',
  sentAt: timestamp,
  status: 'sent' | 'delivered' | 'failed'
}
```

## Deployment Steps

1. **Deploy Cloud Functions** (already created):
   ```bash
   cd functions
   firebase deploy --only functions
   ```

2. **Configure Flutter app** with Firebase
3. **Test notification flow** end-to-end
4. **Monitor logs** in Firebase Console

The admin portal is ready to send notifications to your Flutter app. The Cloud Functions will automatically handle the notification delivery when admins update complaint status through the web interface.
