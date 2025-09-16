
import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { useIssues, IssueCategory, IssueStatus } from '@/contexts/IssueContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Plus, Filter, Layers } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import IssueFilterControl from './IssueFilterControl';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { GOOGLE_MAPS_API_KEY } from '@/config/constants';

// Ayodhya coordinates
const AYODHYA_COORDINATES = { lat: 26.7922, lng: 82.1998 };

interface IssueMapProps {
  onIssueSelect?: (issueId: string) => void;
  height?: string;
  enableFilters?: boolean;
}

const IssueMap: React.FC<IssueMapProps> = ({ 
  onIssueSelect, 
  height = 'h-[calc(100vh-64px)]',
  enableFilters = true
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const { issues } = useIssues();
  const { user } = useAuth();
  const [selectedFilters, setSelectedFilters] = useState<{
    category?: IssueCategory;
    status?: IssueStatus;
  }>({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Filter issues based on the selected filters
  const filteredIssues = issues.filter((issue) => {
    if (selectedFilters.category && issue.category !== selectedFilters.category) {
      return false;
    }
    if (selectedFilters.status && issue.status !== selectedFilters.status) {
      return false;
    }
    return true;
  });

  // Initialize Google Maps when component mounts
  useEffect(() => {
    const initializeMap = async () => {
      if (!GOOGLE_MAPS_API_KEY) return;
      
      if (!map.current && mapContainer.current) {
        try {
    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
            version: "weekly",
            libraries: ["places", "geometry"]
          });

          const { Map } = await loader.importLibrary("maps") as any;
          const { AdvancedMarkerElement } = await loader.importLibrary("marker") as any;

          map.current = new Map(mapContainer.current, {
            center: AYODHYA_COORDINATES,
            zoom: 14,
            mapId: "DEMO_MAP_ID",
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });

          setMapLoaded(true);
          setMapError(null);

          // Add city center marker
          const cityMarker = new AdvancedMarkerElement({
            map: map.current,
            position: AYODHYA_COORDINATES,
            title: "Ayodhya City Center"
          });

        } catch (error) {
          console.error('Error initializing Google Maps:', error);
          setMapError('Failed to initialize map. Please check your API key and connection.');
        }
      }
    };

    initializeMap();

    // Clean up on unmount
    return () => {
      markersRef.current.forEach(marker => {
        marker.setMap(null);
      });
      markersRef.current = [];
    };
  }, []);

  // Add markers when issues or filters change
  useEffect(() => {
    const addMarkers = async () => {
      if (!map.current || !mapLoaded || !GOOGLE_MAPS_API_KEY) return;

      // Clear existing markers
      markersRef.current.forEach(marker => {
        marker.setMap(null);
      });
      markersRef.current = [];

      const loader = new Loader({
        apiKey: GOOGLE_MAPS_API_KEY,
        version: "weekly",
        libraries: ["marker"]
      });

      const { AdvancedMarkerElement } = await loader.importLibrary("marker") as any;
      const { InfoWindow } = await loader.importLibrary("maps") as any;

      // Add markers for filtered issues
      filteredIssues.forEach((issue) => {
        // Create marker element
        const markerEl = document.createElement('div');
        markerEl.className = 'relative cursor-pointer';
        markerEl.style.width = '24px';
        markerEl.style.height = '24px';

        // Create colored pin
        const pin = document.createElement('div');
        pin.className = 'w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-white';
        
        // Set color based on issue status
        switch (issue.status) {
          case 'open':
            pin.style.backgroundColor = '#ef4444'; // red-500
            break;
          case 'in_progress':
            pin.style.backgroundColor = '#f59e0b'; // amber-500
            break;
          case 'resolved':
            pin.style.backgroundColor = '#16a34a'; // green-600
            break;
          default:
            pin.style.backgroundColor = '#3b82f6'; // blue-500
        }

        // Add inner white dot
        const dot = document.createElement('div');
        dot.className = 'w-2 h-2 bg-white rounded-full';
        pin.appendChild(dot);
        markerEl.appendChild(pin);

        const marker = new AdvancedMarkerElement({
          map: map.current,
          position: { lat: issue.location.latitude, lng: issue.location.longitude },
          content: markerEl,
          title: issue.title
        });

        // Create info window
        const infoWindow = new InfoWindow({
          content: `
            <div class="p-2">
              <h3 class="font-medium text-gray-900 text-sm">${issue.title}</h3>
              <p class="text-xs text-gray-600 mt-1">${issue.category.replace('_', ' ')}</p>
              <div class="mt-2 text-right">
                <a href="/issue/${issue.id}" class="text-sm font-medium text-blue-600">View details</a>
              </div>
            </div>
          `
        });

        // Add click listeners
        markerEl.addEventListener('click', () => {
          infoWindow.open(map.current, marker);
          if (onIssueSelect) {
            onIssueSelect(issue.id);
          }
        });

        markersRef.current.push(marker);
      });
    };

    addMarkers();
  }, [issues, filteredIssues, mapLoaded, onIssueSelect]);

  const handleFilterChange = (filters: { category?: IssueCategory; status?: IssueStatus }) => {
    setSelectedFilters(filters);
  };

  return (
    <div className={`relative ${height} w-full`}>
      {!GOOGLE_MAPS_API_KEY && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-20">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-md">
            <h3 className="text-lg font-semibold mb-4">Google Maps API Key Required</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please add your Google Maps API key to <code className="bg-gray-100 px-1 rounded">src/config/constants.ts</code>.
              Get your key from <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Cloud Console</a>.
            </p>
          </div>
        </div>
      )}
      
      <div ref={mapContainer} className="h-full w-full" />
      
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-10">
          <div className="bg-white p-4 rounded shadow-lg text-center">
            <p className="text-red-500 mb-2">{mapError}</p>
            <p className="text-sm text-gray-600">Please check your API key and internet connection.</p>
          </div>
        </div>
      )}
      
      {/* Google Maps controls */}
      {mapLoaded && (
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          {enableFilters && (
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="outline" className="bg-white shadow-md border-0 hover:bg-gray-100">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter Issues
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <div className="p-4 max-w-md mx-auto">
                  <h3 className="text-lg font-semibold mb-4">Filter Issues</h3>
                  <IssueFilterControl onChange={handleFilterChange} />
                </div>
              </DrawerContent>
            </Drawer>
          )}
          
          {user && (
            <Link to="/report">
              <Button className="bg-white text-gray-700 hover:bg-gray-100 shadow-md border-0">
                <Plus className="h-4 w-4 mr-2" />
                Report Issue
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Status indicator */}
      {mapLoaded && (
        <div className="absolute bottom-8 left-4 z-10 bg-white rounded-md shadow-md p-3">
          <div className="text-xs font-medium text-gray-500 mb-2">Issue Status:</div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-xs text-gray-700">Open</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-xs text-gray-700">In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-600"></div>
              <span className="text-xs text-gray-700">Resolved</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueMap;
