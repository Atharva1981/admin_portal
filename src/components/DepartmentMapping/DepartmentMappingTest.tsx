import React, { useState, useEffect } from 'react';
import { 
  mapComplaintToDepartment, 
  getDepartmentsByCity,
  getAvailableCategories,
  getAvailableCities,
  Complaint,
  DepartmentMappingResult,
  DepartmentInfo
} from '../../services/departmentMappingService';

const DepartmentMappingTest: React.FC = () => {
  const [testComplaint, setTestComplaint] = useState<Complaint>({
    category: 'Infrastructure',
    city: 'Ranchi',
    pincode: '834001',
    description: 'Test complaint for department mapping',
    complaintId: 'TEST-001'
  });
  
  const [mappingResult, setMappingResult] = useState<DepartmentMappingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<DepartmentInfo[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [categoriesData, citiesData] = await Promise.all([
        getAvailableCategories(),
        getAvailableCities()
      ]);
      setCategories(categoriesData);
      setCities(citiesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const handleMapComplaint = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Mapping complaint to department:', testComplaint);
      const result = await mapComplaintToDepartment(testComplaint);
      setMappingResult(result);
      console.log('✅ Mapping result:', result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to map complaint';
      setError(errorMessage);
      console.error('❌ Error mapping complaint:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGetDepartments = async (city: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`🔍 Getting departments for city: ${city}`);
      const deptData = await getDepartmentsByCity(city);
      setDepartments(deptData);
      console.log(`✅ Found ${deptData.length} departments for ${city}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get departments';
      setError(errorMessage);
      console.error('❌ Error getting departments:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDefaultColor = (isDefault: boolean) => {
    return isDefault ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Department Mapping Test</h1>
        <p className="text-gray-600 mt-2">
          Test the mapComplaintToDepartment function with admin Firestore data
        </p>
      </div>

      {/* Test Complaint Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Complaint</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={testComplaint.category}
              onChange={(e) => setTestComplaint({...testComplaint, category: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            <select
              value={testComplaint.city}
              onChange={(e) => setTestComplaint({...testComplaint, city: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
            <input
              type="text"
              value={testComplaint.pincode || ''}
              onChange={(e) => setTestComplaint({...testComplaint, pincode: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Enter pincode"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <input
              type="text"
              value={testComplaint.description || ''}
              onChange={(e) => setTestComplaint({...testComplaint, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Enter description"
            />
          </div>
        </div>
        
        <div className="mt-4 flex space-x-4">
          <button
            onClick={handleMapComplaint}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Mapping...' : 'Map to Department'}
          </button>
          
          <button
            onClick={() => handleGetDepartments(testComplaint.city)}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
          >
            Get Departments for City
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mapping Result */}
      {mappingResult && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Mapping Result</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Department</h4>
              <p className="text-sm text-gray-900 font-medium">{mappingResult.department}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Higher Authority</h4>
              <p className="text-sm text-gray-900">{mappingResult.higher_authority}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Status</h4>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(mappingResult.status)}`}>
                {mappingResult.status}
              </span>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Match Type</h4>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDefaultColor(mappingResult.isDefault)}`}>
                {mappingResult.isDefault ? 'Default Department' : 'Exact Match'}
              </span>
            </div>
          </div>
          
          {mappingResult.matchedCriteria && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-500">Matched Criteria</h4>
              <p className="text-sm text-gray-900">
                Category: {mappingResult.matchedCriteria.category} | 
                City: {mappingResult.matchedCriteria.city}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Departments List */}
      {departments.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Departments for {testComplaint.city} ({departments.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Higher Authority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {departments.map((dept, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {dept.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {dept.department}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {dept.higher_authority}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(dept.status || '')}`}>
                        {dept.status || 'Unknown'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Available Data Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Data</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Categories</h4>
            <p className="text-sm text-gray-900">{categories.length} available</p>
            <div className="mt-2 text-xs text-gray-500">
              {categories.slice(0, 3).join(', ')}
              {categories.length > 3 && ` +${categories.length - 3} more`}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500">Cities</h4>
            <p className="text-sm text-gray-900">{cities.length} available</p>
            <div className="mt-2 text-xs text-gray-500">
              {cities.slice(0, 3).join(', ')}
              {cities.length > 3 && ` +${cities.length - 3} more`}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500">Departments</h4>
            <p className="text-sm text-gray-900">{departments.length} for selected city</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentMappingTest;