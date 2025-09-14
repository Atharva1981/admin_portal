// SLA Notification Service
import { UserComplaint } from './userComplaintsService';

export interface Complaint extends UserComplaint {
  higher_authority?: string;
  escalatedToHigherAuthority?: boolean;
}

export class SLANotificationService {
  private static readonly SLA_SECONDS = 48; // 48 seconds SLA

  /**
   * Check if SLA is breached for a complaint
   */
  static isSLABreached(complaint: Complaint): boolean {
    const createdAt = new Date(complaint.createdAt);
    const now = new Date();
    const secondsSinceCreated = (now.getTime() - createdAt.getTime()) / 1000;
    
    return secondsSinceCreated > this.SLA_SECONDS;
  }

  /**
   * Get hours remaining until SLA deadline
   */
  static getSecondsUntilDeadline(complaint: Complaint): number {
    const createdAt = new Date(complaint.createdAt);
    const now = new Date();
    const secondsSinceCreated = (now.getTime() - createdAt.getTime()) / 1000;
    
    return Math.max(0, this.SLA_SECONDS - secondsSinceCreated);
  }

  /**
   * Send notification to higher authority when SLA is breached
   */
  static async notifyHigherAuthority(complaint: Complaint): Promise<void> {
    try {
      // In a real implementation, this would send email/SMS/push notification
      const notification = {
        to: complaint.higher_authority,
        subject: `SLA Breached - Complaint ${complaint.complaintId}`,
        message: `
          Dear ${complaint.higher_authority},
          
          The following complaint has breached the 48-second SLA:
          
          Complaint ID: ${complaint.complaintId}
          Department: ${complaint.department}
          City: ${complaint.city}
          Category: ${complaint.category}
          Status: ${complaint.status}
          Created: ${new Date(complaint.createdAt).toLocaleString()}
          
          Please take immediate action to resolve this issue.
          
          Best regards,
          Civic Issues Management System
        `,
        timestamp: new Date().toISOString(),
        type: 'SLA_BREACH'
      };

      // Log notification (in real app, this would be sent via email/SMS service)
      console.log('SLA Breach Notification:', notification);
      
      // Here you would integrate with:
      // - Email service (SendGrid, AWS SES, etc.)
      // - SMS service (Twilio, AWS SNS, etc.)
      // - Push notification service
      // - Database to log the notification
      
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to send SLA breach notification:', error);
      throw error;
    }
  }

  /**
   * Check all complaints and send notifications for SLA breaches
   */
  static async checkAndNotifyBreaches(complaints: Complaint[]): Promise<void> {
    const breachedComplaints = complaints.filter(complaint => 
      this.isSLABreached(complaint) && 
      complaint.status !== 'Resolved' && 
      !complaint.escalatedToHigherAuthority
    );

    for (const complaint of breachedComplaints) {
      try {
        await this.notifyHigherAuthority(complaint);
        
        // Mark as escalated to prevent duplicate notifications
        // In real app, this would update the database
        complaint.escalatedToHigherAuthority = true;
        
      } catch (error) {
        console.error(`Failed to notify higher authority for complaint ${complaint.complaintId}:`, error);
      }
    }
  }

  /**
   * Get SLA status display text and color
   */
  static getSLAStatusDisplay(complaint: Complaint): { text: string; colorClass: string } {
    const isBreach = this.isSLABreached(complaint);
    const secondsLeft = this.getSecondsUntilDeadline(complaint);

    if (complaint.status === 'Resolved') {
      return {
        text: 'Resolved',
        colorClass: 'bg-green-100 text-green-800'
      };
    }

    if (isBreach) {
      return {
        text: 'Breached',
        colorClass: 'bg-red-100 text-red-800'
      };
    }

    if (secondsLeft < 12) {
      return {
        text: `${Math.ceil(secondsLeft)}s left`,
        colorClass: 'bg-red-100 text-red-800'
      };
    }

    if (secondsLeft < 24) {
      return {
        text: `${Math.ceil(secondsLeft)}s left`,
        colorClass: 'bg-yellow-100 text-yellow-800'
      };
    }

    return {
      text: `${Math.ceil(secondsLeft)}s left`,
      colorClass: 'bg-green-100 text-green-800'
    };
  }
}
