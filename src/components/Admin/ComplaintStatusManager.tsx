import React, { useState } from 'react';
import { Clock, CheckCircle, AlertTriangle, User, MessageSquare, Send } from 'lucide-react';
import notificationService from '../../services/notificationService';
import { useAuth } from '../../contexts/AuthContext';

interface ComplaintStatusManagerProps {
  complaint: {
    complaintId: string;
    userId: string;
    category: string;
    description: string;
    status: string;
    assignedTo?: string;
    department?: string;
  };
  onStatusUpdate?: () => void;
}

const ComplaintStatusManager: React.FC<ComplaintStatusManagerProps> = ({ 
  complaint, 
  onStatusUpdate 
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');

  // Mock staff data - replace with actual data from your system
  const departments = [
    'Public Works',
    'Sanitation',
    'Traffic Management',
    'Water & Sewerage',
    'Parks & Recreation'
  ];

  const staffMembers = [
    { id: 'staff-1', name: 'John Smith', department: 'Public Works' },
    { id: 'staff-2', name: 'Sarah Johnson', department: 'Sanitation' },
    { id: 'staff-3', name: 'Mike Wilson', department: 'Traffic Management' },
    { id: 'staff-4', name: 'Lisa Brown', department: 'Water & Sewerage' },
    { id: 'staff-5', name: 'David Lee', department: 'Parks & Recreation' }
  ];

  const handleAssignComplaint = async () => {
    if (!selectedStaff || !selectedDepartment || !user?.uid) return;

    setIsLoading(true);
    try {
      await notificationService.assignComplaint(
        complaint.complaintId,
        selectedStaff,
        selectedDepartment,
        user.uid,
        assignmentNotes || `Assigned to ${staffMembers.find(s => s.id === selectedStaff)?.name} in ${selectedDepartment} department`
      );

      onStatusUpdate?.();
      setAssignmentNotes('');
      
      // Show success message
      alert('Complaint assigned successfully! User will be notified.');
    } catch (error) {
      console.error('Error assigning complaint:', error);
      alert('Failed to assign complaint. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveComplaint = async () => {
    if (!resolutionNotes.trim() || !user?.uid) return;

    setIsLoading(true);
    try {
      await notificationService.resolveComplaint(
        complaint.complaintId,
        user.uid,
        resolutionNotes
      );

      onStatusUpdate?.();
      setResolutionNotes('');
      
      // Show success message
      alert('Complaint resolved successfully! User will be notified.');
    } catch (error) {
      console.error('Error resolving complaint:', error);
      alert('Failed to resolve complaint. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'in-progress':
        return <AlertTriangle className="h-5 w-5 text-blue-500" />;
      case 'resolved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Status Management</h3>
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(complaint.status)}`}>
          {getStatusIcon(complaint.status)}
          <span className="capitalize">{complaint.status}</span>
        </div>
      </div>

      {/* Complaint Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Complaint Details</h4>
        <p className="text-sm text-gray-600 mb-2">
          <strong>ID:</strong> {complaint.complaintId}
        </p>
        <p className="text-sm text-gray-600 mb-2">
          <strong>Category:</strong> {complaint.category}
        </p>
        <p className="text-sm text-gray-600">
          <strong>Description:</strong> {complaint.description}
        </p>
        {complaint.assignedTo && (
          <p className="text-sm text-gray-600 mt-2">
            <strong>Assigned to:</strong> {complaint.assignedTo} ({complaint.department})
          </p>
        )}
      </div>

      {/* Assignment Section */}
      {complaint.status === 'submitted' && (
        <div className="mb-6 p-4 border border-blue-200 rounded-lg bg-blue-50">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center">
            <User className="h-4 w-4 mr-2" />
            Assign Complaint
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Staff Member
              </label>
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!selectedDepartment}
              >
                <option value="">Select Staff</option>
                {staffMembers
                  .filter(staff => staff.department === selectedDepartment)
                  .map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assignment Notes (Optional)
            </label>
            <textarea
              value={assignmentNotes}
              onChange={(e) => setAssignmentNotes(e.target.value)}
              placeholder="Add any special instructions or notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <button
            onClick={handleAssignComplaint}
            disabled={!selectedStaff || !selectedDepartment || isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
            <span>{isLoading ? 'Assigning...' : 'Assign & Notify User'}</span>
          </button>
        </div>
      )}

      {/* Resolution Section */}
      {complaint.status === 'in-progress' && (
        <div className="mb-6 p-4 border border-green-200 rounded-lg bg-green-50">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            Resolve Complaint
          </h4>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resolution Details *
            </label>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Describe how the issue was resolved..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={4}
              required
            />
          </div>

          <button
            onClick={handleResolveComplaint}
            disabled={!resolutionNotes.trim() || isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle className="h-4 w-4" />
            <span>{isLoading ? 'Resolving...' : 'Mark as Resolved & Notify User'}</span>
          </button>
        </div>
      )}

      {/* Resolved Status */}
      {complaint.status === 'resolved' && (
        <div className="p-4 border border-green-200 rounded-lg bg-green-50">
          <div className="flex items-center space-x-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">This complaint has been resolved</span>
          </div>
          <p className="text-sm text-green-700 mt-2">
            The user has been notified about the resolution.
          </p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h5 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h5>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => window.open(`mailto:user@example.com?subject=Regarding Complaint ${complaint.complaintId}`)}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            <MessageSquare className="h-3 w-3 inline mr-1" />
            Contact User
          </button>
          <button
            onClick={() => navigator.clipboard.writeText(complaint.complaintId)}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Copy ID
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComplaintStatusManager;
