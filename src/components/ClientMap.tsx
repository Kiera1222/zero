"use client";

import { useState, useEffect, useRef } from 'react';
import { Item } from '@/lib/types';
import dynamic from 'next/dynamic';

// Default coordinates (London)
const DEFAULT_CENTER: [number, number] = [51.505, -0.09];
const DEFAULT_ZOOM = 13;

interface ClientMapProps {
  items?: Item[];
  center?: [number, number] | null;
  zoom?: number;
  onLocationSelect?: (lat: number, lng: number) => void;
}

// Dynamically import map component (no SSR) to avoid server-side rendering issues
const MapWithNoSSR = dynamic(
  () => import('./MapImpl'),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center"
        style={{ minHeight: '300px' }}
      >
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          <p className="mt-4 text-gray-600">Loading map...</p>
        </div>
      </div>
    ),
  }
);

/**
 * Client-side map component
 * Wraps Leaflet map for client-side rendering
 */
export default function ClientMap(props: ClientMapProps) {
  // State and refs - always maintain the same order
  const [isMounted, setIsMounted] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // First useEffect - ensure client-side rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Second useEffect - ensure proper dimensions
  // This hook must always be present regardless of isMounted value
  useEffect(() => {
    // Only run the actual logic if mounted
    if (isMounted && mapContainerRef.current) {
      // Ensuring the container has proper height
      if (mapContainerRef.current.clientHeight < 300) {
        mapContainerRef.current.style.height = '300px';
      }
      
      // Force layout recalculation
      window.dispatchEvent(new Event('resize'));
    }
  }, [isMounted]);

  // Show loading indicator during server-side rendering or initial load
  if (!isMounted) {
    return (
      <div
        className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center"
        style={{ minHeight: '300px' }}
      >
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          <p className="mt-4 text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-full" 
      style={{ minHeight: '300px' }}
    >
      <MapWithNoSSR {...props} />
    </div>
  );
} 