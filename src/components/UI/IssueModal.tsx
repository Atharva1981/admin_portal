import React, { useState } from 'react';
import { X, User, Calendar, AlertTriangle, Image as ImageIcon, MapPin } from 'lucide-react';
import { Issue, User as UserType } from '../types';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import ImageModal from './ImageModal';

interface IssueModalProps {
  issue: Issue | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedIssue: Issue) => void;
  availableUsers: UserType[];
}

const IssueModal: React.FC<IssueModalProps> = ({ 
  issue, 
  isOpen, 
  onClose, 
  onUpdate, 
  availableUsers 
}) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    assignedTo: '',
    status: '',
    priority: ''
  });
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  React.useEffect(() => {
    if (issue) {
      setFormData({
        assignedTo: issue.assignedTo || '',
        status: issue.status,
        priority: issue.priority
      });
    }
  }, [issue]);

  if (!isOpen || !issue) return null;

  const handleSave = () => {
    const updatedIssue = {
      ...issue,
      assignedTo: formData.assignedTo || undefined,
      status: formData.status as any,
      priority: formData.priority as any
    };

    onUpdate(updatedIssue);
    
    // Add notification for assignment
    if (formData.assignedTo && formData.assignedTo !== issue.assignedTo) {
      const assignedUser = availableUsers.find(u => u.name === formData.assignedTo);
      addNotification({
        type: 'assignment',
        title: 'New Issue Assignment',
        message: `You have been assigned to issue ${issue.id} - ${issue.category}`
      });
    }

    // Add notification for status change
    if (formData.status !== issue.status) {
      addNotification({
        type: 'assignment',
        title: 'Issue Status Updated',
        message: `Issue ${issue.id} status changed to ${formData.status}`
      });
    }

    setIsEditing(false);
  };

  const isSlaBreached = new Date() > new Date(issue.slaDeadline);
  const timeUntilDeadline = new Date(issue.slaDeadline).getTime() - new Date().getTime();
  const hoursUntilDeadline = Math.ceil(timeUntilDeadline / (1000 * 60 * 60));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Issue Details</h2>
            <p className="text-gray-600">ID: {issue.id}</p>
          </div>
          <div className="flex items-center space-x-2">
            {user?.role === 'Super Admin' || user?.role === 'Department Head' ? (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            ) : null}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Issue Details */}
            <div className="space-y-6">
              {/* Image */}
              {issue.imageUrl && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <ImageIcon size={20} className="mr-2" />
                    Issue Image
                  </h3>
                  <div 
                    className="relative cursor-pointer group"
                    onClick={() => setIsImageModalOpen(true)}
                  >
                    <img
                      src={issue.imageUrl}
                      alt="Issue"
                      className="w-full h-48 object-cover rounded-lg border border-gray-200 group-hover:opacity-90 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white bg-opacity-90 px-3 py-1 rounded-full text-sm font-medium">
                        Click to view full size
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {issue.description}
                </p>
              </div>

              {/* Location */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <MapPin size={20} className="mr-2" />
                  Location Details
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p><strong>Address:</strong> {issue.location}</p>
                  <p><strong>Ward:</strong> {issue.ward}</p>
                  <p><strong>Department:</strong> {issue.department}</p>
                </div>
              </div>
            </div>

            {/* Right Column - Assignment & Status */}
            <div className="space-y-6">
              {/* Status & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  {isEditing ? (
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Escalated">Escalated</option>
                    </select>
                  ) : (
                    <div className={`px-3 py-2 rounded-lg text-center font-medium ${
                      issue.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                      issue.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                      issue.status === 'Escalated' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {issue.status}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  {isEditing ? (
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  ) : (
                    <div className={`px-3 py-2 rounded-lg text-center font-medium ${
                      issue.priority === 'High' ? 'bg-red-100 text-red-800' :
                      issue.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {issue.priority}
                    </div>
                  )}
                </div>
              </div>

              {/* Assignment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <User size={16} className="mr-2" />
                  Assigned To
                </label>
                {isEditing ? (
                  <select
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Unassigned</option>
                    {availableUsers.map((user) => (
                      <option key={user.id} value={user.name}>
                        {user.name} ({user.role})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="px-3 py-2 bg-gray-50 rounded-lg">
                    {issue.assignedTo || 'Unassigned'}
                  </div>
                )}
              </div>

              {/* SLA Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Calendar size={20} className="mr-2" />
                  SLA Information
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reported On:</span>
                    <span>{new Date(issue.reportedOn).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">SLA Deadline:</span>
                    <span className={isSlaBreached ? 'text-red-600 font-medium' : ''}>
                      {new Date(issue.slaDeadline).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time Remaining:</span>
                    <span className={isSlaBreached ? 'text-red-600 font-medium' : ''}>
                      {isSlaBreached ? 'SLA BREACHED' : `${hoursUntilDeadline}h`}
                    </span>
                  </div>
                  {isSlaBreached && (
                    <div className="flex items-center text-red-600 bg-red-50 p-2 rounded">
                      <AlertTriangle size={16} className="mr-2" />
                      <span className="text-sm font-medium">SLA Deadline Exceeded</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Save Button */}
              {isEditing && (
                <button
                  onClick={handleSave}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Save Changes
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal
        imageUrl={issue.imageUrl || ''}
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        title={`${issue.id} - ${issue.category}`}
      />
    </div>
  );
};

export default IssueModal;