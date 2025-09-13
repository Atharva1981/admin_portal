import { Issue, Department, DashboardStats, User } from '../types';

export const mockIssues: Issue[] = [
  {
    id: 'ISS-2024-001',
    category: 'Pothole',
    location: 'Main Street & 5th Ave',
    ward: 'Ward 12',
    department: 'Roads & Infrastructure',
    assignedTo: 'John Smith',
    status: 'In Progress',
    priority: 'High',
    reportedOn: '2024-01-15T10:30:00Z',
    slaDeadline: '2024-01-17T10:30:00Z',
    description: 'Large pothole causing traffic disruption',
    imageUrl: 'https://images.pexels.com/photos/416978/pexels-photo-416978.jpeg?auto=compress&cs=tinysrgb&w=400',
    coordinates: { lat: 40.7128, lng: -74.0060 }
  },
  {
    id: 'ISS-2024-002',
    category: 'Streetlight',
    location: 'Park Avenue, Block 15',
    ward: 'Ward 8',
    department: 'Electrical Department',
    assignedTo: 'Sarah Johnson',
    status: 'Open',
    priority: 'Medium',
    reportedOn: '2024-01-16T14:20:00Z',
    slaDeadline: '2024-01-20T14:20:00Z',
    description: 'Street light not working for 3 days',
    coordinates: { lat: 40.7589, lng: -73.9851 }
  },
  {
    id: 'ISS-2024-003',
    category: 'Garbage',
    location: 'Residential Complex A-32',
    ward: 'Ward 5',
    department: 'Sanitation Department',
    status: 'Resolved',
    priority: 'Low',
    reportedOn: '2024-01-10T09:15:00Z',
    slaDeadline: '2024-01-12T09:15:00Z',
    description: 'Garbage not collected for 2 days',
    coordinates: { lat: 40.7505, lng: -73.9934 }
  },
  {
    id: 'ISS-2024-004',
    category: 'Water Leakage',
    location: 'Central Plaza',
    ward: 'Ward 3',
    department: 'Water Department',
    assignedTo: 'Mike Wilson',
    status: 'Escalated',
    priority: 'High',
    reportedOn: '2024-01-14T16:45:00Z',
    slaDeadline: '2024-01-16T16:45:00Z',
    description: 'Major water pipe burst affecting multiple buildings',
    coordinates: { lat: 40.7614, lng: -73.9776 }
  }
];

export const mockDepartments: Department[] = [
  {
    id: 'DEPT-001',
    category: 'Pothole',
    city: 'New York',
    zone: 'Manhattan',
    departmentName: 'Roads & Infrastructure',
    contactEmail: 'roads@nyc.gov',
    slaHours: 48
  },
  {
    id: 'DEPT-002',
    category: 'Streetlight',
    city: 'New York',
    zone: 'Manhattan',
    departmentName: 'Electrical Department',
    contactEmail: 'electrical@nyc.gov',
    slaHours: 96
  },
  {
    id: 'DEPT-003',
    category: 'Garbage',
    city: 'New York',
    zone: 'Manhattan',
    departmentName: 'Sanitation Department',
    contactEmail: 'sanitation@nyc.gov',
    slaHours: 24
  },
  {
    id: 'DEPT-004',
    category: 'Water Leakage',
    city: 'New York',
    zone: 'Manhattan',
    departmentName: 'Water Department',
    contactEmail: 'water@nyc.gov',
    slaHours: 24
  }
];

export const mockStats: DashboardStats = {
  totalIssues: 156,
  resolved: 89,
  pending: 52,
  escalated: 15
};

export const mockUser: User = {
  id: 'USER-001',
  name: 'Admin User',
  email: 'admin@cityportal.gov',
  role: 'Super Admin'
};