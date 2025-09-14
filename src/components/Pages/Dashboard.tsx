import React, { useState, useEffect, useMemo } from 'react';
import { List, Check, Clock, AlertTriangle, Filter } from 'lucide-react';
import StatsCard from '../UI/StatsCard';
import IssuesMap from '../Dashboard/IssuesMap';
import ComplaintsList from '../Complaints/ComplaintsList';
import UserComplaintsTest from '../UserComplaints/UserComplaintsTest';
import DepartmentMappingTest from '../DepartmentMapping/DepartmentMappingTest';
import { useAuth } from '../../contexts/AuthContext';
import { SLANotificationService } from '../../services/slaNotificationService';
import { fetchUserComplaints, UserComplaint } from '../../services/userComplaintsService';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [activeTab, setActiveTab] = useState<'internal' | 'user-complaints' | 'user-test' | 'dept-mapping'>('internal');
  const [userComplaints, setUserComplaints] = useState<UserComplaint[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);

  // Load real user complaints data
  useEffect(() => {
    const loadComplaints = async () => {
      setLoadingComplaints(true);
      try {
        const complaints = await fetchUserComplaints({ limitCount: 100 });
        setUserComplaints(complaints);
      } catch (error) {
        console.error('Error loading complaints for dashboard:', error);
      } finally {
        setLoadingComplaints(false);
      }
    };

    loadComplaints();
  }, []);


  // Calculate real-time stats from live complaint data
  const stats = useMemo(() => {
    if (loadingComplaints) {
      return {
        total: 0,
        resolved: 0,
        pending: 0,
        escalated: 0,
        slaBreached: 0
      };
    }

    const total = userComplaints.length;
    const resolved = userComplaints.filter(complaint => complaint.status === 'Resolved').length;
    const pending = userComplaints.filter(complaint => 
      complaint.status === 'Open' || complaint.status === 'In Progress' || !complaint.status
    ).length;
    const escalated = userComplaints.filter(complaint => complaint.status === 'Escalated').length;
    
    // Calculate SLA breaches (complaints older than 72 hours and not resolved)
    const slaBreached = userComplaints.filter(complaint => {
      if (complaint.status === 'Resolved') return false;
      
      const now = new Date();
      const createdAt = complaint.createdAt ? new Date(complaint.createdAt) : new Date();
      const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      
      return hoursDiff > 72; // SLA breach after 72 hours
    }).length;

    return {
      totalIssues: total,
      resolved,
      pending,
      escalated,
      slaBreached
    };
  }, [userComplaints, loadingComplaints]);

  // Calculate trends (mock data for now)
  const trends = {
    total: { value: 12, isPositive: true },
    resolved: { value: 8, isPositive: true },
    pending: { value: 5, isPositive: false },
    escalated: { value: 2, isPositive: false }
  };

  // Filter user complaints for the current user's city
  const cityComplaints = useMemo(() => {
    // Super Admin sees all complaints, city admins see only their city
    if (user?.role === 'Super Admin') {
      return userComplaints.slice(0, 5);
    }
    
    // Get the user's city from their role (e.g., 'Savalade Admin' -> 'savalade')
    const userCity = user?.role.toLowerCase().replace(' admin', '') || '';
    
    return userComplaints
      .filter(complaint => {
        // Filter by the user's city
        const location = complaint.address?.toLowerCase() || '';
        const city = complaint.city?.toLowerCase() || '';
        return location.includes(userCity) || city.includes(userCity);
      })
      .slice(0, 5); // Show only recent 5 issues
  }, [userComplaints, user?.role]);


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Civic Issues Dashboard</h1>
            <p className="text-gray-600 mt-2">
              {user?.role === 'Super Admin' 
                ? 'Monitor, assign, and resolve reported issues efficiently' 
                : `Manage ${user?.department} issues and assignments`
              }
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter size={16} className="text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Status</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Escalated">Escalated</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Categories</option>
                <option value="Pothole">Pothole</option>
                <option value="Garbage">Garbage</option>
                <option value="Streetlight">Streetlight</option>
                <option value="Water Leakage">Water Leakage</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatsCard
          title="Total Issues"
          value={stats.totalIssues || 0}
          icon={List}
          color="blue"
          trend={trends.total}
        />
        <StatsCard
          title="Resolved"
          value={stats.resolved || 0}
          icon={Check}
          color="green"
          trend={trends.resolved}
        />
        <StatsCard
          title="Pending"
          value={stats.pending || 0}
          icon={Clock}
          color="yellow"
          trend={trends.pending}
        />
        <StatsCard
          title="Escalated"
          value={stats.escalated || 0}
          icon={AlertTriangle}
          color="red"
          trend={trends.escalated}
        />
        <StatsCard
          title="SLA Breached"
          value={stats.slaBreached || 0}
          icon={AlertTriangle}
          color="red"
          trend={{ value: 0, isPositive: true }}
        />
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('internal')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'internal'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Internal Issues
            </button>
            {user?.role === 'Super Admin' && (
              <button
                onClick={() => setActiveTab('user-test')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'user-test'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                User Test
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'internal' ? (
        <>
          {/* Map View */}
          <IssuesMap />

          {/* Recent Issues Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Issues - {user?.role === 'Super Admin' ? 'All Cities' : user?.role.replace(' Admin', '')}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {user?.role === 'Super Admin' 
              ? `Showing all ${cityComplaints.length} issues from all cities`
              : `Showing ${cityComplaints.length} issues from ${user?.role.replace(' Admin', '')} in the user app database`
            }
          </p>
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
                  Department
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cityComplaints.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">
                        No {user?.role === 'Super Admin' ? 'Issues' : user?.role.replace(' Admin', '') + ' Issues'} Found
                      </h3>
                      <p className="text-sm text-gray-500">
                        {user?.role === 'Super Admin' 
                          ? 'There are currently no issues reported in the user app database.'
                          : `There are currently no issues reported from ${user?.role.replace(' Admin', '')} location in the user app database.`
                        }
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                cityComplaints.map((complaint: UserComplaint) => {
                  // Extend complaint with SLA properties
                  const extendedComplaint = {
                    ...complaint,
                    higher_authority: complaint.department || 'Municipal Corporation',
                    escalatedToHigherAuthority: false
                  };
                  
                  const slaStatus = SLANotificationService.getSLAStatusDisplay(extendedComplaint);
                  
                  // Check and notify if SLA breached
                  if (SLANotificationService.isSLABreached(extendedComplaint) && 
                      complaint.status !== 'Resolved' && 
                      !extendedComplaint.escalatedToHigherAuthority) {
                    SLANotificationService.notifyHigherAuthority(extendedComplaint);
                  }

                  return (
                    <tr key={complaint.complaintId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {complaint.complaintId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {complaint.imageUrl ? (
                          <img
                            src={complaint.imageUrl}
                            alt="Issue"
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-gray-400 text-xs">No Image</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {complaint.category || 'General'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{complaint.address || 'Savalade'}</div>
                          <div className="text-gray-500 text-xs">{complaint.city || 'Savalade'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {complaint.department || 'Municipal Corporation'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          complaint.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                          complaint.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                          complaint.status === 'Escalated' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {complaint.status || 'Open'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          complaint.priority === 'High' ? 'bg-red-100 text-red-800' :
                          complaint.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {complaint.priority || 'Medium'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${slaStatus.colorClass}`}>
                          {slaStatus.text}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      ) : activeTab === 'user-complaints' ? (
        <ComplaintsList />
      ) : activeTab === 'user-test' ? (
        <UserComplaintsTest />
      ) : (
        <DepartmentMappingTest />
      )}
    </div>
  );
};

export default Dashboard;