import React, { useState, useMemo } from 'react';
import { List, Check, Clock, AlertTriangle, Filter } from 'lucide-react';
import StatsCard from '../UI/StatsCard';
import IssuesMap from '../Dashboard/IssuesMap';
import ComplaintsList from '../Complaints/ComplaintsList';
import UserComplaintsTest from '../UserComplaints/UserComplaintsTest';
import DepartmentMappingTest from '../DepartmentMapping/DepartmentMappingTest';
import { mockIssues } from '../../data/mockData';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [activeTab, setActiveTab] = useState<'internal' | 'user-complaints' | 'user-test' | 'dept-mapping'>('internal');

  // Filter issues based on user role and department
  const filteredIssues = useMemo(() => {
    let filtered = mockIssues;

    // Role-based filtering
    if (user?.role === 'Department Head' || user?.role === 'Staff') {
      filtered = filtered.filter(issue => issue.department === user.department);
    }

    // Apply status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(issue => issue.status === statusFilter);
    }

    // Apply category filter
    if (categoryFilter !== 'All') {
      filtered = filtered.filter(issue => issue.category === categoryFilter);
    }

    return filtered;
  }, [user, statusFilter, categoryFilter]);

  // Calculate real-time stats
  const stats = useMemo(() => {
    const total = filteredIssues.length;
    const resolved = filteredIssues.filter(issue => issue.status === 'Resolved').length;
    const pending = filteredIssues.filter(issue => issue.status === 'Open' || issue.status === 'In Progress').length;
    const escalated = filteredIssues.filter(issue => issue.status === 'Escalated').length;
    
    // Calculate SLA breaches
    const slaBreached = filteredIssues.filter(issue => {
      const now = new Date();
      const deadline = new Date(issue.slaDeadline);
      return now > deadline && issue.status !== 'Resolved';
    }).length;

    return {
      totalIssues: total,
      resolved,
      pending,
      escalated,
      slaBreached
    };
  }, [filteredIssues]);

  // Calculate trends (mock data for now)
  const trends = {
    total: { value: 12, isPositive: true },
    resolved: { value: 8, isPositive: true },
    pending: { value: 5, isPositive: false },
    escalated: { value: 2, isPositive: false }
  };

  const recentIssues = filteredIssues.slice(0, 5);

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
          value={stats.totalIssues}
          icon={List}
          color="blue"
          trend={trends.total}
        />
        <StatsCard
          title="Resolved"
          value={stats.resolved}
          icon={Check}
          color="green"
          trend={trends.resolved}
        />
        <StatsCard
          title="Pending"
          value={stats.pending}
          icon={Clock}
          color="yellow"
          trend={trends.pending}
        />
        <StatsCard
          title="Escalated"
          value={stats.escalated}
          icon={AlertTriangle}
          color="red"
          trend={trends.escalated}
        />
        <StatsCard
          title="SLA Breached"
          value={stats.slaBreached}
          icon={AlertTriangle}
          color="red"
          trend={{ value: 0, isPositive: false }}
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
          <h3 className="text-lg font-semibold text-gray-900">Recent Issues</h3>
          <p className="text-sm text-gray-600 mt-1">
            Showing {recentIssues.length} of {filteredIssues.length} issues
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentIssues.map((issue) => {
                const isSlaBreached = new Date() > new Date(issue.slaDeadline);
                const timeUntilDeadline = new Date(issue.slaDeadline).getTime() - new Date().getTime();
                const hoursUntilDeadline = Math.ceil(timeUntilDeadline / (1000 * 60 * 60));

                return (
                  <tr key={issue.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {issue.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {issue.imageUrl ? (
                        <img
                          src={issue.imageUrl}
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
                      {issue.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{issue.location}</div>
                        <div className="text-gray-500 text-xs">{issue.ward}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {issue.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {issue.assignedTo || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        issue.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                        issue.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                        issue.status === 'Escalated' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {issue.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        issue.priority === 'High' ? 'bg-red-100 text-red-800' :
                        issue.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {issue.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        isSlaBreached ? 'bg-red-100 text-red-800' :
                        hoursUntilDeadline < 24 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {isSlaBreached ? 'Breached' : `${hoursUntilDeadline}h left`}
                      </span>
                    </td>
                  </tr>
                );
              })}
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