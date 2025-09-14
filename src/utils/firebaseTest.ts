// Firebase Configuration Test Utility
// This file helps test if both Firebase configurations are working correctly

import { adminDb, userDb } from '../config/firebase';
import { collection, getDocs, limit } from 'firebase/firestore';

export const testFirebaseConnections = async () => {
  console.log('🔥 Testing Firebase connections...');
  
  const results = {
    adminConnection: false,
    userConnection: false,
    adminData: null,
    userData: null,
    errors: [] as string[]
  };

  // Test Admin Connection
  try {
    console.log('📊 Testing admin connection...');
    const adminSnapshot = await getDocs(collection(adminDb, 'civic_issues'));
    results.adminConnection = true;
    results.adminData = {
      collection: 'civic_issues',
      documentCount: adminSnapshot.size,
      sampleDocs: adminSnapshot.docs.slice(0, 3).map(doc => ({
        id: doc.id,
        data: doc.data()
      }))
    };
    console.log('✅ Admin connection successful');
  } catch (error) {
    results.errors.push(`Admin connection failed: ${error}`);
    console.error('❌ Admin connection failed:', error);
  }

  // Test User Connection
  try {
    console.log('👥 Testing user connection...');
    const userSnapshot = await getDocs(collection(userDb, 'complaints'));
    results.userConnection = true;
    results.userData = {
      collection: 'complaints',
      documentCount: userSnapshot.size,
      sampleDocs: userSnapshot.docs.slice(0, 3).map(doc => ({
        id: doc.id,
        data: doc.data()
      }))
    };
    console.log('✅ User connection successful');
  } catch (error) {
    results.errors.push(`User connection failed: ${error}`);
    console.error('❌ User connection failed:', error);
  }

  // Summary
  console.log('\n📋 Test Results:');
  console.log(`Admin Connection: ${results.adminConnection ? '✅' : '❌'}`);
  console.log(`User Connection: ${results.userConnection ? '✅' : '❌'}`);
  
  if (results.adminData) {
    console.log(`Admin Data: ${results.adminData.documentCount} documents in '${results.adminData.collection}'`);
  }
  
  if (results.userData) {
    console.log(`User Data: ${results.userData.documentCount} documents in '${results.userData.collection}'`);
  }
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(error => console.log(`  - ${error}`));
  }

  return results;
};

// Helper function to create sample complaint data
export const createSampleComplaint = () => {
  return {
    title: "Sample Complaint",
    description: "This is a test complaint created for testing purposes",
    category: "Test",
    priority: "Medium",
    status: "Open",
    location: {
      address: "Test Address",
      city: "Ranchi",
      pincode: "834001",
      coordinates: {
        lat: 23.3441,
        lng: 85.3096
      }
    },
    user: {
      name: "Test User",
      email: "test@example.com",
      phone: "+91-9876543210"
    },
    department: "Test Department",
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

// Usage in development
if (import.meta.env.MODE === 'development') {
  // Uncomment the line below to test Firebase connections on app load
  // testFirebaseConnections();
}