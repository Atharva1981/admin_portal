import React, { useState, useEffect } from 'react';
import { MapPin, Filter, RefreshCw } from 'lucide-react';
import { fetchUserComplaints, UserComplaint } from '../../services/userComplaintsService';

const IssuesMap: React.FC = () => {
  const [userComplaints, setUserComplaints] = useState<UserComplaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Load user complaints for map display
  useEffect(() => {
    loadComplaints();
    
    // Set up auto-refresh every 30 seconds for live updates
    const interval = setInterval(() => {
      loadComplaints();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const complaints = await fetchUserComplaints({ limitCount: 100 });
      setUserComplaints(complaints);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading complaints for map:', error);
    } finally {
      setLoading(false);
    }
  };

  // Convert complaints to map points
  const issuePoints = userComplaints
    .filter(complaint => complaint.latitude && complaint.longitude)
    .map(complaint => ({
      id: complaint.complaintId,
      lat: complaint.latitude,
      lng: complaint.longitude,
      type: complaint.category,
      status: complaint.status || 'Open',
      description: complaint.description,
      address: complaint.address,
      createdAt: complaint.createdAt
    }));

  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'Open': return 'text-yellow-500';
      case 'In Progress': return 'text-blue-500';
      case 'Resolved': return 'text-green-500';
      case 'Escalated': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Live Issues Map</h3>
          <p className="text-sm text-gray-600">
            Visualize issues by location • {issuePoints.length} active issues
            {lastUpdated && (
              <span className="ml-2 text-xs text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={loadComplaints}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
            <Filter size={16} />
            <span>Filters</span>
          </button>
        </div>
      </div>
      
      <div className="p-6">
        {/* Mock map visualization */}
        <div className="bg-gray-100 rounded-lg h-64 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 opacity-50"></div>
          
          {/* Mock city grid */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200">
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Mock roads */}
            <line x1="0" y1="100" x2="400" y2="100" stroke="#d1d5db" strokeWidth="3" />
            <line x1="200" y1="0" x2="200" y2="200" stroke="#d1d5db" strokeWidth="3" />
            <line x1="0" y1="50" x2="400" y2="50" stroke="#e5e7eb" strokeWidth="2" />
            <line x1="100" y1="0" x2="100" y2="200" stroke="#e5e7eb" strokeWidth="2" />
            <line x1="300" y1="0" x2="300" y2="200" stroke="#e5e7eb" strokeWidth="2" />
          </svg>
          
          {/* Live Issue markers */}
          {issuePoints.slice(0, 20).map((point, index) => (
            <div
              key={point.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              style={{
                left: `${Math.min(90, 10 + (index % 8) * 12)}%`,
                top: `${Math.min(85, 15 + Math.floor(index / 8) * 25)}%`
              }}
            >
              <MapPin className={`h-6 w-6 ${getMarkerColor(point.status)} drop-shadow-lg group-hover:scale-110 transition-transform`} />
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white px-3 py-2 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 max-w-xs">
                <div className="font-semibold">{point.type}</div>
                <div className="text-gray-300">{point.status}</div>
                {point.address && (
                  <div className="text-gray-400 text-xs mt-1 truncate">{point.address}</div>
                )}
              </div>
            </div>
          ))}
          
          {/* Show message if no issues with coordinates */}
          {issuePoints.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No issues with location data found</p>
                <p className="text-xs text-gray-400 mt-1">Issues will appear here when users submit complaints with GPS coordinates</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Map legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-yellow-500" />
            <span className="text-gray-600">Open</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-blue-500" />
            <span className="text-gray-600">In Progress</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-green-500" />
            <span className="text-gray-600">Resolved</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-red-500" />
            <span className="text-gray-600">Escalated</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssuesMap;