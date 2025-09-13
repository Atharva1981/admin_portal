import { 
  collection, 
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { adminDb, userDb } from '../config/firebase';
import { mapComplaintToDepartmentFrontend, DepartmentMappingResult } from './departmentMappingService';

export interface IncomingComplaint {
  complaintId?: string;
  category: string;
  city: string;
  pincode?: string;
  description: string;
  userId: string;
  userName: string;
  userPhone: string;
  latitude: number;
  longitude: number;
  imageUrl: string;
  address?: string;
  ward?: string;
  createdAt?: any;
  // Image analysis results (if available)
  imageAnalysis?: {
    detectedCity?: string;
    detectedCategory?: string;
    confidence?: number;
  };
}

export interface ProcessedComplaint extends IncomingComplaint {
  complaintId: string;
  department: string;
  higher_authority: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Escalated';
  priority: 'Low' | 'Medium' | 'High';
  assignedTo?: string;
  slaDeadline: Timestamp;
  departmentMapping: DepartmentMappingResult;
  processedAt: Timestamp;
  notifications: string[];
}

/**
 * Processes an incoming complaint and assigns it to the appropriate department
 * @param complaint - The incoming complaint from Flutter user app
 * @returns Promise<ProcessedComplaint> - The processed complaint with department assignment
 */
export const processIncomingComplaint = async (
  complaint: IncomingComplaint
): Promise<ProcessedComplaint> => {
  try {
    console.log(`🔄 Processing incoming complaint: ${complaint.category} from ${complaint.city}`);
    
    // Step 1: Use image analysis city if available, otherwise use user-provided city
    const effectiveCity = complaint.imageAnalysis?.detectedCity || complaint.city;
    const effectiveCategory = complaint.imageAnalysis?.detectedCategory || complaint.category;
    
    // Step 2: Map complaint to department using our existing logic
    const departmentMapping = await mapComplaintToDepartmentFrontend({
      category: effectiveCategory,
      city: effectiveCity,
      pincode: complaint.pincode,
      description: complaint.description,
      complaintId: complaint.complaintId
    });
    
    // Step 3: Determine priority based on category and other factors
    const priority = determinePriority(effectiveCategory, complaint.description);
    
    // Step 4: Calculate SLA deadline based on department and priority
    const slaDeadline = calculateSLADeadline(departmentMapping.department, priority);
    
    // Step 5: Generate unique complaint ID if not provided
    const complaintId = complaint.complaintId || generateComplaintId(effectiveCategory, effectiveCity);
    
    // Step 6: Create processed complaint object
    const processedComplaint: ProcessedComplaint = {
      ...complaint,
      complaintId,
      category: effectiveCategory,
      city: effectiveCity,
      department: departmentMapping.department,
      higher_authority: departmentMapping.higher_authority,
      status: 'Open',
      priority,
      slaDeadline,
      departmentMapping,
      processedAt: Timestamp.now(),
      createdAt: complaint.createdAt || Timestamp.now(),
      notifications: []
    };
    
    console.log(`✅ Complaint processed and assigned to: ${departmentMapping.department}`);
    return processedComplaint;
    
  } catch (error) {
    console.error('❌ Error processing complaint:', error);
    throw new Error(`Failed to process complaint: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Saves a processed complaint to the admin database and notifies relevant departments
 * @param processedComplaint - The processed complaint to save
 * @returns Promise<boolean> - Success status
 */
export const saveProcessedComplaint = async (
  processedComplaint: ProcessedComplaint
): Promise<boolean> => {
  try {
    console.log(`💾 Saving processed complaint ${processedComplaint.complaintId}`);
    
    // Save to admin database
    const complaintsRef = collection(adminDb, 'processed_complaints');
    await addDoc(complaintsRef, {
      ...processedComplaint,
      createdAt: processedComplaint.createdAt || Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    // Create notification for department
    await createDepartmentNotification(processedComplaint);
    
    // Update complaint tracking statistics
    await updateComplaintStatistics(processedComplaint);
    
    console.log(`✅ Successfully saved complaint ${processedComplaint.complaintId}`);
    return true;
    
  } catch (error) {
    console.error('❌ Error saving processed complaint:', error);
    return false;
  }
};

/**
 * Processes multiple complaints in batch
 * @param complaints - Array of incoming complaints
 * @returns Promise<ProcessedComplaint[]> - Array of processed complaints
 */
export const processBatchComplaints = async (
  complaints: IncomingComplaint[]
): Promise<ProcessedComplaint[]> => {
  try {
    console.log(`🔄 Processing ${complaints.length} complaints in batch...`);
    
    const results = await Promise.all(
      complaints.map(complaint => processIncomingComplaint(complaint))
    );
    
    // Save all processed complaints using batch write for better performance
    const batch = writeBatch(adminDb);
    const complaintsRef = collection(adminDb, 'processed_complaints');
    
    results.forEach(processedComplaint => {
      const docRef = doc(complaintsRef);
      batch.set(docRef, {
        ...processedComplaint,
        updatedAt: Timestamp.now()
      });
    });
    
    await batch.commit();
    
    console.log(`✅ Successfully processed and saved ${results.length} complaints`);
    return results;
    
  } catch (error) {
    console.error('❌ Error in batch processing:', error);
    throw new Error(`Batch processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Monitors incoming complaints from user database and auto-processes them
 * @param callback - Function to call when new complaints are processed
 * @returns Unsubscribe function
 */
export const monitorIncomingComplaints = (
  callback: (processedComplaints: ProcessedComplaint[]) => void
) => {
  console.log('👁️ Starting to monitor incoming complaints...');
  
  const complaintsRef = collection(userDb, 'complaints');
  const q = query(
    complaintsRef,
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  
  return onSnapshot(q, async (snapshot) => {
    const newComplaints: IncomingComplaint[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      
      // Check if this complaint has already been processed
      if (!data.processed) {
        const complaint: IncomingComplaint = {
          complaintId: doc.id,
          category: data.category || 'Other',
          city: data.city || data.ward || 'Unknown',
          pincode: data.pincode || '',
          description: data.description || '',
          userId: data.userId || '',
          userName: data.userName || 'Anonymous',
          userPhone: data.userPhone || '',
          latitude: data.location?.lat || data.latitude || 0,
          longitude: data.location?.lng || data.longitude || 0,
          imageUrl: data.imageUrl || data.images?.[0] || '',
          address: data.address,
          ward: data.ward,
          createdAt: data.createdAt,
          imageAnalysis: data.imageAnalysis
        };
        
        newComplaints.push(complaint);
      }
    });
    
    if (newComplaints.length > 0) {
      console.log(`📥 Found ${newComplaints.length} new complaints to process`);
      
      try {
        const processedComplaints = await processBatchComplaints(newComplaints);
        
        // Mark original complaints as processed
        const batch = writeBatch(userDb);
        newComplaints.forEach(complaint => {
          if (complaint.complaintId) {
            const docRef = doc(userDb, 'complaints', complaint.complaintId);
            batch.update(docRef, { 
              processed: true, 
              processedAt: Timestamp.now() 
            });
          }
        });
        await batch.commit();
        
        callback(processedComplaints);
        
      } catch (error) {
        console.error('❌ Error auto-processing complaints:', error);
      }
    }
  });
};

/**
 * Determines complaint priority based on category and description
 */
const determinePriority = (category: string, description: string): 'Low' | 'Medium' | 'High' => {
  const highPriorityCategories = ['Water Leakage', 'Streetlight', 'Emergency'];
  const mediumPriorityCategories = ['Pothole', 'Garbage Collection'];
  
  // Check for emergency keywords in description
  const emergencyKeywords = ['urgent', 'emergency', 'danger', 'immediate', 'critical'];
  const hasEmergencyKeyword = emergencyKeywords.some(keyword => 
    description.toLowerCase().includes(keyword)
  );
  
  if (hasEmergencyKeyword || highPriorityCategories.includes(category)) {
    return 'High';
  } else if (mediumPriorityCategories.includes(category)) {
    return 'Medium';
  }
  
  return 'Low';
};

/**
 * Calculates SLA deadline based on department and priority
 */
const calculateSLADeadline = (department: string, priority: 'Low' | 'Medium' | 'High'): Timestamp => {
  const now = new Date();
  let hoursToAdd = 72; // Default 72 hours (3 days)
  
  // Adjust based on priority
  switch (priority) {
    case 'High':
      hoursToAdd = 24; // 1 day
      break;
    case 'Medium':
      hoursToAdd = 48; // 2 days
      break;
    case 'Low':
      hoursToAdd = 72; // 3 days
      break;
  }
  
  // Further adjust based on department type
  const urgentDepartments = ['Water Department', 'Electricity Department', 'Emergency Services'];
  if (urgentDepartments.some(dept => department.includes(dept))) {
    hoursToAdd = Math.max(hoursToAdd - 12, 12); // Reduce by 12 hours, minimum 12 hours
  }
  
  const deadline = new Date(now.getTime() + (hoursToAdd * 60 * 60 * 1000));
  return Timestamp.fromDate(deadline);
};

/**
 * Generates a unique complaint ID
 */
const generateComplaintId = (category: string, city: string): string => {
  const timestamp = Date.now();
  const categoryCode = category.substring(0, 3).toUpperCase();
  const cityCode = city.substring(0, 3).toUpperCase();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `${categoryCode}${cityCode}${timestamp}${random}`;
};

/**
 * Creates notification for department about new complaint
 */
const createDepartmentNotification = async (complaint: ProcessedComplaint): Promise<void> => {
  try {
    const notificationsRef = collection(adminDb, 'notifications');
    await addDoc(notificationsRef, {
      type: 'new_complaint',
      department: complaint.department,
      complaintId: complaint.complaintId,
      category: complaint.category,
      city: complaint.city,
      priority: complaint.priority,
      title: `New ${complaint.priority} Priority Complaint`,
      message: `A new complaint has been assigned to ${complaint.department}: ${complaint.description.substring(0, 100)}...`,
      createdAt: Timestamp.now(),
      read: false,
      slaDeadline: complaint.slaDeadline
    });
    
    console.log(`📧 Created notification for ${complaint.department}`);
    
  } catch (error) {
    console.error('❌ Error creating department notification:', error);
  }
};

/**
 * Updates complaint statistics for dashboard
 */
const updateComplaintStatistics = async (complaint: ProcessedComplaint): Promise<void> => {
  try {
    const statsRef = collection(adminDb, 'statistics');
    const today = new Date().toISOString().split('T')[0];
    
    // Update daily statistics
    const dailyStatsDoc = doc(statsRef, `daily_${today}`);
    
    // This would ideally use Firebase transactions for atomic updates
    // For now, we'll use a simple update approach
    await updateDoc(dailyStatsDoc, {
      totalComplaints: (complaint as any).totalComplaints + 1 || 1,
      [`byCategory.${complaint.category}`]: ((complaint as any).byCategory?.[complaint.category] || 0) + 1,
      [`byDepartment.${complaint.department}`]: ((complaint as any).byDepartment?.[complaint.department] || 0) + 1,
      [`byPriority.${complaint.priority}`]: ((complaint as any).byPriority?.[complaint.priority] || 0) + 1,
      [`byCity.${complaint.city}`]: ((complaint as any).byCity?.[complaint.city] || 0) + 1,
      lastUpdated: Timestamp.now()
    }).catch(() => {
      // If document doesn't exist, create it
      return updateDoc(dailyStatsDoc, {
        totalComplaints: 1,
        byCategory: { [complaint.category]: 1 },
        byDepartment: { [complaint.department]: 1 },
        byPriority: { [complaint.priority]: 1 },
        byCity: { [complaint.city]: 1 },
        date: today,
        createdAt: Timestamp.now(),
        lastUpdated: Timestamp.now()
      });
    });
    
    console.log(`📊 Updated statistics for ${today}`);
    
  } catch (error) {
    console.error('❌ Error updating statistics:', error);
  }
};

export default {
  processIncomingComplaint,
  saveProcessedComplaint,
  processBatchComplaints,
  monitorIncomingComplaints
};
