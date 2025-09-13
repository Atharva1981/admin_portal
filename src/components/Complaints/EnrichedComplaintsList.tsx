import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  AlertTriangle, 
  XCircle, 
  MapPin, 
  User, 
  Building,
  Eye
} from 'lucide-react';
import { 
  fetchEnrichedComplaints, 
  listenToEnrichedComplaints, 
  EnrichedComplaint, 
  EnrichedComplaintFilters 
} from '../../services/enrichedComplaintService';

const EnrichedComplaintsList: React.FC = () => {
  const [complaints, setComplaints] = useState<EnrichedComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<EnrichedComplaintFilters>({});
  const [selectedComplaint, setSelectedComplaint] = useState<EnrichedComplaint | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch complaints on component mount
  useEffect(() => {
    const loadComplaints = async () => {
      try {
        setLoading(true);
        const enrichedComplaints = await fetchEnrichedComplaints({
          limitCount: 100,
          filters
        });
        setComplaints(enrichedComplaints);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load complaints');
        console.error('Error loading complaints:', err);
      } finally {
        setLoading(false);
      }
    };

    loadComplaints();
  }, [filters]);

  // Set up real-time listener
  useEffect(() => {
    const unsubscribe = listenToEnrichedComplaints(
      (updatedComplaints) => {
        setComplaints(updatedComplaints);
        setLoading(false);
      },
      { limitCount: 100, filters }
    );

    return () => unsubscribe();
  }, [filters]);

  // Filter complaints based on search term
  const filteredComplaints = useMemo(() => {
    if (!searchTerm) return complaints;
    
    const term = searchTerm.toLowerCase();
    return complaints.filter(complaint => 
      complaint.complaintId.toLowerCase().includes(term) ||
      complaint.category.toLowerCase().includes(term) ||
      complaint.city.toLowerCase().includes(term) ||
      complaint.assignedDepartment.toLowerCase().includes(term) ||
      complaint.userName.toLowerCase().includes(term) ||
      complaint.description.toLowerCase().includes(term)
    );
  }, [complaints, searchTerm, filters]);

  // Get unique values for filter dropdowns
  const filterOptions = useMemo(() => {
    const categories = [...new Set(complaints.map(c => c.category))];
    const cities = [...new Set(complaints.map(c => c.city))];
    const departments = [...new Set(complaints.map(c => c.assignedDepartment))];
    const statuses = [...new Set(complaints.map(c => c.processingStatus))];
    const priorities = [...new Set(complaints.map(c => c.priority))];

    return { categories, cities, departments, statuses, priorities };
  }, [complaints]);

  const handleFilterChange = (key: keyof EnrichedComplaintFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-purple-100 text-purple-800';
      case 'escalated': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSlaStatus = (complaint: EnrichedComplaint) => {
    if (!complaint.slaDeadline) return { text: 'No SLA', color: 'bg-gray-100 text-gray-800' };
    
    const now = new Date();
    const deadline = new Date(complaint.slaDeadline);
    const isBreached = now > deadline && complaint.processingStatus !== 'resolved';
    
    if (isBreached) {
      return { text: 'SLA Breached', color: 'bg-red-100 text-red-800' };
    }
    
    const hoursLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60));
    if (hoursLeft < 24) {
      return { text: `${hoursLeft}h left`, color: 'bg-yellow-100 text-yellow-800' };
    }
    
    return { text: `${Math.ceil(hoursLeft / 24)}d left`, color: 'bg-green-100 text-green-800' };
  };

  const ComplaintModal = ({ complaint }: { complaint: EnrichedComplaint }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Complaint Details - {complaint.complaintId}
            </h2>
            <button
              onClick={() => setShowModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle size={24} />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Complaint Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <p className="text-gray-900">{complaint.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-gray-900">{complaint.description}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Location</label>
                  <p className="text-gray-900">{complaint.address || `${complaint.city}, ${complaint.pincode}`}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Priority</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(complaint.priority)}`}>
                    {complaint.priority}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">User Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-gray-900">{complaint.userName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-gray-900">{complaint.userPhone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">User ID</label>
                  <p className="text-gray-900 font-mono text-sm">{complaint.userId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Submitted</label>
                  <p className="text-gray-900">{complaint.formattedCreatedAt}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Department Assignment */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Department Assignment</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Assigned Department</label>
                <p className="text-gray-900 font-medium">{complaint.assignedDepartment}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Higher Authority</label>
                <p className="text-gray-900">{complaint.higherAuthority}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Mapping Status</label>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    complaint.isDefaultMapping ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {complaint.isDefaultMapping ? 'Default Mapping' : 'Auto-Mapped'}
                  </span>
                  {complaint.isDefaultMapping && (
                    <span className="text-xs text-yellow-600">Needs manual review</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Status and Timeline */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Status & Timeline</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Processing Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(complaint.processingStatus)}`}>
                  {complaint.processingStatus.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Days Since Created</label>
                <p className="text-gray-900">{complaint.daysSinceCreated} days</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">SLA Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSlaStatus(complaint).color}`}>
                  {getSlaStatus(complaint).text}
                </span>
              </div>
            </div>
          </div>

          {/* Image */}
          {complaint.imageUrl && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Attached Image</h3>
              <img
                src={complaint.imageUrl}
                alt="Complaint"
                className="max-w-full h-auto rounded-lg border border-gray-200"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading enriched complaints...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="text-red-500 mr-2" size={20} />
          <span className="text-red-700">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Enriched User Complaints ({filteredComplaints.length})
        </h2>
        
        {/* Search and Filters */}
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search complaints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Filters */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <select
              value={filters.category || 'all'}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {filterOptions.categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <select
              value={filters.city || 'all'}
              onChange={(e) => handleFilterChange('city', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Cities</option>
              {filterOptions.cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            
            <select
              value={filters.assignedDepartment || 'all'}
              onChange={(e) => handleFilterChange('assignedDepartment', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Departments</option>
              {filterOptions.departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            
            <select
              value={filters.processingStatus || 'all'}
              onChange={(e) => handleFilterChange('processingStatus', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              {filterOptions.statuses.map(status => (
                <option key={status} value={status}>{status.replace('_', ' ').toUpperCase()}</option>
              ))}
            </select>
            
            <select
              value={filters.priority || 'all'}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Priorities</option>
              {filterOptions.priorities.map(priority => (
                <option key={priority} value={priority}>{priority}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Complaint ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SLA Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredComplaints.map((complaint) => {
                const slaStatus = getSlaStatus(complaint);
                
                return (
                  <tr key={complaint.complaintId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">{complaint.complaintId}</span>
                        {complaint.isDefaultMapping && (
                          <div title="Default mapping - needs review">
          <AlertTriangle className="ml-2 text-yellow-500" size={16} />
        </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {complaint.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <MapPin className="mr-1 text-gray-400" size={14} />
                        <div>
                          <div>{complaint.city}</div>
                          <div className="text-xs text-gray-500">{complaint.pincode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <User className="mr-1 text-gray-400" size={14} />
                        <div>
                          <div>{complaint.userName}</div>
                          <div className="text-xs text-gray-500">{complaint.userPhone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Building className="mr-1 text-gray-400" size={14} />
                        <div>
                          <div className="font-medium">{complaint.assignedDepartment}</div>
                          <div className="text-xs text-gray-500 truncate max-w-32" title={complaint.higherAuthority}>
                            {complaint.higherAuthority}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(complaint.processingStatus)}`}>
                        {complaint.processingStatus.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(complaint.priority)}`}>
                        {complaint.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${slaStatus.color}`}>
                        {slaStatus.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedComplaint(complaint);
                          setShowModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                      >
                        <Eye size={16} className="mr-1" />
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredComplaints.length === 0 && (
          <div className="text-center py-12">
            <AlertTriangle className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500">No complaints found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedComplaint && (
        <ComplaintModal complaint={selectedComplaint} />
      )}
    </div>
  );
};

export default EnrichedComplaintsList;
