import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, MapPin, User, Phone, FileText } from 'lucide-react';
import { 
  processIncomingComplaint,
  saveProcessedComplaint,
  monitorIncomingComplaints,
  type IncomingComplaint,
  type ProcessedComplaint 
} from '../../services/complaintProcessingService';

interface ComplaintProcessorProps {
  onComplaintProcessed?: (complaint: ProcessedComplaint) => void;
}

export const ComplaintProcessor: React.FC<ComplaintProcessorProps> = ({ 
  onComplaintProcessed 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedComplaints, setProcessedComplaints] = useState<ProcessedComplaint[]>([]);
  const [testComplaint, setTestComplaint] = useState<IncomingComplaint>({
    category: 'Pothole',
    city: 'Ranchi',
    pincode: '834001',
    description: 'Large pothole on main road causing traffic issues',
    userId: 'user123',
    userName: 'John Doe',
    userPhone: '+91-9876543210',
    latitude: 23.3441,
    longitude: 85.3096,
    imageUrl: 'https://example.com/pothole.jpg',
    address: 'Main Road, Ranchi',
    ward: 'Ward 12',
    imageAnalysis: {
      detectedCity: 'Ranchi',
      detectedCategory: 'Pothole',
      confidence: 0.85
    }
  });
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    if (isMonitoring) {
      console.log('Starting to monitor incoming complaints...');
      
      unsubscribe = monitorIncomingComplaints((newProcessedComplaints) => {
        console.log('Received processed complaints:', newProcessedComplaints);
        setProcessedComplaints(prev => [...newProcessedComplaints, ...prev]);
        
        // Notify parent component
        newProcessedComplaints.forEach(complaint => {
          onComplaintProcessed?.(complaint);
        });
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
        console.log('Stopped monitoring complaints');
      }
    };
  }, [isMonitoring, onComplaintProcessed]);

  const handleProcessTestComplaint = async () => {
    setIsProcessing(true);
    try {
      console.log('Processing test complaint...');
      
      // Process the complaint
      const processedComplaint = await processIncomingComplaint(testComplaint);
      console.log('Processed complaint:', processedComplaint);
      
      // Save to database
      const saved = await saveProcessedComplaint(processedComplaint);
      
      if (saved) {
        setProcessedComplaints(prev => [processedComplaint, ...prev]);
        onComplaintProcessed?.(processedComplaint);
        
        // Show success message
        alert(`✅ Complaint successfully processed and assigned to: ${processedComplaint.department}`);
      } else {
        alert('❌ Failed to save processed complaint');
      }
      
    } catch (error) {
      console.error('Error processing complaint:', error);
      alert(`❌ Error processing complaint: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (field: keyof IncomingComplaint, value: string) => {
    setTestComplaint(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleMonitoring = () => {
    setIsMonitoring(prev => !prev);
  };

  const getPriorityColor = (priority: 'Low' | 'Medium' | 'High') => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      case 'Low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (timestamp?.toDate) {
      return timestamp.toDate().toLocaleString();
    }
    return 'Unknown';
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Complaint Processing System
        </h1>
        <p className="text-gray-600">
          Test and monitor the automated complaint-to-department mapping system
        </p>
      </div>

      {/* Test Complaint Form */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Test Complaint Processing</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={testComplaint.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="Pothole">Pothole</option>
              <option value="Garbage Collection">Garbage Collection</option>
              <option value="Streetlight">Streetlight</option>
              <option value="Water Leakage">Water Leakage</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <input
              type="text"
              value={testComplaint.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User Name
            </label>
            <input
              type="text"
              value={testComplaint.userName}
              onChange={(e) => handleInputChange('userName', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="text"
              value={testComplaint.userPhone}
              onChange={(e) => handleInputChange('userPhone', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={testComplaint.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleProcessTestComplaint}
            disabled={isProcessing}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <Clock className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            {isProcessing ? 'Processing...' : 'Process Test Complaint'}
          </button>

          <button
            onClick={toggleMonitoring}
            className={`flex items-center gap-2 px-4 py-2 rounded-md ${
              isMonitoring 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </button>
        </div>
      </div>

      {/* Processed Complaints */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Processed Complaints</h2>
          <p className="text-gray-600 text-sm mt-1">
            {processedComplaints.length} complaints processed
          </p>
        </div>

        <div className="divide-y divide-gray-100">
          {processedComplaints.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No processed complaints yet. Process a test complaint to see results.
            </div>
          ) : (
            processedComplaints.map((complaint, index) => (
              <div key={`${complaint.complaintId}-${index}`} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {complaint.complaintId}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                        {complaint.priority} Priority
                      </span>
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                        {complaint.status}
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {complaint.category} - {complaint.city}
                    </h3>
                  </div>
                  
                  <div className="text-right text-sm text-gray-500">
                    <div>Processed: {formatTimestamp(complaint.processedAt)}</div>
                    <div>SLA: {formatTimestamp(complaint.slaDeadline)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2">Department Assignment</h4>
                    <div className="text-green-700">
                      <div className="font-medium">{complaint.department}</div>
                      <div className="text-sm mt-1">{complaint.higher_authority}</div>
                      {complaint.departmentMapping.isDefault && (
                        <div className="text-xs text-yellow-600 mt-1">
                          ⚠️ Default department (no exact match found)
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">Complaint Details</h4>
                    <div className="space-y-1 text-sm text-blue-700">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3" />
                        {complaint.userName}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3" />
                        {complaint.userPhone}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        {complaint.address || `${complaint.city}, ${complaint.pincode}`}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-gray-800 mb-1">Description</div>
                      <div className="text-gray-600 text-sm">{complaint.description}</div>
                    </div>
                  </div>
                </div>

                {complaint.departmentMapping.matchedCriteria && (
                  <div className="mt-4 text-xs text-gray-500">
                    <div className="font-medium mb-1">Matching Criteria:</div>
                    <div>
                      Category: {complaint.departmentMapping.matchedCriteria.category} | 
                      City: {complaint.departmentMapping.matchedCriteria.city}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ComplaintProcessor;
