import { useState, useCallback, useEffect, useRef } from 'react';
import {
  processIncomingComplaint,
  saveProcessedComplaint,
  monitorIncomingComplaints,
  processBatchComplaints,
  type IncomingComplaint,
  type ProcessedComplaint
} from '../services/complaintProcessingService';

interface UseComplaintProcessingReturn {
  // State
  isProcessing: boolean;
  processedComplaints: ProcessedComplaint[];
  isMonitoring: boolean;
  error: string | null;
  
  // Actions
  processComplaint: (complaint: IncomingComplaint) => Promise<ProcessedComplaint | null>;
  processBatch: (complaints: IncomingComplaint[]) => Promise<ProcessedComplaint[]>;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  clearError: () => void;
  clearComplaints: () => void;
}

export const useComplaintProcessing = (): UseComplaintProcessingReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedComplaints, setProcessedComplaints] = useState<ProcessedComplaint[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Process a single complaint
  const processComplaint = useCallback(async (complaint: IncomingComplaint): Promise<ProcessedComplaint | null> => {
    setIsProcessing(true);
    setError(null);
    
    try {
      console.log('🔄 Processing complaint:', complaint.category, complaint.city);
      
      // Step 1: Process the complaint
      const processedComplaint = await processIncomingComplaint(complaint);
      
      // Step 2: Save to database
      const saved = await saveProcessedComplaint(processedComplaint);
      
      if (!saved) {
        throw new Error('Failed to save processed complaint');
      }
      
      // Step 3: Add to local state
      setProcessedComplaints(prev => [processedComplaint, ...prev]);
      
      console.log('✅ Successfully processed complaint:', processedComplaint.complaintId);
      return processedComplaint;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('❌ Error processing complaint:', err);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Process multiple complaints in batch
  const processBatch = useCallback(async (complaints: IncomingComplaint[]): Promise<ProcessedComplaint[]> => {
    setIsProcessing(true);
    setError(null);
    
    try {
      console.log(`🔄 Processing ${complaints.length} complaints in batch...`);
      
      const processedComplaints = await processBatchComplaints(complaints);
      
      // Add to local state
      setProcessedComplaints(prev => [...processedComplaints, ...prev]);
      
      console.log(`✅ Successfully processed ${processedComplaints.length} complaints`);
      return processedComplaints;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('❌ Error processing batch complaints:', err);
      return [];
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Start monitoring incoming complaints
  const startMonitoring = useCallback(() => {
    if (isMonitoring || unsubscribeRef.current) {
      console.log('⚠️ Already monitoring complaints');
      return;
    }

    console.log('👁️ Starting complaint monitoring...');
    setIsMonitoring(true);
    setError(null);

    try {
      unsubscribeRef.current = monitorIncomingComplaints((newProcessedComplaints) => {
        console.log(`📥 Received ${newProcessedComplaints.length} new processed complaints`);
        
        if (newProcessedComplaints.length > 0) {
          setProcessedComplaints(prev => [...newProcessedComplaints, ...prev]);
        }
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start monitoring';
      setError(errorMessage);
      setIsMonitoring(false);
      console.error('❌ Error starting monitoring:', err);
    }
  }, [isMonitoring]);

  // Stop monitoring incoming complaints
  const stopMonitoring = useCallback(() => {
    if (!isMonitoring || !unsubscribeRef.current) {
      console.log('⚠️ Not currently monitoring');
      return;
    }

    console.log('🛑 Stopping complaint monitoring...');
    
    unsubscribeRef.current();
    unsubscribeRef.current = null;
    setIsMonitoring(false);
  }, [isMonitoring]);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear processed complaints
  const clearComplaints = useCallback(() => {
    setProcessedComplaints([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        console.log('🧹 Cleaning up complaint monitoring on unmount');
        unsubscribeRef.current();
      }
    };
  }, []);

  return {
    // State
    isProcessing,
    processedComplaints,
    isMonitoring,
    error,
    
    // Actions
    processComplaint,
    processBatch,
    startMonitoring,
    stopMonitoring,
    clearError,
    clearComplaints
  };
};

// Additional hook for department-specific monitoring
export const useDepartmentComplaintMonitoring = (departmentName: string) => {
  const [departmentComplaints, setDepartmentComplaints] = useState<ProcessedComplaint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { processedComplaints, isMonitoring, startMonitoring, stopMonitoring } = useComplaintProcessing();

  // Filter complaints for specific department
  useEffect(() => {
    const filtered = processedComplaints.filter(complaint => 
      complaint.department === departmentName
    );
    setDepartmentComplaints(filtered);
  }, [processedComplaints, departmentName]);

  return {
    departmentComplaints,
    isLoading,
    error,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    totalCount: departmentComplaints.length,
    highPriorityCount: departmentComplaints.filter(c => c.priority === 'High').length,
    overdueCount: departmentComplaints.filter(c => {
      const now = new Date();
      const slaDate = c.slaDeadline.toDate();
      return slaDate < now && c.status === 'Open';
    }).length
  };
};

export default useComplaintProcessing;
