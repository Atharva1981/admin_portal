import React, { useState } from 'react';
import { ChevronDown, Clock, AlertTriangle, CheckCircle, XCircle, Loader } from 'lucide-react';
import complaintStatusService, { ComplaintStatus } from '../../services/complaintStatusService';
import { Timestamp } from 'firebase/firestore';

interface StatusDropdownProps {
  currentStatus: string;
  complaintId: string;
  userId: string;
  onStatusUpdate?: (newStatus: string) => void;
  disabled?: boolean;
}

const StatusDropdown: React.FC<StatusDropdownProps> = ({
  currentStatus,
  complaintId,
  userId,
  onStatusUpdate,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const statusOptions: { value: ComplaintStatus; label: string; icon: React.ReactNode; color: string }[] = [
    {
      value: 'submitted',
      label: 'Submitted',
      icon: <Clock className="h-4 w-4" />,
      color: 'text-yellow-600 bg-yellow-50 border-yellow-200'
    },
    {
      value: 'in-progress',
      label: 'In Progress',
      icon: <AlertTriangle className="h-4 w-4" />,
      color: 'text-blue-600 bg-blue-50 border-blue-200'
    },
    {
      value: 'resolved',
      label: 'Resolved',
      icon: <CheckCircle className="h-4 w-4" />,
      color: 'text-green-600 bg-green-50 border-green-200'
    },
    {
      value: 'closed',
      label: 'Closed',
      icon: <XCircle className="h-4 w-4" />,
      color: 'text-gray-600 bg-gray-50 border-gray-200'
    }
  ];

  const getCurrentStatusConfig = () => {
    return statusOptions.find(option => option.value === currentStatus) || statusOptions[0];
  };

  const handleStatusChange = async (newStatus: ComplaintStatus) => {
    if (newStatus === currentStatus || isUpdating) return;

    setIsUpdating(true);
    setIsOpen(false);

    try {
      console.log(`🔄 Attempting to update complaint ${complaintId} from ${currentStatus} to ${newStatus}`);
      console.log(`👤 User ID: ${userId}`);
      
      // Update status using the complaint status service
      await complaintStatusService.updateComplaintStatus(complaintId, {
        status: newStatus,
        updatedBy: userId, // Current admin user ID
        updatedAt: Timestamp.now(),
        notes: `Status manually updated to ${newStatus} by admin`
      });

      // Notify parent component
      onStatusUpdate?.(newStatus);

      console.log(`✅ Status updated to ${newStatus} for complaint ${complaintId}`);
      alert(`✅ Status successfully updated to ${newStatus}`);
    } catch (error) {
      console.error('❌ Error updating status:', error);
      console.error('❌ Error details:', {
        complaintId,
        currentStatus,
        newStatus,
        userId,
        error: error instanceof Error ? error.message : error
      });
      alert(`Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const currentConfig = getCurrentStatusConfig();

  return (
    <div className="relative">
      <button
        onClick={() => !disabled && !isUpdating && setIsOpen(!isOpen)}
        disabled={disabled || isUpdating}
        className={`
          flex items-center space-x-2 px-3 py-2 rounded-lg border text-sm font-medium
          transition-colors duration-200 min-w-[120px] justify-between
          ${currentConfig.color}
          ${disabled || isUpdating 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:opacity-80 cursor-pointer'
          }
        `}
      >
        <div className="flex items-center space-x-2">
          {isUpdating ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : (
            currentConfig.icon
          )}
          <span>{currentConfig.label}</span>
        </div>
        {!disabled && !isUpdating && (
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {isOpen && !disabled && !isUpdating && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="py-1">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusChange(option.value)}
                  disabled={option.value === currentStatus}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-2 text-sm text-left
                    transition-colors duration-150
                    ${option.value === currentStatus
                      ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'hover:bg-gray-50 text-gray-700 cursor-pointer'
                    }
                  `}
                >
                  <span className={option.value === currentStatus ? 'text-gray-400' : option.color.split(' ')[0]}>
                    {option.icon}
                  </span>
                  <span>{option.label}</span>
                  {option.value === currentStatus && (
                    <span className="ml-auto text-xs text-gray-400">(Current)</span>
                  )}
                </button>
              ))}
            </div>
            
            <div className="border-t border-gray-100 px-4 py-2">
              <p className="text-xs text-gray-500">
                Status changes will update related fields and trigger notifications
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StatusDropdown;
