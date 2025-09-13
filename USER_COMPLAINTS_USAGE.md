# User Complaints Service Usage Guide

This guide demonstrates how to use the `fetchUserComplaints` function to connect to the userApp Firestore instance and retrieve complaint data.

## 📋 Function Overview

The `fetchUserComplaints` function connects to the userApp Firestore instance and retrieves complaints from the `complaints` collection with the following fields:

- `complaintId` - Unique identifier for the complaint
- `category` - Type of complaint (Infrastructure, Sanitation, etc.)
- `city` - City where the complaint was reported
- `pincode` - Postal code of the location
- `description` - Detailed description of the complaint
- `createdAt` - Timestamp when the complaint was created
- `userId` - ID of the user who reported the complaint
- `userName` - Name of the user who reported the complaint
- `userPhone` - Phone number of the user
- `latitude` - Geographic latitude coordinate
- `longitude` - Geographic longitude coordinate
- `imageUrl` - URL of the complaint image

## 🚀 Basic Usage

### 1. Import the Function

```typescript
import { fetchUserComplaints } from '../services/userComplaintsService';
```

### 2. Fetch All Complaints

```typescript
// Fetch all complaints (limited to 50 by default)
const complaints = await fetchUserComplaints();

console.log(`Fetched ${complaints.length} complaints`);
complaints.forEach(complaint => {
  console.log(`${complaint.complaintId}: ${complaint.category} in ${complaint.city}`);
});
```

### 3. Fetch with Filters

```typescript
// Fetch complaints with specific filters
const filteredComplaints = await fetchUserComplaints({
  limitCount: 20,
  orderByField: 'createdAt',
  orderDirection: 'desc',
  filters: {
    category: 'Infrastructure',
    city: 'Delhi',
    status: 'open'
  }
});
```

### 4. Real-time Updates

```typescript
import { listenToUserComplaints } from '../services/userComplaintsService';

// Set up real-time listener
const unsubscribe = listenToUserComplaints((complaints) => {
  console.log(`Real-time update: ${complaints.length} complaints`);
  // Update your UI with the new data
}, {
  limitCount: 30,
  filters: { status: 'open' }
});

// Stop listening when done
unsubscribe();
```

## 🎯 React Hook Usage

### Using the useUserComplaints Hook

```typescript
import { useUserComplaints } from '../hooks/useUserComplaints';

const MyComponent = () => {
  const {
    complaints,
    loading,
    error,
    stats,
    fetchComplaints,
    refresh
  } = useUserComplaints({
    limitCount: 20,
    filters: { category: 'Infrastructure' }
  });

  if (loading) return <div>Loading complaints...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Complaints ({complaints.length})</h2>
      {complaints.map(complaint => (
        <div key={complaint.complaintId}>
          <h3>{complaint.category} - {complaint.city}</h3>
          <p>{complaint.description}</p>
          <p>Reported by: {complaint.userName}</p>
        </div>
      ))}
    </div>
  );
};
```

## 📊 Available Functions

### 1. fetchUserComplaints(options)
- **Purpose**: Fetch complaints with optional filtering and pagination
- **Returns**: Promise<UserComplaint[]>
- **Options**:
  - `limitCount`: Number of complaints to fetch (default: 50)
  - `orderByField`: Field to sort by (default: 'createdAt')
  - `orderDirection`: 'asc' or 'desc' (default: 'desc')
  - `filters`: Object with filter criteria

### 2. listenToUserComplaints(callback, options)
- **Purpose**: Set up real-time listener for complaints
- **Returns**: Unsubscribe function
- **Parameters**:
  - `callback`: Function called when data changes
  - `options`: Same as fetchUserComplaints

### 3. fetchUserComplaintById(complaintId)
- **Purpose**: Fetch a single complaint by ID
- **Returns**: Promise<UserComplaint | null>

### 4. getUserComplaintStats(filters)
- **Purpose**: Get statistics about complaints
- **Returns**: Promise with counts by category, city, status, priority

## 🔧 Filter Options

```typescript
interface ComplaintFilters {
  category?: string;      // 'Infrastructure', 'Sanitation', etc.
  city?: string;          // 'Delhi', 'Mountain View', etc.
  status?: string;        // 'open', 'in progress', 'resolved', 'closed'
  priority?: string;      // 'high', 'medium', 'low'
  department?: string;    // Department handling the complaint
  dateFrom?: Date;        // Start date for filtering
  dateTo?: Date;          // End date for filtering
}
```

## 📱 Example: Complete Component

```typescript
import React, { useState } from 'react';
import { fetchUserComplaints, UserComplaint } from '../services/userComplaintsService';

const ComplaintsDashboard = () => {
  const [complaints, setComplaints] = useState<UserComplaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const data = await fetchUserComplaints({
        limitCount: 30,
        filters
      });
      setComplaints(data);
    } catch (error) {
      console.error('Error loading complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [filters]);

  return (
    <div>
      <h1>User Complaints Dashboard</h1>
      
      {/* Filter Controls */}
      <div>
        <select 
          value={filters.category || ''} 
          onChange={(e) => setFilters({...filters, category: e.target.value})}
        >
          <option value="">All Categories</option>
          <option value="Infrastructure">Infrastructure</option>
          <option value="Sanitation">Sanitation</option>
        </select>
      </div>

      {/* Complaints List */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div>
          {complaints.map(complaint => (
            <div key={complaint.complaintId} className="complaint-card">
              <h3>{complaint.category} - {complaint.city}</h3>
              <p>{complaint.description}</p>
              <div>
                <strong>User:</strong> {complaint.userName} ({complaint.userPhone})
              </div>
              <div>
                <strong>Location:</strong> {complaint.latitude}, {complaint.longitude}
              </div>
              <div>
                <strong>Status:</strong> {complaint.status} | <strong>Priority:</strong> {complaint.priority}
              </div>
              {complaint.imageUrl && (
                <img src={complaint.imageUrl} alt="Complaint" style={{maxWidth: '200px'}} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

## 🧪 Testing the Function

To test the function in your admin dashboard:

1. **Start the development server**: `npm run dev`
2. **Navigate to Dashboard**: Go to your admin dashboard
3. **Click "User Test" tab**: This will show the test component
4. **View real data**: You'll see actual complaints from your Firebase project

## 🔍 Data Structure

Each complaint object contains:

```typescript
interface UserComplaint {
  complaintId: string;        // "1757755756502"
  category: string;           // "Infrastructure"
  city: string;              // "Mountain View"
  pincode: string;           // "94043"
  description: string;       // "Civic issue reported via mobile app..."
  createdAt: Timestamp;      // Firestore timestamp
  userId: string;            // "demo_user"
  userName: string;          // "Demo User"
  userPhone: string;         // "+1-555-1234"
  latitude: number;          // 37.4219983
  longitude: number;         // -122.084
  imageUrl: string;          // "https://demo-storage.com/issues/..."
  status?: string;           // "open"
  priority?: string;         // "medium"
  department?: string;       // "Roads & Infrastructure"
  address?: string;          // "Google Building 40, Mountain View..."
  ward?: string;             // "Mountain View"
  updatedAt?: Timestamp;     // Last update timestamp
}
```

## 🎉 Ready to Use!

The `fetchUserComplaints` function is now ready to use in your admin dashboard. It provides:

- ✅ Real-time data from userApp Firestore
- ✅ Flexible filtering and pagination
- ✅ TypeScript support
- ✅ Error handling
- ✅ React hooks for easy integration
- ✅ Statistics and analytics

Start using it in your components to display and manage user complaints! 🚀