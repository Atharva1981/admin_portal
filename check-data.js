import admin from "firebase-admin";
import fs from "fs";

// Initialize Firebase Admin with service account
const serviceAccount = JSON.parse(fs.readFileSync("./govtjharkhand-14a5e-firebase-adminsdk-fbsvc-aac052be8e.json", "utf8"));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

console.log('🔍 Checking civic_issues collection data...\n');

try {
  const snapshot = await db.collection('civic_issues').limit(20).get();
  
  if (snapshot.empty) {
    console.log('❌ No documents found in civic_issues collection');
    console.log('You need to upload department mapping data first.\n');
  } else {
    console.log(`📊 Found ${snapshot.size} documents (showing first 20):\n`);
    
    const cities = new Set();
    const categories = new Set();
    const departments = new Set();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`📋 Doc ID: ${doc.id}`);
      console.log(`   City: ${data.city}`);
      console.log(`   Category: ${data.category}`);
      console.log(`   Department: ${data.department}`);
      console.log(`   Higher Authority: ${data.higher_authority}`);
      console.log(`   Status: ${data.status}\n`);
      
      if (data.city) cities.add(data.city);
      if (data.category) categories.add(data.category);
      if (data.department) departments.add(data.department);
    });
    
    console.log('📈 Summary:');
    console.log(`Cities: ${Array.from(cities).sort().join(', ')}`);
    console.log(`Categories: ${Array.from(categories).sort().join(', ')}`);
    console.log(`Departments: ${Array.from(departments).sort().join(', ')}\n`);
    
    // Test specific queries
    console.log('🧪 Testing specific queries:');
    
    // Test Infrastructure + Delhi
    const infraDelhiQuery = await db.collection('civic_issues')
      .where('category', '==', 'Infrastructure')
      .where('city', '==', 'Delhi')
      .limit(1)
      .get();
    
    console.log(`Infrastructure + Delhi: ${infraDelhiQuery.size} matches`);
    
    // Test Infrastructure (category only)
    const infraQuery = await db.collection('civic_issues')
      .where('category', '==', 'Infrastructure')
      .limit(1)
      .get();
    
    console.log(`Infrastructure (any city): ${infraQuery.size} matches`);
    
    // Test Delhi (city only)
    const delhiQuery = await db.collection('civic_issues')
      .where('city', '==', 'Delhi')
      .limit(1)
      .get();
    
    console.log(`Delhi (any category): ${delhiQuery.size} matches`);
  }
} catch (error) {
  console.error('❌ Error checking data:', error);
}

process.exit(0);
