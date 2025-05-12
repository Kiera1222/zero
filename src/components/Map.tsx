"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import { Icon, LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Item } from "@/lib/types";
import Link from "next/link";

export interface MapProps {
  items: Item[];
  center?: [number, number];
  zoom?: number;
  onLocationSelect?: (lat: number, lng: number) => void;
  selectedLocation?: { lat: number; lng: number } | null;
}

// Component to handle map clicks
function LocationMarker({ 
  onLocationSelect, 
  selectedLocation 
}: { 
  onLocationSelect?: (lat: number, lng: number) => void;
  selectedLocation?: { lat: number; lng: number } | null;
}) {
  const map = useMapEvents({
    click: (e) => {
      if (onLocationSelect) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  // Create custom marker icon for selected location
  const locationIcon = new Icon({
    iconUrl: "/images/user-marker.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "/marker-shadow.png",
    shadowSize: [41, 41],
  });

  return selectedLocation ? (
    <Marker position={[selectedLocation.lat, selectedLocation.lng]} icon={locationIcon}>
      <Popup>Selected Location</Popup>
    </Marker>
  ) : null;
}

export default function Map({ 
  items, 
  center = [51.505, -0.09], 
  zoom = 13,
  onLocationSelect,
  selectedLocation
}: MapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // Fix leaflet icon issue on next.js build
    delete (Icon.Default.prototype as any)._getIconUrl;
    
    Icon.Default.mergeOptions({
      iconRetinaUrl: "/marker-icon-2x.png",
      iconUrl: "/marker-icon.png",
      shadowUrl: "/marker-shadow.png",
    });
  }, []);

  // Create custom marker icon
  const customIcon = new Icon({
    iconUrl: "/marker-icon.png",
    iconRetinaUrl: "/marker-icon-2x.png",
    shadowUrl: "/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  if (!isMounted) {
    return <div className="w-full h-full bg-gray-200" />;
  }

  return (
    <MapContainer
      center={center as LatLngExpression}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {items.map((item) => (
        <Marker 
          key={item.id} 
          position={[item.latitude, item.longitude]} 
          icon={customIcon}
        >
          <Popup>
            <div className="w-48">
              <h3 className="font-medium text-lg mb-1">{item.name}</h3>
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.description}</p>
              <Link
                href={`/items/${item.id}`}
                className="text-green-600 hover:text-green-800 font-medium"
              >
                View details
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Add the location marker component if we're in selection mode */}
      {onLocationSelect && (
        <LocationMarker 
          onLocationSelect={onLocationSelect} 
          selectedLocation={selectedLocation} 
        />
      )}
    </MapContainer>
  );
} 