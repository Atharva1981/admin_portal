import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Admin Firebase Configuration (for admin operations)
const adminFirebaseConfig = {
  apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // Replace with your admin project API key
  authDomain: "govtjharkhand-14a5e.firebaseapp.com",
  projectId: "govtjharkhand-14a5e",
  storageBucket: "govtjharkhand-14a5e.appspot.com",
  messagingSenderId: "518630567706",
  appId: "1:518630567706:web:xxxxxxxxxxxxxxxxxxxxxxxx" // Replace with your admin project App ID
};

// User-side Firebase Configuration (for reading complaints)
const firebaseConfigUser = {
  apiKey: "AIzaSyBum8jyamgaUDrdk4Kxl3z-k7HVoT4n714",
  authDomain: "sih-2025-83f30.firebaseapp.com",
  projectId: "sih-2025-83f30",
  storageBucket: "sih-2025-83f30.firebasestorage.app",
  messagingSenderId: "321192723603",
  appId: "1:321192723603:web:7b0596c36866efbd8fb966",
  measurementId: "G-4XMH6G2MNH"
};

// Initialize Admin Firebase App
let adminApp;
try {
  adminApp = getApp('adminApp');
} catch (error) {
  adminApp = initializeApp(adminFirebaseConfig, 'adminApp');
}

// Initialize User Firebase App
let userApp;
try {
  userApp = getApp('userApp');
} catch (error) {
  userApp = initializeApp(firebaseConfigUser, 'userApp');
}

// Get Firestore instances
export const adminDb = getFirestore(adminApp);
export const userDb = getFirestore(userApp);

// Get Auth instances
export const adminAuth = getAuth(adminApp);
export const userAuth = getAuth(userApp);

// Development mode - connect to emulators if needed
if (import.meta.env.MODE === 'development') {
  // Uncomment these lines if you want to use Firebase emulators
  // connectFirestoreEmulator(adminDb, 'localhost', 8080);
  // connectFirestoreEmulator(userDb, 'localhost', 8081);
  // connectAuthEmulator(adminAuth, 'http://localhost:9099');
  // connectAuthEmulator(userAuth, 'http://localhost:9100');
}

export { adminApp, userApp };
export default { adminDb, userDb, adminAuth, userAuth };