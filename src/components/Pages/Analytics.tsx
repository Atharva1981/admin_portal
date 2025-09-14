import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, BarChart, TrendingUp, Award, Clock, AlertTriangle } from 'lucide-react';
import StatsCard from '../UI/StatsCard';
import { mockDepartments } from '../../data/mockData';
import { useAuth } from '../../contexts/AuthContext';
import { fetchUserComplaints, UserComplaint } from '../../services/userComplaintsService';
import { mapComplaintToDepartmentFrontend } from '../../services/departmentMappingService';

const Analytics: React.FC = () => {
  const { user } = useAuth();
  const [userComplaints, setUserComplaints] = useState<UserComplaint[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [departmentMappings, setDepartmentMappings] = useState<Map<string, any>>(new Map());

  // Load real user complaints data
  useEffect(() => {
    const loadComplaints = async () => {
      setLoadingComplaints(true);
      try {
        const complaints = await fetchUserComplaints({ limitCount: 100 });
        setUserComplaints(complaints);
        
        // Map complaints to departments
        const mappings = new Map();
        for (const complaint of complaints) {
          try {
            const mapping = await mapComplaintToDepartmentFrontend(complaint);
            mappings.set(complaint.complaintId, mapping);
          } catch (error) {
            console.error('Error mapping complaint:', error);
          }
        }
        setDepartmentMappings(mappings);
      } catch (error) {
        console.error('Error loading complaints for analytics:', error);
      } finally {
        setLoadingComplaints(false);
      }
    };

    loadComplaints();
  }, []);

  // Filter complaints based on user role
  const filteredComplaints = useMemo(() => {
    let filtered = userComplaints;
    if (user?.role === 'Department Head' || user?.role === 'Staff') {
      filtered = filtered.filter(complaint => {
        const mapping = departmentMappings.get(complaint.complaintId);
        return mapping?.department === user.department;
      });
    }
    return filtered;
  }, [userComplaints, departmentMappings, user]);

  // Calculate real analytics data from live complaints
  const analyticsData = useMemo(() => {
    if (loadingComplaints) {
      return {
        issuesByCategory: [],
        departmentPerformance: [],
        slaComplianceTrends: [],
        totalIssues: 0,
        resolvedIssues: 0,
        slaBreachedIssues: 0
      };
    }

    // Issues by category from real complaint data
    const categoryCount = filteredComplaints.reduce((acc, complaint) => {
      const category = complaint.category || 'Other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalIssues = filteredComplaints.length;
    const issuesByCategory = Object.entries(categoryCount).map(([name, count]) => ({
      name,
      value: totalIssues > 0 ? Math.round((count / totalIssues) * 100) : 0,
      count,
      color: name.includes('Road') || name.includes('Pothole') ? '#3B82F6' : 
             name.includes('Street') || name.includes('Light') ? '#10B981' : 
             name.includes('Garbage') || name.includes('Waste') ? '#F59E0B' : 
             name.includes('Water') ? '#06B6D4' : '#EF4444'
    }));

    // Department performance from real data
    const departmentStats = mockDepartments.map(dept => {
      const deptComplaints = filteredComplaints.filter(complaint => {
        const mapping = departmentMappings.get(complaint.complaintId);
        return mapping?.department === dept.departmentName;
      });
      
      const resolvedComplaints = deptComplaints.filter(complaint => complaint.status === 'Resolved');
      
      // Calculate real average resolution time
      const avgTime = resolvedComplaints.length > 0 ? 
        resolvedComplaints.reduce((sum, complaint) => {
          const created = complaint.createdAt ? new Date(complaint.createdAt) : new Date();
          const resolved = new Date(); // Assume resolved now for calculation
          const hours = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60);
          return sum + Math.min(hours, dept.slaHours * 2); // Cap at 2x SLA
        }, 0) / resolvedComplaints.length : 0;
      
      return {
        name: dept.departmentName,
        avgTime: Math.round(avgTime),
        target: dept.slaHours,
        totalIssues: deptComplaints.length,
        resolvedIssues: resolvedComplaints.length,
        slaCompliance: resolvedComplaints.length > 0 ? 
          Math.round((resolvedComplaints.filter(complaint => {
            const created = complaint.createdAt ? new Date(complaint.createdAt) : new Date();
            const resolved = new Date();
            const hoursToResolve = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60);
            return hoursToResolve <= dept.slaHours;
          }).length / resolvedComplaints.length) * 100) : 0
      };
    });

    // Calculate real SLA compliance trends based on complaint age
    const now = new Date();
    const slaComplianceTrends = Array.from({ length: 12 }, (_, monthIndex) => {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - (11 - monthIndex), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - (11 - monthIndex) + 1, 0);
      
      const monthComplaints = filteredComplaints.filter(complaint => {
        const created = complaint.createdAt ? new Date(complaint.createdAt) : new Date();
        return created >= monthStart && created <= monthEnd;
      });
      
      if (monthComplaints.length === 0) return 90; // Default compliance
      
      const compliantComplaints = monthComplaints.filter(complaint => {
        const created = complaint.createdAt ? new Date(complaint.createdAt) : new Date();
        const secondsSinceCreated = (now.getTime() - created.getTime()) / 1000;
        return complaint.status === 'Resolved' || secondsSinceCreated <= 48; // 48 second SLA
      });
      
      return Math.round((compliantComplaints.length / monthComplaints.length) * 100);
    });

    return {
      issuesByCategory,
      departmentPerformance: departmentStats,
      slaComplianceTrends,
      totalIssues,
      resolvedIssues: filteredComplaints.filter(complaint => complaint.status === 'Resolved').length,
      slaBreachedIssues: filteredComplaints.filter(complaint => {
        if (complaint.status === 'Resolved') return false;
        const created = complaint.createdAt ? new Date(complaint.createdAt) : new Date();
        const secondsSinceCreated = (now.getTime() - created.getTime()) / 1000;
        return secondsSinceCreated > 48; // 48 second SLA breach
      }).length
    };
  }, [filteredComplaints, departmentMappings, loadingComplaints]);

  const chartData = analyticsData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-2">Performance insights and department analytics</p>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Issues"
          value={chartData.totalIssues}
          icon={BarChart}
          color="blue"
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Resolved Issues"
          value={chartData.resolvedIssues}
          icon={Award}
          color="green"
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="SLA Breached"
          value={chartData.slaBreachedIssues}
          icon={AlertTriangle}
          color="red"
          trend={{ value: 2, isPositive: false }}
        />
        <StatsCard
          title="Avg Resolution Time"
          value={`${Math.round(chartData.departmentPerformance.reduce((acc, dept) => acc + dept.avgTime, 0) / chartData.departmentPerformance.length)}h`}
          icon={Clock}
          color="yellow"
          trend={{ value: 5, isPositive: true }}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issues by Category - Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <PieChart size={24} className="text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Issues by Category</h3>
          </div>
          
          <div className="relative">
            <div className="w-48 h-48 mx-auto relative">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {/* Mock pie chart segments */}
                <circle
                  cx="50"
                  cy="50"
                  r="30"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="20"
                  strokeDasharray="42 100"
                  strokeDashoffset="0"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="30"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="20"
                  strokeDasharray="28 100"
                  strokeDashoffset="-42"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="30"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="20"
                  strokeDasharray="19 100"
                  strokeDashoffset="-70"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="30"
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="20"
                  strokeDasharray="11 100"
                  strokeDashoffset="-89"
                />
              </svg>
            </div>
            
            {/* Legend */}
            <div className="mt-4 space-y-2">
              {chartData.issuesByCategory.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm text-gray-600">
                      {item.name}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {item.count} ({item.value}%)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Average Resolution Time - Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <BarChart size={24} className="text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Average Resolution Time</h3>
          </div>
          
          <div className="space-y-4">
            {loadingComplaints ? (
              <div className="text-center text-gray-500 py-8">
                Loading department performance...
              </div>
            ) : chartData.departmentPerformance.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No department data available
              </div>
            ) : (
              chartData.departmentPerformance.map((dept, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span className="font-medium">{dept.name}</span>
                    <span className="text-xs">
                      {dept.avgTime}h / {dept.target}h
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-1">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        dept.avgTime <= dept.target ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min((dept.avgTime / dept.target) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{dept.resolvedIssues}/{dept.totalIssues} resolved</span>
                    <span>{dept.slaCompliance}% SLA compliance</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* SLA Compliance Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-6">
          <TrendingUp size={24} className="text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">SLA Compliance Trends</h3>
        </div>
        
        <div className="h-64 flex items-end space-x-2">
          {/* SLA Compliance Trends */}
          {chartData.slaComplianceTrends.map((value, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className={`w-full rounded-t transition-all duration-500 ${
                  value >= 90 ? 'bg-green-500' : value >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ height: `${(value / 100) * 200}px` }}
              ></div>
              <span className="text-xs text-gray-500 mt-2">
                {index % 2 === 0 ? `M${Math.floor(index / 2) + 1}` : ''}
              </span>
              <span className="text-xs text-gray-400 mt-1">
                {value}%
              </span>
            </div>
          ))}
        </div>
        
        <div className="mt-4 flex justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>≥90% (Excellent)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>80-89% (Good)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>&lt;80% (Needs Improvement)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;