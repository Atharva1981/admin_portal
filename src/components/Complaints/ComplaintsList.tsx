import React, { useState } from 'react';
import { useComplaints } from '../../hooks/useComplaints';
import { Complaint, ComplaintFilters } from '../../services/complaintService';

interface ComplaintsListProps {
  filters?: ComplaintFilters;
}

const ComplaintsList: React.FC<ComplaintsListProps> = ({ filters = {} }) => {
  const {
    complaints,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    stats
  } = useComplaints(filters);

  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-red-100 text-red-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Resolved': return 'bg-green-100 text-green-800';
      case 'Closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && complaints.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading complaints</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={refresh}
                className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Complaints</h3>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Open</h3>
            <p className="text-2xl font-bold text-red-600">{stats.byStatus.Open || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">In Progress</h3>
            <p className="text-2xl font-bold text-yellow-600">{stats.byStatus['In Progress'] || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Resolved</h3>
            <p className="text-2xl font-bold text-green-600">{stats.byStatus.Resolved || 0}</p>
          </div>
        </div>
      )}

      {/* Complaints List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Complaints from User Portal
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Real-time complaints submitted by citizens
          </p>
        </div>
        
        <ul className="divide-y divide-gray-200">
          {complaints.map((complaint) => (
            <li key={complaint.id} className="hover:bg-gray-50">
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {complaint.title}
                      </h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                        {complaint.status}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                        {complaint.priority}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 truncate">
                      {complaint.description}
                    </p>
                    <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                      <span>Category: {complaint.category}</span>
                      <span>•</span>
                      <span>Location: {complaint.location.city}, {complaint.location.pincode}</span>
                      <span>•</span>
                      <span>Department: {complaint.department}</span>
                    </div>
                    <div className="mt-1 flex items-center text-xs text-gray-400">
                      <span>Submitted by: {complaint.user.name} ({complaint.user.email})</span>
                      <span className="ml-4">
                        {complaint.createdAt.toDate().toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => setSelectedComplaint(complaint)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm font-medium"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Load More Button */}
        {hasMore && (
          <div className="px-4 py-3 bg-gray-50 text-center">
            <button
              onClick={loadMore}
              disabled={loading}
              className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>

      {/* Complaint Detail Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Complaint Details
                </h3>
                <button
                  onClick={() => setSelectedComplaint(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Title</h4>
                  <p className="text-sm text-gray-900">{selectedComplaint.title}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Description</h4>
                  <p className="text-sm text-gray-900">{selectedComplaint.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Status</h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedComplaint.status)}`}>
                      {selectedComplaint.status}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Priority</h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(selectedComplaint.priority)}`}>
                      {selectedComplaint.priority}
                    </span>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Location</h4>
                  <p className="text-sm text-gray-900">
                    {selectedComplaint.location.address}, {selectedComplaint.location.city}, {selectedComplaint.location.pincode}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Submitted By</h4>
                  <p className="text-sm text-gray-900">
                    {selectedComplaint.user.name} ({selectedComplaint.user.email})
                    {selectedComplaint.user.phone && ` - ${selectedComplaint.user.phone}`}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Submitted On</h4>
                  <p className="text-sm text-gray-900">
                    {selectedComplaint.createdAt.toDate().toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintsList;