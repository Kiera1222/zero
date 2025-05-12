'use client';

import { useEffect, useRef, useState } from 'react';
import { Item } from '@/lib/types';

// Default coordinates (London)
const DEFAULT_CENTER: [number, number] = [51.505, -0.09];
const DEFAULT_ZOOM = 13;

interface MapImplProps {
  items?: Item[];
  center?: [number, number] | null;
  zoom?: number;
  onLocationSelect?: (lat: number, lng: number) => void;
}

export default function MapImpl({ 
  items = [], 
  center = DEFAULT_CENTER, 
  zoom = DEFAULT_ZOOM,
  onLocationSelect
}: MapImplProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);
  // Add initializing state to prevent multiple initialization attempts
  const [isInitializing, setIsInitializing] = useState(false);
  // Add initialization counter to track initialization attempts
  const initializationCountRef = useRef(0);

  // Ensure center coordinates are valid
  const validCenter = center && 
    typeof center[0] === 'number' && 
    typeof center[1] === 'number' && 
    !isNaN(center[0]) && 
    !isNaN(center[1]) 
      ? center 
      : DEFAULT_CENTER;

  // Cleanup function (defined outside useEffect to be reused)
  const cleanup = () => {
    if (mapInstanceRef.current) {
      console.log('Cleaning up existing map instance');
      try {
        mapInstanceRef.current.remove();
      } catch (e) {
        console.error('Error removing map:', e);
      }
      mapInstanceRef.current = null;
      markersRef.current = [];
      setIsMapReady(false);
    }
  };

  // Initialize map
  useEffect(() => {
    // Prevent multiple initializations
    if (isInitializing) {
      console.log('Map initialization already in progress, skipping');
      return;
    }

    // Skip if map already initialized with same props
    if (mapInstanceRef.current && isMapReady) {
      console.log('Map already initialized, updating view');
      try {
        mapInstanceRef.current.setView(validCenter, zoom);
        return;
      } catch (e) {
        console.error('Error updating existing map:', e);
        // Fall through to re-initialize the map
      }
    }

    // Check if the container is actually in DOM
    if (!mapContainerRef.current) {
      console.warn("Map container not found in DOM");
      return;
    }
    
    // Check if container dimensions are valid
    const containerWidth = mapContainerRef.current.clientWidth;
    const containerHeight = mapContainerRef.current.clientHeight;
    
    if (containerWidth <= 0 || containerHeight <= 0) {
      console.warn(`Invalid container dimensions: ${containerWidth}x${containerHeight}`);
      // Force size just in case
      mapContainerRef.current.style.width = "100%";
      mapContainerRef.current.style.height = "300px";
    }

    // Set initializing flag
    setIsInitializing(true);
    initializationCountRef.current += 1;
    const currentInitCount = initializationCountRef.current;
    console.log(`Starting map initialization (attempt ${currentInitCount})`);

    // Clean up existing map instance before creating a new one
    cleanup();

    // Dynamically import Leaflet to avoid SSR issues
    const initializeMap = async () => {
      try {
        // Check if this initialization is still valid
        if (initializationCountRef.current !== currentInitCount) {
          console.log('Newer initialization in progress, aborting this one');
          return;
        }

        // Dynamically import Leaflet
        const L = await import('leaflet');
        
        // Fix Leaflet default icons
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconUrl: '/marker-icon.png',
          iconRetinaUrl: '/marker-icon-2x.png',
          shadowUrl: '/marker-shadow.png',
        });

        // Create map, ensure DOM element exists and has dimensions
        if (mapContainerRef.current) {
          try {
            // Check again if this initialization is still valid
            if (initializationCountRef.current !== currentInitCount) {
              console.log('Newer initialization started, aborting map creation');
              return;
            }

            // Check if container already has a map instance attached
            if ((mapContainerRef.current as any)._leaflet_id) {
              console.warn('Container already has a map instance, cleaning up');
              // Force remove any existing instances from this container
              try {
                // @ts-ignore
                const existingMap = L.DomUtil.getLeafletElm(mapContainerRef.current);
                if (existingMap) {
                  existingMap.remove();
                }
              } catch (e) {
                console.error('Error cleaning up existing map reference:', e);
              }
              
              // Remove leaflet id from container
              delete (mapContainerRef.current as any)._leaflet_id;
            }

            // Create map instance
            if (!mapContainerRef.current) {
              console.error('Map container element is null');
              return;
            }
            
            console.log('Creating new map instance');
            const map = L.map(mapContainerRef.current, {
              // Add these options to prevent issues
              fadeAnimation: false,
              zoomAnimation: false,
              markerZoomAnimation: false
            }).setView(validCenter, zoom);
            
            // Add OpenStreetMap layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
              maxZoom: 19,
            }).addTo(map);

            // Save map instance
            mapInstanceRef.current = map;
            setIsMapReady(true);

            // Add location selection handler if provided
            if (onLocationSelect) {
              map.on('click', (e: any) => {
                const { lat, lng } = e.latlng;
                onLocationSelect(lat, lng);
                
                // Clear all markers and add new one
                markersRef.current.forEach(marker => marker.remove());
                markersRef.current = [];
                
                const marker = L.marker([lat, lng]).addTo(map);
                markersRef.current.push(marker);
              });
            }

            // Add a marker if we have a fixed center but no selection callback
            if (validCenter && !onLocationSelect && items.length === 0) {
              const marker = L.marker(validCenter).addTo(map);
              markersRef.current.push(marker);
            }

            // Add item markers
            if (items && items.length > 0) {
              items.forEach(item => {
                if (item.latitude && item.longitude && 
                    !isNaN(item.latitude) && !isNaN(item.longitude)) {
                  const marker = L.marker([item.latitude, item.longitude]).addTo(map);
                  
                  // Create popup content with improved styling
                  const popupContent = document.createElement('div');
                  popupContent.className = 'p-3';
                  popupContent.style.minWidth = '200px';
                  
                  // Create item image if available
                  if (item.imageUrl || item.image) {
                    const imgContainer = document.createElement('div');
                    imgContainer.className = 'mb-2';
                    imgContainer.style.height = '120px';
                    imgContainer.style.width = '100%';
                    imgContainer.style.position = 'relative';
                    imgContainer.style.overflow = 'hidden';
                    imgContainer.style.borderRadius = '4px';
                    
                    const img = document.createElement('img');
                    img.src = item.imageUrl || item.image || '';
                    img.alt = item.name;
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.objectFit = 'cover';
                    
                    imgContainer.appendChild(img);
                    popupContent.appendChild(imgContainer);
                  }
                  
                  // Item title with better styling
                  const title = document.createElement('h3');
                  title.className = 'font-semibold text-gray-900 mb-1';
                  title.style.fontSize = '16px';
                  title.textContent = item.name;
                  popupContent.appendChild(title);
                  
                  // Add item condition if available
                  if (item.condition) {
                    const condition = document.createElement('p');
                    condition.className = 'text-sm text-gray-600 mb-1';
                    condition.textContent = `Condition: ${item.condition}`;
                    popupContent.appendChild(condition);
                  }
                  
                  // Description preview (truncated)
                  if (item.description) {
                    const description = document.createElement('p');
                    description.className = 'text-sm text-gray-500 mb-2';
                    description.style.display = '-webkit-box';
                    description.style.webkitLineClamp = '2';
                    description.style.webkitBoxOrient = 'vertical';
                    description.style.overflow = 'hidden';
                    description.textContent = item.description;
                    popupContent.appendChild(description);
                  }
                  
                  // Link to item detail
                  const link = document.createElement('a');
                  link.href = `/items/${item.id}`;
                  link.className = 'text-green-600 hover:text-green-700 text-sm font-medium';
                  link.style.display = 'inline-flex';
                  link.style.alignItems = 'center';
                  link.style.marginTop = '8px';
                  link.textContent = 'View details';
                  
                  // Add arrow icon
                  const arrow = document.createElement('span');
                  arrow.innerHTML = '→';
                  arrow.style.marginLeft = '4px';
                  link.appendChild(arrow);
                  
                  popupContent.appendChild(link);

                  // Create a popup with better options
                  const popup = L.popup({
                    maxWidth: 300,
                    minWidth: 200,
                    autoClose: true,
                    closeOnClick: false,
                    className: 'custom-popup'
                  }).setContent(popupContent);
                  
                  marker.bindPopup(popup);
                  markersRef.current.push(marker);
                }
              });
            }

            // Force recalculation of map size after a delay
            // Use multiple delayed attempts to increase chances of success
            const scheduleInvalidateSize = (delay: number, retryCount: number = 0, maxRetries: number = 3) => {
              setTimeout(() => {
                // Double-check that map still exists and is valid
                if (mapInstanceRef.current === map && 
                    map && 
                    !((map as any)._isDestroyed) && 
                    typeof map.invalidateSize === 'function') {
                  try {
                    console.log(`Attempt ${retryCount + 1}: Invalidating map size`);
                    map.invalidateSize({ animate: false, pan: false, debounceMoveend: true });
                    
                    // Schedule another one with more delay as backup
                    if (retryCount < maxRetries) {
                      scheduleInvalidateSize(delay * 2, retryCount + 1, maxRetries);
                    }
                  } catch (error) {
                    console.error(`Error invalidating map size (attempt ${retryCount + 1}):`, error);
                    // Retry with exponential backoff
                    if (retryCount < maxRetries) {
                      scheduleInvalidateSize(delay * 2, retryCount + 1, maxRetries);
                    }
                  }
                } else {
                  console.warn(`Map not available for invalidateSize (attempt ${retryCount + 1})`);
                  // Retry with exponential backoff
                  if (retryCount < maxRetries) {
                    scheduleInvalidateSize(delay * 2, retryCount + 1, maxRetries);
                  }
                }
              }, delay);
            };
            
            // Start the invalidateSize attempts
            scheduleInvalidateSize(500);
            
            console.log('Map initialization completed successfully');
          } catch (error) {
            console.error('Error creating map instance:', error);
          } finally {
            // Reset initializing flag
            setIsInitializing(false);
          }
        }
      } catch (error) {
        console.error('Error loading Leaflet:', error);
        setIsInitializing(false);
      }
    };

    initializeMap();

    // Clean up map when component unmounts
    return cleanup;
  }, [validCenter, zoom, onLocationSelect, items]);

  return (
    <div 
      ref={mapContainerRef} 
      className="map-container w-full h-full rounded-md overflow-hidden" 
      style={{ 
        minHeight: '300px',
        height: '100%',
        position: 'relative',
        border: '1px solid #ddd',
      }}
    />
  );
} 