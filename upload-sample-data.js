import admin from "firebase-admin";
import fs from "fs";
import csv from "csv-parser";

// Initialize Firebase Admin with service account
const serviceAccount = JSON.parse(fs.readFileSync("./govtjharkhand-14a5e-firebase-adminsdk-fbsvc-aac052be8e.json", "utf8"));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Path to the sample CSV
const csvFilePath = "sample-departments.csv";

let uploadCount = 0;
let errorCount = 0;

console.log(`📁 Reading sample department data: ${csvFilePath}`);

const rows = [];

fs.createReadStream(csvFilePath)
  .pipe(csv())
  .on("data", (row) => {
    rows.push(row);
  })
  .on("end", async () => {
    console.log(`📊 Processing ${rows.length} department mappings...`);
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      // Skip rows with missing essential data
      if (!row.city || !row.category || !row.department) {
        console.log(`⏭️ Skipping row ${i}: Missing essential data`);
        continue;
      }
      
      try {
        // Create a unique document ID using city + category
        const cleanCity = row.city.replace(/[^a-zA-Z0-9]/g, '_');
        const cleanCategory = row.category.replace(/[^a-zA-Z0-9]/g, '_');
        const docId = `${cleanCity}_${cleanCategory}_${row.pincode || '000000'}`;
        
        // Upload to Firestore with proper structure
        const docRef = db.collection("civic_issues").doc(docId);
        await docRef.set({
          city: row.city.trim(),
          category: row.category.trim(),
          pincode: row.pincode?.trim() || '000000',
          department: row.department.trim(),
          higher_authority: row.higher_authority?.trim() || 'Not specified',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          status: "active" // default status
        });
        
        uploadCount++;
        console.log(`✅ Uploaded: ${row.city} - ${row.category} → ${row.department} (${uploadCount})`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Error uploading row ${i}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Sample data upload completed!`);
    console.log(`✅ Successfully uploaded: ${uploadCount} records`);
    console.log(`❌ Errors: ${errorCount} records`);
    
    // Test the mapping for Delhi Infrastructure
    console.log(`\n🧪 Testing Delhi + Infrastructure mapping...`);
    try {
      const testQuery = await db.collection('civic_issues')
        .where('category', '==', 'Infrastructure')
        .where('city', '==', 'Delhi')
        .limit(1)
        .get();
      
      if (!testQuery.empty) {
        const doc = testQuery.docs[0];
        const data = doc.data();
        console.log(`✅ Test successful!`);
        console.log(`   Department: ${data.department}`);
        console.log(`   Authority: ${data.higher_authority}`);
      } else {
        console.log(`❌ Test failed: No match found for Delhi + Infrastructure`);
      }
    } catch (error) {
      console.error(`❌ Test error:`, error);
    }
    
    process.exit(0);
  })
  .on("error", (error) => {
    console.error("❌ Error reading CSV file:", error);
    process.exit(1);
  });
