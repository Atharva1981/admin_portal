import admin from "firebase-admin";
import fs from "fs";
import csv from "csv-parser";

// Initialize Firebase Admin with service account
const serviceAccount = JSON.parse(fs.readFileSync("./govtjharkhand-14a5e-firebase-adminsdk-fbsvc-aac052be8e.json", "utf8"));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Path to your CSV
const csvFilePath = "chinmayy.csv";

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
      if (!row.city || !row.category) {
        console.log(`⏭️ Skipping row ${i}: Missing city or category`);
        continue;
      }
      
      try {
        // Create a unique document ID using city + category + pincode + index
        const cleanCategory = row.category.replace(/[^a-zA-Z0-9]/g, '_');
        const docId = `${row.city}_${cleanCategory}_${row.pincode || '000000'}_${i}`;
        
        // Upload to Firestore with proper structure
        const docRef = db.collection("civic_issues").doc(docId);
        await docRef.set({
          city: row.city,
          category: row.category,
          pincode: row.pincode || '000000',
          department: row.department || 'Not specified',
          higher_authority: row.higher_authority || 'Not specified',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          status: "active" // default status
        });
        
        uploadCount++;
        console.log(`✅ Uploaded: ${row.city} - ${row.category} (${uploadCount})`);
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
    console.error("❌ Error reading CSV file:", error);
    process.exit(1);
  });
