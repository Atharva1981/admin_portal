import admin from "firebase-admin";
import fs from "fs";

async function testAuth() {
  try {
    // Initialize Firebase Admin with service account
    const serviceAccount = JSON.parse(fs.readFileSync("./govtjharkhand-14a5e-firebase-adminsdk-fbsvc-aac052be8e.json", "utf8"));

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: "govtjharkhand-14a5e"
    });

    const db = admin.firestore();
    
    // Test connection by trying to write a simple document
    console.log("🔍 Testing Firebase connection...");
    
    const testDoc = {
      test: true,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      message: "Authentication test"
    };
    
    await db.collection("civic_issues").doc("test_auth").set(testDoc);
    console.log("✅ Authentication successful! Test document created.");
    
    // Clean up test document
    await db.collection("civic_issues").doc("test_auth").delete();
    console.log("🧹 Test document cleaned up.");
    
  } catch (error) {
    console.error("❌ Authentication failed:", error.message);
    console.error("Error code:", error.code);
    console.error("Full error:", error);
  }
}

testAuth().then(() => process.exit(0));
