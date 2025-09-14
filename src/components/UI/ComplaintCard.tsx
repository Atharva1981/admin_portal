import React, { useState } from 'react';
import { Calendar, MapPin, User, FileText, Clock } from 'lucide-react';
import StatusDropdown from './StatusDropdown';
import { useAuth } from '../../contexts/AuthContext';

interface ComplaintCardProps {
  complaint: {
    complaintId: string;
    userId: string;
    userName: string;
    category: string;
    description: string;
    status: string;
    priority?: string;
    department?: string;
    assignedTo?: string;
    address?: string;
    createdAt: any;
    updatedAt?: any;
  };
  onUpdate?: () => void;
}

const ComplaintCard: React.FC<ComplaintCardProps> = ({ complaint, onUpdate }) => {
  const { user } = useAuth();
  const [localComplaint, setLocalComplaint] = useState(complaint);

  const handleStatusUpdate = (newStatus: string) => {
    // Update local state immediately for UI responsiveness
    setLocalComplaint(prev => ({
      ...prev,
      status: newStatus,
      updatedAt: new Date()
    }));

    // Notify parent component to refresh data
    onUpdate?.();
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              #{localComplaint.complaintId}
            </h3>
            <span className="text-sm text-gray-500">•</span>
            <span className="text-sm font-medium text-blue-600">
              {localComplaint.category}
            </span>
            {localComplaint.priority && (
              <>
                <span className="text-sm text-gray-500">•</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(localComplaint.priority)}`}>
                  {localComplaint.priority} Priority
                </span>
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
            <div className="flex items-center space-x-1">
              <User className="h-4 w-4" />
              <span>{localComplaint.userName}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(localComplaint.createdAt)}</span>
            </div>
            {localComplaint.updatedAt && (
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>Updated: {formatDate(localComplaint.updatedAt)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Status Dropdown */}
        <StatusDropdown
          currentStatus={localComplaint.status}
          complaintId={localComplaint.complaintId}
          userId={user?.id || 'admin'}
          onStatusUpdate={handleStatusUpdate}
        />
      </div>

      {/* Description */}
      <div className="mb-4">
        <div className="flex items-start space-x-2">
          <FileText className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <p className="text-gray-700 text-sm leading-relaxed">
            {localComplaint.description}
          </p>
        </div>
      </div>

      {/* Location */}
      {localComplaint.address && (
        <div className="mb-4">
          <div className="flex items-start space-x-2">
            <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-gray-600 text-sm">
              {localComplaint.address}
            </p>
          </div>
        </div>
      )}

      {/* Assignment Info */}
      {(localComplaint.department || localComplaint.assignedTo) && (
        <div className="border-t border-gray-100 pt-4">
          <div className="flex flex-wrap gap-4 text-sm">
            {localComplaint.department && (
              <div>
                <span className="text-gray-500">Department:</span>
                <span className="ml-1 font-medium text-gray-900">
                  {localComplaint.department}
                </span>
              </div>
            )}
            {localComplaint.assignedTo && (
              <div>
                <span className="text-gray-500">Assigned to:</span>
                <span className="ml-1 font-medium text-gray-900">
                  {localComplaint.assignedTo}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintCard;
