import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import fs from 'fs';
import csv from 'csv-parser';

// Firebase configuration (using client SDK instead of admin SDK)
const firebaseConfig = {
  apiKey: "AIzaSyAfcg3SH18uTmWdSsLloBlPCpdwUo9RSkE",
  authDomain: "govtjharkhand-14a5e.firebaseapp.com",
  projectId: "govtjharkhand-14a5e",
  storageBucket: "govtjharkhand-14a5e.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Path to your CSV
const csvFilePath = "chinmayyy 5.csv";

let uploadCount = 0;
let errorCount = 0;

console.log(`📁 Reading CSV file: ${csvFilePath}`);

const rows = [];

fs.createReadStream(csvFilePath)
  .pipe(csv())
  .on("data", (row) => {
    rows.push(row);
  })
  .on("end", async () => {
    console.log(`📊 Processing ${rows.length} rows...`);
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      // Skip rows with missing essential data
      if (!row.city) {
        console.log(`⏭️ Skipping row ${i}: Missing city`);
        continue;
      }
      
      // Set default category if missing
      const category = row.category || 'General';
      
      try {
        // Upload to Firestore with proper structure
        const docData = {
          city: row.city,
          category: category,
          pincode: row.pincode || '000000',
          department: row.department || 'Not specified',
          higher_authority: row.higher_authority || 'Not specified',
          createdAt: serverTimestamp(),
          status: "active" // default status
        };
        
        await addDoc(collection(db, "civic_issues"), docData);
        
        uploadCount++;
        console.log(`✅ Uploaded: ${row.city} - ${category} (${uploadCount})`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Error uploading row ${i}:`, error.message);
      }
    }
    
    console.log(`\n🎉 CSV upload completed!`);
    console.log(`✅ Successfully uploaded: ${uploadCount} records`);
    console.log(`❌ Errors: ${errorCount} records`);
    process.exit(0);
  })
  .on("error", (error) => {
    console.error("❌ Error reading CSV file:", error.message);
    process.exit(1);
  });
