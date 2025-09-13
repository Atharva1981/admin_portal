export interface Issue {
  id: string;
  category: string;
  location: string;
  ward: string;
  department: string;
  assignedTo?: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Escalated' | 'New';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  reportedOn: string;
  slaDeadline: string;
  description: string;
  imageUrl?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Department {
  id: string;
  category: string;
  city: string;
  zone: string;
  departmentName: string;
  contactEmail: string;
  slaHours: number;
}

export interface DashboardStats {
  totalIssues: number;
  resolved: number;
  pending: number;
  escalated: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'Department Head' | 'Staff';
  department?: string;
}

export interface Notification {
  id: string;
  type: 'assignment' | 'sla_breach' | 'escalation';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}