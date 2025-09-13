# Firebase Configuration Setup

This document explains how to configure Firebase for both admin and user-side projects in your civic portal application.

## Overview

The application uses two separate Firebase projects:
1. **Admin Project** (`govtjharkhand-14a5e`) - For admin operations and internal data
2. **User Project** - For reading complaints submitted by citizens

## Configuration Files

### 1. Admin Firebase Configuration
- **Service Account**: `govtjharkhand-14a5e-firebase-adminsdk-fbsvc-aac052be8e.json`
- **Project ID**: `govtjharkhand-14a5e`
- **Usage**: Admin operations, data management, internal issues

### 2. User Firebase Configuration
- **Location**: `src/config/firebase.ts`
- **Usage**: Reading complaints from user portal

## Setup Instructions

### Step 1: Create User-Side Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter project name: `user-civic-portal` (or your preferred name)
4. Enable Google Analytics (optional)
5. Click "Create project"

### Step 2: Enable Firestore for User Project

1. In your user project, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in production mode" (or test mode for development)
4. Select a location (preferably same as admin project)
5. Click "Done"

### Step 3: Get User Project Configuration

1. In your user project, go to "Project Settings" (gear icon)
2. Scroll down to "Your apps" section
3. Click "Add app" and select "Web" (</> icon)
4. Register your app with a nickname
5. Copy the Firebase configuration object

### Step 4: Update Configuration

Open `src/config/firebase.ts` and replace the placeholder values:

```typescript
const firebaseConfigUser = {
  apiKey: "your-api-key-here",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### Step 5: Set Up Firestore Security Rules

For the user project, set up security rules to allow reading complaints:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow reading complaints (for admin dashboard)
    match /complaints/{document} {
      allow read: if true; // Adjust based on your security needs
    }
  }
}
```

### Step 6: Create Sample Data Structure

In your user project's Firestore, create a collection called `complaints` with documents like:

```json
{
  "title": "Pothole on Main Street",
  "description": "Large pothole causing traffic issues",
  "category": "Road Damage",
  "priority": "High",
  "status": "Open",
  "location": {
    "address": "123 Main Street",
    "city": "Ranchi",
    "pincode": "834001",
    "coordinates": {
      "lat": 23.3441,
      "lng": 85.3096
    }
  },
  "user": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+91-9876543210"
  },
  "department": "Public Works",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

## Usage in Components

### Reading Complaints

```typescript
import { useComplaints } from '../hooks/useComplaints';

const MyComponent = () => {
  const { complaints, loading, error } = useComplaints();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {complaints.map(complaint => (
        <div key={complaint.id}>
          <h3>{complaint.title}</h3>
          <p>{complaint.description}</p>
        </div>
      ))}
    </div>
  );
};
```

### Filtering Complaints

```typescript
const { complaints } = useComplaints({
  status: 'Open',
  category: 'Road Damage',
  city: 'Ranchi'
});
```

## File Structure

```
src/
├── config/
│   └── firebase.ts          # Firebase configuration
├── services/
│   └── complaintService.ts  # Service for complaint operations
├── hooks/
│   └── useComplaints.ts     # React hook for complaints
└── components/
    └── Complaints/
        └── ComplaintsList.tsx # UI component for complaints
```

## Troubleshooting

### Common Issues

1. **Firebase not initialized**: Check if both projects are properly configured
2. **Permission denied**: Verify Firestore security rules
3. **No data**: Ensure complaints collection exists in user project
4. **CORS errors**: Check Firebase project settings

### Debug Mode

Enable debug logging by adding to your environment:

```typescript
// In firebase.ts
if (process.env.NODE_ENV === 'development') {
  console.log('Firebase initialized:', { adminApp, userApp });
}
```

## Security Considerations

1. **Admin Project**: Use service account for server-side operations
2. **User Project**: Use client SDK with appropriate security rules
3. **API Keys**: Never expose admin service account keys in client code
4. **Rules**: Implement proper Firestore security rules

## Next Steps

1. Configure your user Firebase project
2. Update the configuration in `firebase.ts`
3. Test the complaints loading functionality
4. Customize the UI components as needed
5. Implement additional features like real-time updates