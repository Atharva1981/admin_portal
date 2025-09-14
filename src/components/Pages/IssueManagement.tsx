import React, { useState, useEffect, useMemo } from 'react';
import { Filter, Search, Download, Eye } from 'lucide-react';
import IssueModal from '../UI/IssueModal';
import { mockIssues } from '../../data/mockData';
import { Issue, User } from '../../types';
import { fetchUserComplaints, UserComplaint } from '../../services/userComplaintsService';
import { mapComplaintToDepartmentFrontend, DepartmentMappingResult } from '../../services/departmentMappingService';
import { fetchDepartmentsByCity, CityDepartment } from '../../services/cityDepartmentService';
import { useAuth } from '../../contexts/AuthContext';

const IssueManagement: React.FC = () => {
  const { user } = useAuth();
  const [userComplaints, setUserComplaints] = useState<UserComplaint[]>([]);
  const [departmentMappings, setDepartmentMappings] = useState<Map<string, DepartmentMappingResult>>(new Map());
  const [cityDepartments, setCityDepartments] = useState<CityDepartment[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [mappingLoading, setMappingLoading] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    location: '',
    priority: '',
    status: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    'All',
    'Water Supply Department',
    'Drainage & Sewerage Department', 
    'Solid Waste Management / Sanitation Department',
    'Public Health Department',
    'Roads & Public Works Department (PWD / Engineering)',
    'Street Lighting / Electrical Department',
    'Parks & Garden Department',
    'Municipal Schools Department',
    'Health Clinics & Hospitals (under Corporation)',
    'Animal Control / Veterinary Department',
    'Environment Department',
    'Other Department'
  ];
  const priorities = ['All', 'High', 'Medium', 'Low'];
  const statuses = ['All', 'Open', 'In Progress', 'Resolved', 'Escalated'];

  // Mock available users for assignment
  const availableUsers: User[] = [
    { id: 'USER-002', name: 'John Smith', email: 'john@roads.gov', role: 'Department Head', department: 'Roads & Infrastructure' },
    { id: 'USER-003', name: 'Sarah Johnson', email: 'sarah@electrical.gov', role: 'Department Head', department: 'Electrical Department' },
    { id: 'USER-004', name: 'Mike Wilson', email: 'mike@water.gov', role: 'Staff', department: 'Water Department' },
    { id: 'USER-005', name: 'Lisa Brown', email: 'lisa@sanitation.gov', role: 'Staff', department: 'Sanitation Department' }
  ];

  // Load city departments when user city changes
  useEffect(() => {
    const loadCityDepartments = async () => {
      if (!user?.city) return;
      
      setLoadingDepartments(true);
      try {
        const departments = await fetchDepartmentsByCity(user.city);
        setCityDepartments(departments);
      } catch (error) {
        console.error('Error loading city departments:', error);
      } finally {
        setLoadingDepartments(false);
      }
    };

    loadCityDepartments();
  }, [user?.city]);

  // Load user complaints filtered by city
  useEffect(() => {
    const loadComplaints = async () => {
      setLoadingComplaints(true);
      try {
        const complaints = await fetchUserComplaints({ limitCount: 100 });
        console.log('🔍 All complaints loaded:', complaints.length);
        console.log('👤 Current user city:', user?.city);
        
        // Filter complaints by user's city if not Super Admin
        const filteredComplaints = user?.role === 'Super Admin' 
          ? complaints 
          : complaints.filter(complaint => {
              // For city admins, only show complaints from their city
              if (user?.city) {
                console.log(`📍 Comparing complaint city "${complaint.city}" with user city "${user.city}"`);
                return complaint.city === user.city;
              }
              // Fallback: if no city assigned, show no complaints
              return false;
            });
        
        console.log('✅ Filtered complaints for city:', filteredComplaints.length);
        setUserComplaints(filteredComplaints);
      } catch (error) {
        console.error('Error loading user complaints:', error);
      } finally {
        setLoadingComplaints(false);
      }
    };

    if (user) {
      loadComplaints();
    }
  }, [user?.city, user?.role]);

  // Force refresh function
  const handleRefresh = async () => {
    setLoadingComplaints(true);
    setDepartmentMappings(new Map());
    try {
      console.log('🔄 Force refreshing complaints...');
      const complaints = await fetchUserComplaints();
      console.log('🔄 Refresh - All complaints:', complaints.length);
      console.log('👤 Refresh - Current user city:', user?.city);
      
      // Apply same city filtering on refresh
      const filteredComplaints = user?.role === 'Super Admin' 
        ? complaints 
        : complaints.filter(complaint => {
            if (user?.city) {
              console.log(`🔄 Refresh - Comparing complaint city "${complaint.city}" with user city "${user.city}"`);
              return complaint.city === user.city;
            }
            return false;
          });
      
      console.log('🔄 Refresh - Filtered complaints:', filteredComplaints.length);
      setUserComplaints(filteredComplaints);
      console.log('✅ Refreshed user complaints:', filteredComplaints.length);
    } catch (error) {
      console.error('❌ Error refreshing complaints:', error);
    } finally {
      setLoadingComplaints(false);
    }
  };


  // Map user complaints to departments
  useEffect(() => {
    const mapComplaintsToDepartments = async () => {
      if (userComplaints.length === 0) return;
      
      setMappingLoading(true);
      const mappings = new Map<string, DepartmentMappingResult>();
      
      try {
        console.log('🔄 Starting department mapping for', userComplaints.length, 'complaints');
        
        for (const complaint of userComplaints) {
          console.log('🔍 Mapping complaint:', complaint.complaintId, '-', complaint.category, 'in', complaint.city);
          
          const mappingResult = await mapComplaintToDepartmentFrontend({
            category: complaint.category,
            city: complaint.city,
            pincode: complaint.pincode,
            description: complaint.description,
            complaintId: complaint.complaintId
          });
          
          console.log('📋 Mapping result for', complaint.complaintId, ':', {
            department: mappingResult.department,
            isDefault: mappingResult.isDefault,
            matchedCriteria: mappingResult.matchedCriteria
          });
          
          mappings.set(complaint.complaintId, mappingResult);
        }
        
        setDepartmentMappings(mappings);
        console.log('✅ Mapped all user complaints to departments:', mappings);
      } catch (error) {
        console.error('❌ Error mapping complaints to departments:', error);
      } finally {
        setMappingLoading(false);
      }
    };
    
    mapComplaintsToDepartments();
  }, [userComplaints]);

  // Filter user complaints based on search and filters
  const filteredComplaints = useMemo(() => {
    return userComplaints.filter(complaint => {
      const departmentMapping = departmentMappings.get(complaint.complaintId);
      
      const matchesSearch = !searchTerm || 
        complaint.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.userName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = !filters.category || 
        complaint.category === filters.category;
      
      const matchesDepartment = !selectedDepartment || 
        departmentMapping?.department === selectedDepartment;
      
      return matchesSearch && matchesCategory && matchesDepartment;
    });
  }, [userComplaints, searchTerm, filters, selectedDepartment, departmentMappings]);

  const handleIssueClick = (issue: Issue) => {
    setSelectedIssue(issue);
    setIsModalOpen(true);
  };

  const handleIssueUpdate = () => {
    // For now, just close the modal since we're working with read-only complaint data
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Issue Management</h1>
        <p className="text-gray-600 mt-2">Manage all reported civic issues</p>
      </div>

      {/* Filter Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter size={20} className="text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search issues..."
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="">Category</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          {/* Department Filter */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            <option value="">All Departments</option>
            {loadingDepartments ? (
              <option disabled>Loading departments...</option>
            ) : (
              cityDepartments.map(dept => (
                <option key={dept.id} value={dept.department}>
                  {dept.department}
                </option>
              ))
            )}
          </select>

          {/* Refresh Button */}
          <button 
            onClick={handleRefresh}
            disabled={loadingComplaints}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <span>Refresh</span>
          </button>


          {/* Export Button */}
          <button className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Issues Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                User Complaints with Department Mapping
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {loadingComplaints ? 'Loading complaints...' : 
                 `Showing ${filteredComplaints.length} of ${userComplaints.length} complaints`}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {loadingComplaints ? (
                <div className="flex items-center space-x-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm font-medium">Loading Complaints...</span>
                </div>
              ) : mappingLoading ? (
                <div className="flex items-center space-x-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm font-medium">Mapping Departments...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Departments Mapped</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issue ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mapped Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Authority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
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
              {loadingComplaints ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="text-gray-500">Loading user complaints...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <div className="text-gray-500">No complaints found</div>
                  </td>
                </tr>
              ) : (
                filteredComplaints.map((complaint) => {
                  const departmentMapping = departmentMappings.get(complaint.complaintId);
                  const createdDate = complaint.createdAt ? new Date(complaint.createdAt) : new Date();
                  const isRecent = new Date().getTime() - createdDate.getTime() < 24 * 60 * 60 * 1000; // Within 24 hours

                  return (
                    <tr key={complaint.complaintId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {complaint.complaintId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {complaint.imageUrl ? (
                          <img
                            src={complaint.imageUrl}
                            alt="Complaint"
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-gray-400 text-xs">No Image</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {complaint.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{complaint.address || complaint.city}</div>
                          <div className="text-gray-500 text-xs">Pincode: {complaint.pincode}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {mappingLoading ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span className="text-gray-500 text-xs">Mapping...</span>
                          </div>
                        ) : departmentMapping ? (
                          <div className="space-y-1">
                            <div className="font-medium text-gray-900">{departmentMapping.department}</div>
                            <div className="flex items-center space-x-1">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                departmentMapping.isDefault 
                                  ? 'bg-orange-100 text-orange-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {departmentMapping.isDefault ? 'Default' : 'Mapped'}
                              </span>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                departmentMapping.status === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {departmentMapping.status}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-gray-500 text-sm">Loading...</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {departmentMapping ? (
                          <div className="max-w-xs">
                            <div className="text-gray-900 truncate" title={departmentMapping.higher_authority}>
                              {departmentMapping.higher_authority}
                            </div>
                            {departmentMapping.matchedCriteria && (
                              <div className="text-gray-500 text-xs mt-1">
                                Matched: {departmentMapping.matchedCriteria.category} in {departmentMapping.matchedCriteria.city}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-gray-500 text-sm">-</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{complaint.userName}</div>
                          <div className="text-gray-500 text-xs">{complaint.userPhone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          isRecent ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {isRecent ? 'New' : 'Open'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          isRecent ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {isRecent ? 'High' : 'Medium'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          isRecent ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {isRecent ? 'On Time' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            // Convert complaint to issue format for modal
                            const issue: Issue = {
                              id: complaint.complaintId,
                              category: complaint.category,
                              location: complaint.address || complaint.city,
                              ward: `Pincode: ${complaint.pincode}`,
                              department: departmentMapping?.department || 'General Grievances',
                              assignedTo: 'Unassigned',
                              status: isRecent ? 'New' : 'Open',
                              priority: isRecent ? 'High' : 'Medium',
                              reportedOn: complaint.createdAt?.toISOString() || new Date().toISOString(),
                              slaDeadline: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), // 72 hours from now
                              description: complaint.description,
                              imageUrl: complaint.imageUrl,
                              coordinates: { lat: complaint.latitude, lng: complaint.longitude }
                            };
                            handleIssueClick(issue);
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Modal */}
      <IssueModal
        issue={selectedIssue}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={handleIssueUpdate}
        availableUsers={availableUsers}
      />
    </div>
  );
};

export default IssueManagement;