import { fetchUserComplaints, UserComplaint, ComplaintFilters } from './userComplaintsService';

export interface DashboardStats {
  totalIssues: number;
  resolved: number;
  pending: number;
  escalated: number;
  slaBreached: number;
}

export interface StatsFilters {
  dateFrom?: Date;
  dateTo?: Date;
  department?: string;
  category?: string;
  priority?: string;
}

export class DashboardStatsService {
  /**
   * Calculate SLA breach status for a complaint
   * @param complaint - The complaint to check
   * @returns boolean indicating if SLA is breached
   */
  private static isSLABreached(complaint: UserComplaint): boolean {
    if (complaint.status === 'resolved') return false;
    
    const createdAt = complaint.createdAt;
    if (!createdAt) return false;
    
    // Convert Firestore timestamp to Date
    const createdDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    const now = new Date();
    
    // SLA rules based on priority (in hours)
    const slaHours = {
      'High': 24,
      'Medium': 72,
      'Low': 168
    };
    
    const priority = complaint.priority || 'Medium';
    const slaLimit = slaHours[priority as keyof typeof slaHours] || 72;
    
    const hoursSinceCreated = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
    return hoursSinceCreated > slaLimit;
  }

  /**
   * Get real-time dashboard statistics
   * @param filters - Optional filters to apply
   * @returns Promise<DashboardStats>
   */
  static async getDashboardStats(filters: StatsFilters = {}): Promise<DashboardStats> {
    try {
      // Build complaint filters
      const complaintFilters: ComplaintFilters = {};
      
      if (filters.dateFrom) {
        complaintFilters.dateFrom = filters.dateFrom;
      }
      if (filters.dateTo) {
        complaintFilters.dateTo = filters.dateTo;
      }
      if (filters.department) {
        complaintFilters.department = filters.department;
      }
      if (filters.category) {
        complaintFilters.category = filters.category;
      }
      if (filters.priority) {
        complaintFilters.priority = filters.priority;
      }

      // Fetch complaints with filters
      const complaints = await fetchUserComplaints({
        limitCount: 1000, // Get more complaints for accurate stats
        filters: complaintFilters
      });

      // Calculate statistics
      const totalIssues = complaints.length;
      
      const resolved = complaints.filter(complaint => 
        complaint.status?.toLowerCase() === 'resolved'
      ).length;
      
      const pending = complaints.filter(complaint => {
        const status = complaint.status?.toLowerCase();
        return status === 'submitted' || status === 'in-progress' || status === 'open';
      }).length;
      
      const escalated = complaints.filter(complaint => 
        complaint.status?.toLowerCase() === 'escalated'
      ).length;
      
      const slaBreached = complaints.filter(complaint => 
        this.isSLABreached(complaint)
      ).length;

      console.log(`📊 Dashboard Stats: Total=${totalIssues}, Resolved=${resolved}, Pending=${pending}, Escalated=${escalated}, SLA Breached=${slaBreached}`);

      return {
        totalIssues,
        resolved,
        pending,
        escalated,
        slaBreached
      };
      
    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error);
      // Return zero stats on error
      return {
        totalIssues: 0,
        resolved: 0,
        pending: 0,
        escalated: 0,
        slaBreached: 0
      };
    }
  }

  /**
   * Get statistics with real-time updates
   * @param callback - Function to call when stats update
   * @param filters - Optional filters to apply
   * @returns Unsubscribe function
   */
  static listenToDashboardStats(
    callback: (stats: DashboardStats) => void,
    filters: StatsFilters = {}
  ): () => void {
    let isActive = true;
    
    const updateStats = async () => {
      if (!isActive) return;
      
      try {
        const stats = await this.getDashboardStats(filters);
        if (isActive) {
          callback(stats);
        }
      } catch (error) {
        console.error('❌ Error in stats listener:', error);
        if (isActive) {
          callback({
            totalIssues: 0,
            resolved: 0,
            pending: 0,
            escalated: 0,
            slaBreached: 0
          });
        }
      }
    };

    // Initial load
    updateStats();
    
    // Set up periodic updates (every 30 seconds)
    const interval = setInterval(updateStats, 30000);
    
    // Return unsubscribe function
    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }

  /**
   * Get department-wise statistics
   * @param filters - Optional filters to apply
   * @returns Promise<Record<string, DashboardStats>>
   */
  static async getDepartmentStats(filters: StatsFilters = {}): Promise<Record<string, DashboardStats>> {
    try {
      const complaints = await fetchUserComplaints({
        limitCount: 1000,
        filters: filters
      });

      const departmentStats: Record<string, DashboardStats> = {};
      
      // Group complaints by department
      const departmentGroups = complaints.reduce((groups, complaint) => {
        const dept = complaint.department || 'Unassigned';
        if (!groups[dept]) {
          groups[dept] = [];
        }
        groups[dept].push(complaint);
        return groups;
      }, {} as Record<string, UserComplaint[]>);

      // Calculate stats for each department
      Object.entries(departmentGroups).forEach(([department, deptComplaints]) => {
        const totalIssues = deptComplaints.length;
        
        const resolved = deptComplaints.filter(c => 
          c.status?.toLowerCase() === 'resolved'
        ).length;
        
        const pending = deptComplaints.filter(c => {
          const status = c.status?.toLowerCase();
          return status === 'submitted' || status === 'in-progress' || status === 'open';
        }).length;
        
        const escalated = deptComplaints.filter(c => 
          c.status?.toLowerCase() === 'escalated'
        ).length;
        
        const slaBreached = deptComplaints.filter(c => 
          this.isSLABreached(c)
        ).length;

        departmentStats[department] = {
          totalIssues,
          resolved,
          pending,
          escalated,
          slaBreached
        };
      });

      return departmentStats;
      
    } catch (error) {
      console.error('❌ Error fetching department stats:', error);
      return {};
    }
  }
}

export default DashboardStatsService;
