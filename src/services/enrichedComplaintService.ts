import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  limit,
  Unsubscribe
} from 'firebase/firestore';
import { userDb } from '../config/firebase';
import { mapComplaintToDepartment, DepartmentMappingResult } from './departmentMappingService';
import { fetchUserComplaints, UserComplaint } from './userComplaintsService';

export interface EnrichedComplaint extends UserComplaint {
  // Department information from mapping
  assignedDepartment: string;
  higherAuthority: string;
  departmentStatus: string;
  isDefaultMapping: boolean;
  mappingCriteria?: {
    category: string;
    city: string;
  };
  
  // Enhanced fields
  formattedCreatedAt: string;
  formattedUpdatedAt?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  
  // Processing status
  processingStatus: 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'escalated';
  slaDeadline?: string;
  daysSinceCreated: number;
}

export interface EnrichedComplaintFilters {
  category?: string;
  city?: string;
  status?: string;
  priority?: string;
  department?: string;
  assignedDepartment?: string;
  processingStatus?: string;
  dateFrom?: Date;
  dateTo?: Date;
  isDefaultMapping?: boolean;
}

export interface EnrichedFetchOptions {
  limitCount?: number;
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
  filters?: EnrichedComplaintFilters;
}

/**
 * Enriches a single complaint with department mapping information
 */
const enrichComplaintWithDepartment = async (complaint: UserComplaint): Promise<EnrichedComplaint> => {
  try {
    // Map complaint to department using admin mappings
    const departmentMapping: DepartmentMappingResult = await mapComplaintToDepartment({
      category: complaint.category,
      city: complaint.city,
      pincode: complaint.pincode,
      complaintId: complaint.complaintId
    });

    // Format dates
    const createdAt = complaint.createdAt?.toDate ? complaint.createdAt.toDate() : new Date(complaint.createdAt);
    const updatedAt = complaint.updatedAt?.toDate ? complaint.updatedAt.toDate() : (complaint.updatedAt ? new Date(complaint.updatedAt) : undefined);
    
    // Calculate days since created
    const daysSinceCreated = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    // Determine processing status based on existing status and department assignment
    let processingStatus: 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'escalated' = 'pending';
    
    if (complaint.status) {
      switch (complaint.status.toLowerCase()) {
        case 'resolved':
        case 'closed':
          processingStatus = 'resolved';
          break;
        case 'in progress':
        case 'in_progress':
          processingStatus = 'in_progress';
          break;
        case 'escalated':
          processingStatus = 'escalated';
          break;
        case 'assigned':
          processingStatus = 'assigned';
          break;
        default:
          processingStatus = departmentMapping.isDefault ? 'pending' : 'assigned';
      }
    } else {
      processingStatus = departmentMapping.isDefault ? 'pending' : 'assigned';
    }

    // Calculate SLA deadline (assuming 48 seconds for most issues, 24 for high priority)
    const slaSeconds = complaint.priority === 'High' ? 24 : 48;
    const slaDeadline = new Date(createdAt.getTime() + (slaSeconds * 1000));

    const enrichedComplaint: EnrichedComplaint = {
      ...complaint,
      
      // Department mapping information
      assignedDepartment: departmentMapping.department,
      higherAuthority: departmentMapping.higher_authority,
      departmentStatus: departmentMapping.status,
      isDefaultMapping: departmentMapping.isDefault,
      mappingCriteria: departmentMapping.matchedCriteria,
      
      // Enhanced fields
      formattedCreatedAt: createdAt.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      formattedUpdatedAt: updatedAt?.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      coordinates: {
        lat: complaint.latitude || 0,
        lng: complaint.longitude || 0
      },
      
      // Processing information
      processingStatus,
      slaDeadline: slaDeadline.toISOString(),
      daysSinceCreated
    };

    return enrichedComplaint;
    
  } catch (error) {
    console.error('❌ Error enriching complaint:', error);
    
    // Return complaint with minimal enrichment on error
    const createdAt = complaint.createdAt?.toDate ? complaint.createdAt.toDate() : new Date(complaint.createdAt);
    const daysSinceCreated = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      ...complaint,
      assignedDepartment: 'General Grievances',
      higherAuthority: 'Municipal Commissioner / Executive Officer - General Grievances',
      departmentStatus: 'active',
      isDefaultMapping: true,
      formattedCreatedAt: createdAt.toLocaleDateString('en-IN'),
      coordinates: {
        lat: complaint.latitude || 0,
        lng: complaint.longitude || 0
      },
      processingStatus: 'pending',
      daysSinceCreated
    };
  }
};

/**
 * Fetches and enriches user complaints with department mapping information
 */
export const fetchEnrichedComplaints = async (options: EnrichedFetchOptions = {}): Promise<EnrichedComplaint[]> => {
  try {
    console.log('🔄 Fetching and enriching complaints...');
    
    // First, fetch raw complaints from user database
    const rawComplaints = await fetchUserComplaints({
      limitCount: options.limitCount,
      orderByField: options.orderByField,
      orderDirection: options.orderDirection,
      filters: options.filters ? {
        category: options.filters.category,
        city: options.filters.city,
        status: options.filters.status,
        priority: options.filters.priority,
        department: options.filters.department,
        dateFrom: options.filters.dateFrom,
        dateTo: options.filters.dateTo
      } : undefined
    });

    console.log(`📥 Fetched ${rawComplaints.length} raw complaints`);

    // Enrich each complaint with department information
    const enrichmentPromises = rawComplaints.map(complaint => enrichComplaintWithDepartment(complaint));
    const enrichedComplaints = await Promise.all(enrichmentPromises);

    // Apply additional filters specific to enriched data
    let filteredComplaints = enrichedComplaints;
    
    if (options.filters) {
      if (options.filters.assignedDepartment) {
        filteredComplaints = filteredComplaints.filter(c => 
          c.assignedDepartment.toLowerCase().includes(options.filters!.assignedDepartment!.toLowerCase())
        );
      }
      
      if (options.filters.processingStatus) {
        filteredComplaints = filteredComplaints.filter(c => 
          c.processingStatus === options.filters!.processingStatus
        );
      }
      
      if (options.filters.isDefaultMapping !== undefined) {
        filteredComplaints = filteredComplaints.filter(c => 
          c.isDefaultMapping === options.filters!.isDefaultMapping
        );
      }
    }

    console.log(`✅ Successfully enriched ${filteredComplaints.length} complaints`);
    return filteredComplaints;
    
  } catch (error) {
    console.error('❌ Error fetching enriched complaints:', error);
    throw new Error(`Failed to fetch enriched complaints: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Sets up a real-time listener for enriched complaints
 */
export const listenToEnrichedComplaints = (
  callback: (complaints: EnrichedComplaint[]) => void,
  options: EnrichedFetchOptions = {}
): Unsubscribe => {
  try {
    console.log('📡 Setting up real-time listener for enriched complaints...');
    
    // Set up listener for raw complaints
    const unsubscribe = onSnapshot(
      query(
        collection(userDb, 'complaints'),
        orderBy(options.orderByField || 'createdAt', options.orderDirection || 'desc'),
        limit(options.limitCount || 50)
      ),
      async (snapshot) => {
        try {
          const rawComplaints: UserComplaint[] = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            const complaint: UserComplaint = {
              complaintId: data.complaintId || doc.id,
              category: data.category || 'Unknown',
              city: data.city || data.ward || 'Unknown',
              pincode: data.pincode || 'Unknown',
              description: data.description || 'No description provided',
              createdAt: data.createdAt,
              userId: data.userId || 'Unknown',
              userName: data.userName || 'Anonymous',
              userPhone: data.userPhone || 'Not provided',
              latitude: data.location?.lat || data.latitude || 0,
              longitude: data.location?.lng || data.longitude || 0,
              imageUrl: data.imageUrl || data.images?.[0] || '',
              status: data.status || 'Unknown',
              priority: data.priority || 'Unknown',
              department: data.department || 'Not assigned',
              address: data.address || 'Address not provided',
              ward: data.ward || data.city || 'Unknown',
              updatedAt: data.updatedAt
            };
            rawComplaints.push(complaint);
          });

          // Enrich complaints with department information
          const enrichmentPromises = rawComplaints.map(complaint => enrichComplaintWithDepartment(complaint));
          const enrichedComplaints = await Promise.all(enrichmentPromises);

          // Apply filters
          let filteredComplaints = enrichedComplaints;
          if (options.filters) {
            if (options.filters.assignedDepartment) {
              filteredComplaints = filteredComplaints.filter(c => 
                c.assignedDepartment.toLowerCase().includes(options.filters!.assignedDepartment!.toLowerCase())
              );
            }
            if (options.filters.processingStatus) {
              filteredComplaints = filteredComplaints.filter(c => 
                c.processingStatus === options.filters!.processingStatus
              );
            }
            if (options.filters.isDefaultMapping !== undefined) {
              filteredComplaints = filteredComplaints.filter(c => 
                c.isDefaultMapping === options.filters!.isDefaultMapping
              );
            }
          }

          console.log(`📡 Real-time update: ${filteredComplaints.length} enriched complaints`);
          callback(filteredComplaints);
          
        } catch (error) {
          console.error('❌ Error in real-time enrichment:', error);
          callback([]);
        }
      },
      (error) => {
        console.error('❌ Error in real-time listener:', error);
        callback([]);
      }
    );

    return unsubscribe;
    
  } catch (error) {
    console.error('❌ Error setting up real-time listener:', error);
    throw new Error(`Failed to set up real-time listener: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Gets enriched complaint statistics
 */
export const getEnrichedComplaintStats = async (filters: EnrichedComplaintFilters = {}): Promise<{
  total: number;
  byCategory: Record<string, number>;
  byCity: Record<string, number>;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byDepartment: Record<string, number>;
  byProcessingStatus: Record<string, number>;
  defaultMappings: number;
  slaBreaches: number;
}> => {
  try {
    const complaints = await fetchEnrichedComplaints({ filters, limitCount: 1000 });
    
    const stats = {
      total: complaints.length,
      byCategory: {} as Record<string, number>,
      byCity: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
      byDepartment: {} as Record<string, number>,
      byProcessingStatus: {} as Record<string, number>,
      defaultMappings: 0,
      slaBreaches: 0
    };
    
    const now = new Date();
    
    complaints.forEach(complaint => {
      // Count by category
      stats.byCategory[complaint.category] = (stats.byCategory[complaint.category] || 0) + 1;
      
      // Count by city
      stats.byCity[complaint.city] = (stats.byCity[complaint.city] || 0) + 1;
      
      // Count by status
      stats.byStatus[complaint.status || 'Unknown'] = (stats.byStatus[complaint.status || 'Unknown'] || 0) + 1;
      
      // Count by priority
      stats.byPriority[complaint.priority || 'Unknown'] = (stats.byPriority[complaint.priority || 'Unknown'] || 0) + 1;
      
      // Count by assigned department
      stats.byDepartment[complaint.assignedDepartment] = (stats.byDepartment[complaint.assignedDepartment] || 0) + 1;
      
      // Count by processing status
      stats.byProcessingStatus[complaint.processingStatus] = (stats.byProcessingStatus[complaint.processingStatus] || 0) + 1;
      
      // Count default mappings
      if (complaint.isDefaultMapping) {
        stats.defaultMappings++;
      }
      
      // Count SLA breaches
      if (complaint.slaDeadline && new Date(complaint.slaDeadline) < now && complaint.processingStatus !== 'resolved') {
        stats.slaBreaches++;
      }
    });
    
    console.log('📊 Generated enriched complaint statistics');
    return stats;
    
  } catch (error) {
    console.error('❌ Error generating enriched complaint statistics:', error);
    throw new Error(`Failed to generate statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Gets complaints that need attention (SLA breaches, default mappings, etc.)
 */
export const getComplaintsNeedingAttention = async (): Promise<{
  slaBreaches: EnrichedComplaint[];
  defaultMappings: EnrichedComplaint[];
  highPriorityPending: EnrichedComplaint[];
  longPending: EnrichedComplaint[];
}> => {
  try {
    const allComplaints = await fetchEnrichedComplaints({ limitCount: 500 });
    const now = new Date();
    
    const result = {
      slaBreaches: [] as EnrichedComplaint[],
      defaultMappings: [] as EnrichedComplaint[],
      highPriorityPending: [] as EnrichedComplaint[],
      longPending: [] as EnrichedComplaint[]
    };
    
    allComplaints.forEach(complaint => {
      // SLA breaches
      if (complaint.slaDeadline && new Date(complaint.slaDeadline) < now && complaint.processingStatus !== 'resolved') {
        result.slaBreaches.push(complaint);
      }
      
      // Default mappings (need manual review)
      if (complaint.isDefaultMapping) {
        result.defaultMappings.push(complaint);
      }
      
      // High priority pending
      if (complaint.priority === 'High' && complaint.processingStatus === 'pending') {
        result.highPriorityPending.push(complaint);
      }
      
      // Long pending (more than 7 days)
      if (complaint.daysSinceCreated > 7 && complaint.processingStatus === 'pending') {
        result.longPending.push(complaint);
      }
    });
    
    console.log(`🚨 Found complaints needing attention: ${result.slaBreaches.length} SLA breaches, ${result.defaultMappings.length} default mappings, ${result.highPriorityPending.length} high priority pending, ${result.longPending.length} long pending`);
    
    return result;
    
  } catch (error) {
    console.error('❌ Error getting complaints needing attention:', error);
    throw new Error(`Failed to get complaints needing attention: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export default {
  fetchEnrichedComplaints,
  listenToEnrichedComplaints,
  getEnrichedComplaintStats,
  getComplaintsNeedingAttention
};
