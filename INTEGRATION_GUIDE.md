# Integration Guide: Adding FCM Notifications to Your Existing App

This guide shows you how to integrate the notification system into your existing civic portal.

## Step 1: Update Your Main App Component

Add the NotificationProvider to your main App component:

```typescript
// src/App.tsx
import React from 'react';
import { NotificationProvider } from './components/Notifications/NotificationProvider';
import { AuthProvider } from './contexts/AuthContext';
import NotificationBell from './components/Notifications/NotificationBell';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <div className="App">
          {/* Your existing app content */}
          <Header />
          <MainContent />
        </div>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
```

## Step 2: Add Notification Bell to Your Header

```typescript
// src/components/Layout/Header.tsx
import React from 'react';
import NotificationBell from '../Notifications/NotificationBell';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold">Civic Portal</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Add notification bell here */}
            <NotificationBell />
            
            {/* Your existing header items */}
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
};
```

## Step 3: Integrate Status Manager in Admin Panel

```typescript
// src/components/Admin/ComplaintDetails.tsx
import React from 'react';
import ComplaintStatusManager from './ComplaintStatusManager';

const ComplaintDetails: React.FC<{ complaintId: string }> = ({ complaintId }) => {
  const [complaint, setComplaint] = useState(null);

  const handleStatusUpdate = () => {
    // Refresh complaint data
    fetchComplaintData();
  };

  return (
    <div className="space-y-6">
      {/* Existing complaint details */}
      <ComplaintInfo complaint={complaint} />
      
      {/* Add status manager */}
      <ComplaintStatusManager 
        complaint={complaint} 
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  );
};
```

## Step 4: Add Testing Component (Development Only)

```typescript
// src/components/Admin/AdminDashboard.tsx
import React from 'react';
import NotificationTester from '../Notifications/NotificationTester';

const AdminDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Your existing dashboard content */}
      <DashboardStats />
      <RecentComplaints />
      
      {/* Add tester in development mode */}
      {process.env.NODE_ENV === 'development' && (
        <NotificationTester />
      )}
    </div>
  );
};
```

## Step 5: Update Firebase Configuration

1. **Add VAPID Key to FCM Service:**
```typescript
// src/services/fcmService.ts
// Line 21: Replace YOUR_VAPID_KEY with actual key from Firebase Console
private vapidKey = 'BK8x...your-actual-vapid-key...xyz';
```

2. **Update Service Worker Config:**
```javascript
// public/firebase-messaging-sw.js
// Lines 6-12: Replace with your Firebase config
firebase.initializeApp({
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
});
```

## Step 6: Deploy Cloud Functions

```bash
# Navigate to functions directory
cd functions

# Install dependencies
npm install

# Deploy to Firebase
firebase deploy --only functions

# Set app URL for functions
firebase functions:config:set app.url="https://your-app-domain.com"
```

## Step 7: Test the Integration

1. **Enable notifications** using the notification bell
2. **Test individual notifications** using the NotificationTester component
3. **Test full workflow** by:
   - Creating a complaint (should trigger confirmation)
   - Assigning it via admin panel (should trigger acknowledgment)
   - Resolving it via admin panel (should trigger resolution)

## Step 8: Production Checklist

- [ ] Replace placeholder VAPID key with real key
- [ ] Update Firebase configuration in service worker
- [ ] Deploy Cloud Functions
- [ ] Add notification icons to `/public/icons/`
- [ ] Test on HTTPS domain (required for FCM)
- [ ] Remove NotificationTester from production builds
- [ ] Set up proper Firestore security rules
- [ ] Configure domain authorization in Firebase Console

## Example Usage in Your Existing Components

### When User Submits Complaint:
```typescript
// In your complaint submission handler
import notificationService from '../services/notificationService';

const handleSubmitComplaint = async (complaintData) => {
  // Save complaint to database
  const complaintId = await saveComplaint(complaintData);
  
  // Trigger confirmation notification
  await notificationService.submitComplaint(complaintId, userId);
};
```

### When Admin Assigns Complaint:
```typescript
// In your admin assignment handler
import notificationService from '../services/notificationService';

const handleAssignComplaint = async (complaintId, staffId, department) => {
  // Trigger acknowledgment notification
  await notificationService.assignComplaint(
    complaintId,
    staffId,
    department,
    currentAdminId,
    'Your complaint has been assigned to our team'
  );
};
```

### When Staff Resolves Complaint:
```typescript
// In your resolution handler
import notificationService from '../services/notificationService';

const handleResolveComplaint = async (complaintId, resolutionNotes) => {
  // Trigger resolution notification
  await notificationService.resolveComplaint(
    complaintId,
    currentStaffId,
    resolutionNotes
  );
};
```

## Troubleshooting Common Issues

1. **Notifications not appearing:**
   - Check browser notification permissions
   - Verify VAPID key is correct
   - Ensure app is served over HTTPS

2. **Service worker not registering:**
   - Check console for errors
   - Verify firebase-messaging-sw.js is in public folder
   - Clear browser cache and reload

3. **Cloud Functions not triggering:**
   - Check function deployment status
   - Verify Firestore security rules
   - Check function logs: `firebase functions:log`

4. **Token registration failing:**
   - Ensure Firebase project is properly configured
   - Check domain authorization in Firebase Console
   - Verify messaging is enabled in Firebase

Your notification system is now fully integrated! Users will automatically receive notifications at each stage of the complaint lifecycle.
