import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Filter, RefreshCw } from 'lucide-react';
import { fetchUserComplaints, UserComplaint } from '../../services/userComplaintsService';

const IssuesMap: React.FC = () => {
  const [userComplaints, setUserComplaints] = useState<UserComplaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  // const googleMapRef = useRef<google.maps.Map | null>(null);
  // const markersRef = useRef<google.maps.Marker[]>([]);

  // Initialize Google Maps - Temporarily disabled due to dependency issues
  useEffect(() => {

    const initializeMap = async () => {
      if (!mapRef.current) return;

      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      // Skip Google Maps initialization if no API key is provided
      if (!apiKey) {
        console.warn('Google Maps API key not found. Map functionality disabled.');
        setMapLoaded(false);
        return;
      }

      try {
        const loader = new Loader({
          apiKey: apiKey,
          version: 'weekly',
          libraries: ['places']
        });

        await loader.load();

        // Default center (India - you can adjust this to your city)
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 28.6139, lng: 77.2090 }, // New Delhi coordinates
          zoom: 12,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        });

        googleMapRef.current = map;
        setMapLoaded(true);
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setMapLoaded(false);
      }
    };

    initializeMap();

    // const initializeMap = async () => {
    //   if (!mapRef.current) return;

    //   try {
    //     const loader = new Loader({
    //       apiKey: 'AIzaSyAfcg3SH18uTmWdSsLloBlPCpdwUo9RSkE',
    //       version: 'weekly',
    //       libraries: ['places']
    //     });

    //     await loader.load();

    //     // Default center (India - you can adjust this to your city)
    //     const map = new google.maps.Map(mapRef.current, {
    //       center: { lat: 28.6139, lng: 77.2090 }, // New Delhi coordinates
    //       zoom: 12,
    //       mapTypeId: google.maps.MapTypeId.ROADMAP,
    //       styles: [
    //         {
    //           featureType: 'poi',
    //           elementType: 'labels',
    //           stylers: [{ visibility: 'off' }]
    //         }
    //       ]
    //     });

    //     googleMapRef.current = map;
    //     setMapLoaded(true);
    //   } catch (error) {
    //     console.error('Error loading Google Maps:', error);
    //   }
    // };

    // initializeMap();
    
    // For now, show a placeholder message
    setMapLoaded(false);

  }, []);

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

  // Convert complaints to map points with validation
  const issuePoints = userComplaints
    .filter(complaint => {
      // Validate latitude and longitude are valid numbers
      const lat = parseFloat(complaint.latitude?.toString() || '');
      const lng = parseFloat(complaint.longitude?.toString() || '');
      
      return !isNaN(lat) && !isNaN(lng) && 
             lat >= -90 && lat <= 90 && 
             lng >= -180 && lng <= 180;
    })
    .map(complaint => ({
      id: complaint.complaintId,
      lat: parseFloat(complaint.latitude?.toString() || '0'),
      lng: parseFloat(complaint.longitude?.toString() || '0'),
      type: complaint.category,
      status: complaint.status || 'Open',
      description: complaint.description,
      address: complaint.address,
      createdAt: complaint.createdAt
    }));

  // Update markers when complaints or map changes - Temporarily disabled
  useEffect(() => {

    if (!googleMapRef.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers for each complaint
    issuePoints.forEach(point => {
      // Double-check coordinates before creating marker
      if (isNaN(point.lat) || isNaN(point.lng)) {
        console.warn('Invalid coordinates for complaint:', point.id, point.lat, point.lng);
        return;
      }

      const marker = new google.maps.Marker({
        position: { lat: point.lat, lng: point.lng },
        map: googleMapRef.current,
        title: `${point.type} - ${point.status}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: getMarkerColor(point.status),
          fillOpacity: 0.8,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      });

      // Add info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 250px;">
            <h4 style="margin: 0 0 8px 0; color: #1f2937;">${point.type}</h4>
            <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 12px;"><strong>Status:</strong> ${point.status}</p>
            <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 12px;"><strong>Location:</strong> ${point.address}</p>
            <p style="margin: 0; color: #6b7280; font-size: 12px;"><strong>Description:</strong> ${point.description}</p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(googleMapRef.current, marker);
      });

      markersRef.current.push(marker);
    });

    // Adjust map bounds to fit all markers
    if (issuePoints.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      issuePoints.forEach(point => {
        // Validate coordinates before extending bounds
        if (!isNaN(point.lat) && !isNaN(point.lng)) {
          bounds.extend({ lat: point.lat, lng: point.lng });
        }
      });
      
      // Only fit bounds if we have valid points
      if (!bounds.isEmpty()) {
        googleMapRef.current.fitBounds(bounds);
      }

    // Commenting out Google Maps functionality until dependency is resolved
    // if (!googleMapRef.current || !mapLoaded) return;

    // // Clear existing markers
    // markersRef.current.forEach(marker => marker.setMap(null));
    // markersRef.current = [];

    // // Add new markers for each complaint
    // issuePoints.forEach(point => {
    //   const marker = new google.maps.Marker({
    //     position: { lat: point.lat, lng: point.lng },
    //     map: googleMapRef.current,
    //     title: `${point.type} - ${point.status}`,
    //     icon: {
    //       path: google.maps.SymbolPath.CIRCLE,
    //       scale: 8,
    //       fillColor: getMarkerColor(point.status),
    //       fillOpacity: 0.8,
    //       strokeColor: '#ffffff',
    //       strokeWeight: 2
    //     }
    //   });

    //   // Add info window
    //   const infoWindow = new google.maps.InfoWindow({
    //     content: `
    //       <div style="padding: 8px; max-width: 250px;">
    //         <h4 style="margin: 0 0 8px 0; color: #1f2937;">${point.type}</h4>
    //         <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 12px;"><strong>Status:</strong> ${point.status}</p>
    //         <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 12px;"><strong>Location:</strong> ${point.address}</p>
    //         <p style="margin: 0; color: #6b7280; font-size: 12px;"><strong>Description:</strong> ${point.description}</p>
    //       </div>
    //     `
    //   });

    //   marker.addListener('click', () => {
    //     infoWindow.open(googleMapRef.current, marker);
    //   });

    //   markersRef.current.push(marker);
    // });

    // // Adjust map bounds to fit all markers
    // if (issuePoints.length > 0) {
    //   const bounds = new google.maps.LatLngBounds();
    //   issuePoints.forEach(point => {
    //     bounds.extend({ lat: point.lat, lng: point.lng });
    //   });
    //   googleMapRef.current.fitBounds(bounds);

      
    //   // Ensure minimum zoom level
    //   const listener = google.maps.event.addListener(googleMapRef.current, 'bounds_changed', () => {
    //     if (googleMapRef.current!.getZoom()! > 15) {
    //       googleMapRef.current!.setZoom(15);
    //     }
    //     google.maps.event.removeListener(listener);
    //   });
    // }
  }, [userComplaints, mapLoaded]);

  // const getMarkerColor = (status: string) => {
  //   switch (status) {
  //     case 'Open': return '#f59e0b';
  //     case 'In Progress': return '#3b82f6';
  //     case 'Resolved': return '#10b981';
  //     case 'Escalated': return '#ef4444';
  //     default: return '#6b7280';
  //   }
  // };

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
        {/* Google Maps Container */}
        <div className="rounded-lg h-96 relative overflow-hidden border border-gray-200">
          <div 
            ref={mapRef}
            className="w-full h-full"
            style={{ minHeight: '384px' }}
          />
          
          {/* Loading/Error overlay */}
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center text-gray-500">

                {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? (
                  <>
                    <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin" />
                    <p className="text-sm">Loading Google Maps...</p>
                    <p className="text-xs text-gray-400 mt-1">Make sure you have a valid Google Maps API key</p>
                  </>
                ) : (
                  <>
                    <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm font-medium">Google Maps Unavailable</p>
                    <p className="text-xs text-gray-400 mt-1">Add VITE_GOOGLE_MAPS_API_KEY to .env file</p>
                    <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-xs text-yellow-700">
                        <strong>To enable maps:</strong><br/>
                        1. Get a Google Maps API key<br/>
                        2. Add to .env: VITE_GOOGLE_MAPS_API_KEY=your_key<br/>
                        3. Enable billing in Google Cloud Console
                      </p>
                    </div>
                  </>
                )}

                <MapPin className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Google Maps Temporarily Disabled</p>
                <p className="text-xs text-gray-400 mt-1">Map functionality will be restored once dependencies are resolved</p>

              </div>
            </div>
          )}
          
          {/* Show message if no issues with coordinates */}
          {mapLoaded && issuePoints.length === 0 && (
            <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md p-3 border border-gray-200">
              <div className="flex items-center text-gray-500">
                <MapPin className="h-5 w-5 mr-2" />
                <div>
                  <p className="text-sm font-medium">No location data</p>
                  <p className="text-xs text-gray-400">Complaints will appear when GPS coordinates are available</p>
                </div>
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