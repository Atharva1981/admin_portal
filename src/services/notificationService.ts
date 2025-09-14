import { Timestamp } from 'firebase/firestore';
import complaintStatusService, { ComplaintStatus } from './complaintStatusService';
import fcmService from './fcmService';
import { fetchUserComplaintById } from './userComplaintsService';

export interface NotificationTrigger {
  complaintId: string;
  userId: string;
  previousStatus?: string;
  newStatus: ComplaintStatus;
  updatedBy: string;
  notes?: string;
}

class NotificationService {
  /**
   * Main method to handle status updates and trigger notifications
   */
  async updateStatusAndNotify(
    complaintId: string,
    newStatus: ComplaintStatus,
    updatedBy: string,
    options: {
      assignedTo?: string;
      department?: string;
      notes?: string;
    } = {}
  ): Promise<void> {
    try {
      // Get current complaint data
      const complaint = await fetchUserComplaintById(complaintId);
      if (!complaint) {
        throw new Error(`Complaint ${complaintId} not found`);
      }

      const previousStatus = complaint.status || 'submitted';
      
      // Update the status
      await complaintStatusService.updateComplaintStatus(complaintId, {
        status: newStatus,
        updatedBy,
        updatedAt: Timestamp.now(),
        assignedTo: options.assignedTo,
        department: options.department,
        notes: options.notes
      });

      // Trigger notification based on status change
      await this.triggerNotification({
        complaintId,
        userId: complaint.userId,
        previousStatus,
        newStatus,
        updatedBy,
        notes: options.notes
      });

      console.log(`✅ Status updated and notification sent for complaint ${complaintId}`);
      
    } catch (error) {
      console.error('❌ Error updating status and sending notification:', error);
      throw error;
    }
  }

  /**
   * Trigger appropriate notification based on status change
   */
  private async triggerNotification(trigger: NotificationTrigger): Promise<void> {
    const { complaintId, userId, newStatus } = trigger;
    
    try {
      // Get complaint data for notification content
      const complaint = await fetchUserComplaintById(complaintId);
      if (!complaint) return;

      let notificationType: 'confirmation' | 'acknowledgment' | 'resolution';
      
      // Determine notification type based on new status
      switch (newStatus) {
        case 'submitted':
          notificationType = 'confirmation';
          break;
        case 'in-progress':
          notificationType = 'acknowledgment';
          break;
        case 'resolved':
          notificationType = 'resolution';
          break;
        default:
          // Don't send notification for other status changes
          return;
      }

      // Generate notification content
      const notificationPayload = fcmService.generateNotificationContent(
        notificationType,
        complaint
      );

      // Send the notification
      await fcmService.sendNotification(
        userId,
        complaintId,
        notificationType,
        notificationPayload
      );

      console.log(`📱 ${notificationType} notification sent for complaint ${complaintId}`);
      
    } catch (error) {
      console.error('❌ Error triggering notification:', error);
      // Don't throw here as notification failure shouldn't break the status update
    }
  }

  /**
   * Convenience method: Submit new complaint (triggers confirmation)
   */
  async submitComplaint(complaintId: string, userId: string): Promise<void> {
    await this.updateStatusAndNotify(complaintId, 'submitted', 'system', {
      notes: 'Complaint submitted successfully'
    });
  }

  /**
   * Convenience method: Assign complaint (triggers acknowledgment)
   */
  async assignComplaint(
    complaintId: string,
    assignedTo: string,
    department: string,
    assignedBy: string,
    notes?: string
  ): Promise<void> {
    await this.updateStatusAndNotify(complaintId, 'in-progress', assignedBy, {
      assignedTo,
      department,
      notes: notes || `Assigned to ${assignedTo} in ${department} department`
    });
  }

  /**
   * Convenience method: Resolve complaint (triggers resolution)
   */
  async resolveComplaint(
    complaintId: string,
    resolvedBy: string,
    resolutionNotes: string
  ): Promise<void> {
    await this.updateStatusAndNotify(complaintId, 'resolved', resolvedBy, {
      notes: resolutionNotes
    });
  }

  /**
   * Setup FCM for a user (call this when user logs in)
   */
  async setupUserNotifications(userId: string): Promise<string | null> {
    try {
      const token = await fcmService.requestPermissionAndGetToken(userId);
      
      if (token) {
        // Setup foreground message listener
        fcmService.setupForegroundMessageListener((payload) => {
          console.log('📱 Received notification:', payload);
          
          // You can add custom handling here
          // For example, update UI, show toast, etc.
          this.handleForegroundNotification(payload);
        });
        
        console.log('✅ User notifications setup complete');
        return token;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error setting up user notifications:', error);
      return null;
    }
  }

  /**
   * Handle notifications received while app is in foreground
   */
  private handleForegroundNotification(payload: any): void {
    // You can customize this based on your UI framework
    // For example, show a toast notification, update a notification center, etc.
    
    if (payload.notification) {
      // Show a custom in-app notification
      this.showInAppNotification({
        title: payload.notification.title,
        body: payload.notification.body,
        data: payload.data
      });
    }
  }

  /**
   * Show in-app notification (customize based on your UI)
   */
  private showInAppNotification(notification: any): void {
    // This is a placeholder - implement based on your UI framework
    // You might use a toast library, custom notification component, etc.
    
    console.log('🔔 In-app notification:', notification);
    
    // Example: Create a custom notification element
    if (typeof window !== 'undefined') {
      // You can dispatch a custom event that your UI components can listen to
      window.dispatchEvent(new CustomEvent('civic-notification', {
        detail: notification
      }));
    }
  }

  /**
   * Cleanup notifications when user logs out
   */
  async cleanupUserNotifications(userId: string): Promise<void> {
    try {
      await fcmService.removeToken(userId);
      console.log('✅ User notifications cleaned up');
    } catch (error) {
      console.error('❌ Error cleaning up notifications:', error);
    }
  }

  /**
   * Test notification (for development/testing)
   */
  async sendTestNotification(userId: string, type: 'confirmation' | 'acknowledgment' | 'resolution'): Promise<void> {
    const testComplaint = {
      complaintId: 'TEST-001',
      category: 'Road Maintenance',
      description: 'Test complaint for notification'
    };

    const payload = fcmService.generateNotificationContent(type, testComplaint);
    
    await fcmService.sendNotification(
      userId,
      'TEST-001',
      type,
      payload
    );
  }
}

export default new NotificationService();
