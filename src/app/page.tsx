'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ClientMap from '@/components/ClientMap';
import { Item } from '@/lib/types';

// Default location (London)
const DEFAULT_LOCATION: [number, number] = [51.505, -0.09];

// Function to calculate distance between coordinates (in km)
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2-lat1);
  const dLon = deg2rad(lon2-lon1); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI/180);
}

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [nearbyItems, setNearbyItems] = useState<Item[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number]>(DEFAULT_LOCATION);
  const [loading, setLoading] = useState(true);
  const [locationSearch, setLocationSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Get user's location or use default
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          if (typeof lat === 'number' && typeof lng === 'number' && 
              !isNaN(lat) && !isNaN(lng)) {
            setUserLocation([lat, lng]);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          // Already using default location from state initialization
        }
      );
    }
  }, []);

  // Update nearby items when user location or items change
  useEffect(() => {
    if (items.length > 0) {
      const itemsWithDistance = items.map(item => {
        const distance = getDistanceFromLatLonInKm(
          userLocation[0], 
          userLocation[1], 
          item.latitude, 
          item.longitude
        );
        return { ...item, distance };
      });
      
      // Sort by distance and limit to 10
      const nearby = [...itemsWithDistance]
        .sort((a, b) => (a.distance || 999) - (b.distance || 999))
        .slice(0, 10);
        
      setNearbyItems(nearby);
    }
  }, [items, userLocation]);

  // Fetch items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch('/api/public/items');
        if (!response.ok) {
          throw new Error('Failed to fetch items');
        }
        const data = await response.json();
        setItems(data);
      } catch (error) {
        console.error('Error fetching items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  // Handle location search
  const handleLocationSearch = async (query: string) => {
    setLocationSearch(query);
    
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }
    
    try {
      setIsSearching(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=en`
      );
      
      if (!response.ok) {
        throw new Error('Location search failed');
      }
      
      const results = await response.json();
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching locations:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle selecting a location from search results
  const handleSelectSearchResult = (result: any) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    
    if (!isNaN(lat) && !isNaN(lon)) {
      setUserLocation([lat, lon]);
      setLocationSearch(result.display_name);
      setSearchResults([]);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Available Items</h1>
          {session && (
            <Link
              href="/items/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
            >
              Share Item
            </Link>
          )}
        </div>

        <div className="mb-6">
          <label htmlFor="locationSearch" className="block text-sm font-medium text-gray-700 mb-1">
            Search Location
          </label>
          <div className="relative">
            <input
              type="text"
              id="locationSearch"
              value={locationSearch}
              onChange={(e) => handleLocationSearch(e.target.value)}
              placeholder="Search for an address or district"
              className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-black"
            />
            {isSearching && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <svg className="animate-spin h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
            
            {searchResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                <ul className="py-1">
                  {searchResults.map((result) => (
                    <li 
                      key={result.place_id} 
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700"
                      onClick={() => handleSelectSearchResult(result)}
                    >
                      {result.display_name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="h-[400px] w-full bg-gray-100 rounded-lg animate-pulse" />
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
            <div className="h-[400px] w-full">
              <ClientMap
                items={items}
                center={userLocation}
                zoom={12}
              />
            </div>
          </div>
        )}

        {/* Nearby items section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Nearby Items</h2>
          
          {nearbyItems.length === 0 ? (
            <p className="text-gray-600">No nearby items found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {nearbyItems.map(item => (
                <Link key={item.id} href={`/items/${item.id}`} className="block">
                  <div className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    <div className="relative h-48 w-full bg-gray-200">
                      {(item.imageUrl || item.image) ? (
                        <Image
                          src={item.imageUrl || item.image || ''}
                          alt={item.name}
                          fill
                          className="object-cover"
                          unoptimized={true}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mt-1">{item.description}</p>
                      {'distance' in item && (
                        <p className="text-sm text-green-600 mt-2">
                          {(item.distance as number).toFixed(1)} km away
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
