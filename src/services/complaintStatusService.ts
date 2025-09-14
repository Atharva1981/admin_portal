import { 
  doc, 
  updateDoc, 
  getDoc, 
  Timestamp,
  collection,
  addDoc
} from 'firebase/firestore';
import { userDb, adminDb } from '../config/firebase';

export type ComplaintStatus = 'submitted' | 'in-progress' | 'resolved' | 'closed';

export interface StatusUpdateData {
  status: ComplaintStatus;
  updatedBy: string;
  updatedAt: Timestamp;
  notes?: string;
  assignedTo?: string;
  department?: string;
  resolvedImageUrl?: string;
  resolvedBy?: string;
  resolvedAt?: Timestamp;
}

export interface StatusHistory {
  id: string;
  complaintId: string;
  previousStatus: string;
  newStatus: ComplaintStatus;
  updatedBy: string;
  updatedAt: Timestamp;
  notes?: string;
}

class ComplaintStatusService {
  /**
   * Update complaint status in user database
   */
  async updateComplaintStatus(
    complaintId: string, 
    statusData: StatusUpdateData
  ): Promise<void> {
    try {
      // Update in user database
      const userComplaintRef = doc(userDb, 'complaints', complaintId);
      
      // Get current complaint to track status history
      const currentDoc = await getDoc(userComplaintRef);
      if (!currentDoc.exists()) {
        throw new Error(`Complaint ${complaintId} not found`);
      }
      
      const currentData = currentDoc.data();
      const previousStatus = currentData.status || 'submitted';
      
      // Update the complaint
      const updateFields: any = {
        status: statusData.status,
        updatedAt: statusData.updatedAt,
        updatedBy: statusData.updatedBy,
        ...(statusData.assignedTo && { assignedTo: statusData.assignedTo }),
        ...(statusData.department && { department: statusData.department }),
        ...(statusData.notes && { lastUpdateNotes: statusData.notes })
      };

      // Add resolution-specific fields if status is resolved
      if (statusData.status === 'resolved') {
        updateFields.resolvedImageBase64 = statusData.resolvedImageUrl; // Store base64 instead of URL
        updateFields.resolvedBy = statusData.resolvedBy || statusData.updatedBy;
        updateFields.resolvedAt = statusData.resolvedAt || statusData.updatedAt;
      }

      await updateDoc(userComplaintRef, updateFields);

      // Add to status history
      await this.addStatusHistory({
        complaintId,
        previousStatus,
        newStatus: statusData.status,
        updatedBy: statusData.updatedBy,
        updatedAt: statusData.updatedAt,
        notes: statusData.notes
      });

      console.log(`✅ Updated complaint ${complaintId} status to ${statusData.status}`);
      
    } catch (error) {
      console.error('❌ Error updating complaint status:', error);
      throw new Error(`Failed to update complaint status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add status change to history
   */
  private async addStatusHistory(historyData: Omit<StatusHistory, 'id'>): Promise<void> {
    try {
      const historyRef = collection(adminDb, 'statusHistory');
      await addDoc(historyRef, historyData);
      
      console.log(`📝 Added status history for complaint ${historyData.complaintId}`);
    } catch (error) {
      console.error('❌ Error adding status history:', error);
      // Don't throw here as it's not critical for the main operation
    }
  }

  /**
   * Assign complaint to department/staff
   */
  async assignComplaint(
    complaintId: string,
    assignedTo: string,
    department: string,
    assignedBy: string,
    notes?: string
  ): Promise<void> {
    await this.updateComplaintStatus(complaintId, {
      status: 'in-progress',
      updatedBy: assignedBy,
      updatedAt: Timestamp.now(),
      assignedTo,
      department,
      notes: notes || `Assigned to ${assignedTo} in ${department} department`
    });
  }

  /**
   * Resolve complaint
   */
  async resolveComplaint(
    complaintId: string,
    resolvedBy: string,
    resolutionNotes: string
  ): Promise<void> {
    await this.updateComplaintStatus(complaintId, {
      status: 'resolved',
      updatedBy: resolvedBy,
      updatedAt: Timestamp.now(),
      notes: resolutionNotes
    });
  }

  /**
   * Get complaint status history
   */
  async getStatusHistory(complaintId: string): Promise<StatusHistory[]> {
    try {
      const { query, where, orderBy, getDocs } = await import('firebase/firestore');
      
      const historyRef = collection(adminDb, 'statusHistory');
      const q = query(
        historyRef, 
        where('complaintId', '==', complaintId),
        orderBy('updatedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const history: StatusHistory[] = [];
      
      snapshot.forEach((doc) => {
        history.push({
          id: doc.id,
          ...doc.data()
        } as StatusHistory);
      });
      
      return history;
    } catch (error) {
      console.error('❌ Error fetching status history:', error);
      return [];
    }
  }
}

export default new ComplaintStatusService();
