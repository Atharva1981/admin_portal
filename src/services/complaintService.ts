import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  startAfter, 
  where, 
  getDocs, 
  DocumentSnapshot,
  QueryConstraint,
  Timestamp
} from 'firebase/firestore';
import { userDb } from '../config/firebase';

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  location: {
    address: string;
    city: string;
    pincode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  user: {
    name: string;
    email: string;
    phone?: string;
  };
  department: string;
  assignedTo?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  images?: string[];
  attachments?: string[];
  resolution?: {
    description: string;
    resolvedBy: string;
    resolvedAt: Timestamp;
  };
}

export interface ComplaintFilters {
  status?: string;
  category?: string;
  priority?: string;
  city?: string;
  department?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface PaginationOptions {
  pageSize?: number;
  lastDoc?: DocumentSnapshot;
}

class ComplaintService {
  private readonly collectionName = 'complaints';

  /**
   * Get all complaints with optional filtering and pagination
   */
  async getComplaints(
    filters: ComplaintFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<{ complaints: Complaint[]; lastDoc: DocumentSnapshot | null }> {
    try {
      const complaintsRef = collection(userDb, this.collectionName);
      const constraints: QueryConstraint[] = [];

      // Apply filters
      if (filters.status) {
        constraints.push(where('status', '==', filters.status));
      }
      if (filters.category) {
        constraints.push(where('category', '==', filters.category));
      }
      if (filters.priority) {
        constraints.push(where('priority', '==', filters.priority));
      }
      if (filters.city) {
        constraints.push(where('location.city', '==', filters.city));
      }
      if (filters.department) {
        constraints.push(where('department', '==', filters.department));
      }
      if (filters.dateFrom) {
        constraints.push(where('createdAt', '>=', filters.dateFrom));
      }
      if (filters.dateTo) {
        constraints.push(where('createdAt', '<=', filters.dateTo));
      }

      // Apply ordering and pagination
      constraints.push(orderBy('createdAt', 'desc'));
      
      if (pagination.pageSize) {
        constraints.push(limit(pagination.pageSize));
      }
      
      if (pagination.lastDoc) {
        constraints.push(startAfter(pagination.lastDoc));
      }

      const q = query(complaintsRef, ...constraints);
      const snapshot = await getDocs(q);
      
      const complaints: Complaint[] = [];
      let lastDoc: DocumentSnapshot | null = null;

      snapshot.forEach((doc) => {
        complaints.push({
          id: doc.id,
          ...doc.data()
        } as Complaint);
        lastDoc = doc;
      });

      return { complaints, lastDoc };
    } catch (error) {
      console.error('Error fetching complaints:', error);
      throw new Error('Failed to fetch complaints');
    }
  }

  /**
   * Get complaints by status
   */
  async getComplaintsByStatus(status: string): Promise<Complaint[]> {
    const { complaints } = await this.getComplaints({ status });
    return complaints;
  }

  /**
   * Get complaints by category
   */
  async getComplaintsByCategory(category: string): Promise<Complaint[]> {
    const { complaints } = await this.getComplaints({ category });
    return complaints;
  }

  /**
   * Get complaints by city
   */
  async getComplaintsByCity(city: string): Promise<Complaint[]> {
    const { complaints } = await this.getComplaints({ city });
    return complaints;
  }

  /**
   * Get complaints by department
   */
  async getComplaintsByDepartment(department: string): Promise<Complaint[]> {
    const { complaints } = await this.getComplaints({ department });
    return complaints;
  }

  /**
   * Get recent complaints (last 24 hours)
   */
  async getRecentComplaints(limitCount: number = 10): Promise<Complaint[]> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { complaints } = await this.getComplaints(
      { dateFrom: yesterday },
      { pageSize: limitCount }
    );
    return complaints;
  }

  /**
   * Get complaint statistics
   */
  async getComplaintStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
  }> {
    try {
      const { complaints } = await this.getComplaints();
      
      const stats = {
        total: complaints.length,
        byStatus: {} as Record<string, number>,
        byCategory: {} as Record<string, number>,
        byPriority: {} as Record<string, number>
      };

      complaints.forEach(complaint => {
        // Count by status
        stats.byStatus[complaint.status] = (stats.byStatus[complaint.status] || 0) + 1;
        
        // Count by category
        stats.byCategory[complaint.category] = (stats.byCategory[complaint.category] || 0) + 1;
        
        // Count by priority
        stats.byPriority[complaint.priority] = (stats.byPriority[complaint.priority] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching complaint stats:', error);
      throw new Error('Failed to fetch complaint statistics');
    }
  }
}

export default new ComplaintService();