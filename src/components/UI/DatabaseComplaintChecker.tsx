import React, { useState } from 'react';
import { Search, Database, AlertCircle, CheckCircle } from 'lucide-react';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { userDb } from '../../config/firebase';

const DatabaseComplaintChecker: React.FC = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const checkDatabase = async () => {
    setIsChecking(true);
    setError(null);
    setComplaints([]);

    try {
      console.log('🔍 Checking Firebase database for complaints...');
      
      // Query the complaints collection
      const complaintsRef = collection(userDb, 'complaints');
      const q = query(complaintsRef, limit(10)); // Get first 10 complaints
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setError('No complaints found in database');
        console.log('❌ No complaints found in database');
        return;
      }

      const foundComplaints: any[] = [];
      snapshot.forEach((doc) => {
        foundComplaints.push({
          id: doc.id,
          ...doc.data()
        });
      });

      setComplaints(foundComplaints);
      console.log(`✅ Found ${foundComplaints.length} complaints:`, foundComplaints);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Database error: ${errorMessage}`);
      console.error('❌ Database check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Database className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Database Complaint Checker</h3>
        </div>
        <button
          onClick={checkDatabase}
          disabled={isChecking}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Search className="h-4 w-4" />
          <span>{isChecking ? 'Checking...' : 'Check Database'}</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {complaints.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Found {complaints.length} complaints in database:</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Document ID</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Status</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Category</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {complaints.map((complaint, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono text-blue-600">{complaint.id}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        complaint.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        complaint.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {complaint.status || 'N/A'}
                      </span>
                    </td>
                    <td className="px-3 py-2">{complaint.category || 'N/A'}</td>
                    <td className="px-3 py-2">
                      {complaint.createdAt ? 
                        new Date(complaint.createdAt.seconds * 1000).toLocaleDateString() : 
                        'N/A'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">💡 How to Fix Status Update Issue:</h4>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Use the actual Document IDs from above (not mock data IDs like ISS-2024-001)</li>
              <li>2. Update your Dashboard to use real complaint data from Firebase</li>
              <li>3. Or create test complaints in Firebase with the mock IDs</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseComplaintChecker;
