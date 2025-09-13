import React from 'react';
import { MapPin, Filter } from 'lucide-react';

const IssuesMap: React.FC = () => {
  const mockIssuePoints = [
    { id: 1, lat: 40.7128, lng: -74.0060, type: 'Pothole', status: 'Open' },
    { id: 2, lat: 40.7589, lng: -73.9851, type: 'Streetlight', status: 'In Progress' },
    { id: 3, lat: 40.7505, lng: -73.9934, type: 'Garbage', status: 'Resolved' },
    { id: 4, lat: 40.7614, lng: -73.9776, type: 'Water Leakage', status: 'Escalated' },
  ];

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
          <p className="text-sm text-gray-600">Visualize issues by location</p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
          <Filter size={16} />
          <span>Filters</span>
        </button>
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
          
          {/* Issue markers */}
          {mockIssuePoints.map((point, index) => (
            <div
              key={point.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              style={{
                left: `${25 + index * 20}%`,
                top: `${30 + index * 15}%`
              }}
            >
              <MapPin className={`h-6 w-6 ${getMarkerColor(point.status)} drop-shadow-lg group-hover:scale-110 transition-transform`} />
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {point.type} - {point.status}
              </div>
            </div>
          ))}
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