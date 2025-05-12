"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import ClientMap from "@/components/ClientMap";

// Default location (London)
const DEFAULT_LOCATION: [number, number] = [51.505, -0.09];

export default function NewItemPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    condition: "good",
    latitude: "",
    longitude: "",
    image: null as File | null,
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Helper function for user re-registration
  const handleReregister = () => {
    signOut({ callbackUrl: "/register" });
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          // Validate coordinates before setting them
          if (typeof lat === "number" && typeof lng === "number" && 
              !isNaN(lat) && !isNaN(lng)) {
            setUserLocation([lat, lng]);
            
            // Also set as initial selected location
            setSelectedLocation([lat, lng]);
            setFormData(prev => ({
              ...prev,
              latitude: lat.toString(),
              longitude: lng.toString(),
            }));
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          setUserLocation(DEFAULT_LOCATION);
        }
      );
    } else {
      setUserLocation(DEFAULT_LOCATION);
    }
  }, []);

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedLocation([lat, lng]);
    setFormData(prev => ({
      ...prev,
      latitude: lat.toString(),
      longitude: lng.toString(),
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file");
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }
      
      setFormData(prev => ({ ...prev, image: file }));
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name.trim()) {
      setError("Please enter a name for your item");
      return;
    }
    
    if (!formData.description.trim()) {
      setError("Please enter a description for your item");
      return;
    }
    
    if (!formData.image) {
      setError("Please upload an image of your item");
      return;
    }
    
    if (!formData.latitude || !formData.longitude) {
      setError("Please select a location on the map");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // 添加调试日志
      console.log("Sending form data:", {
        name: formData.name,
        description: formData.description,
        condition: formData.condition,
        latitude: formData.latitude,
        longitude: formData.longitude,
        image: formData.image ? `Image size: ${formData.image.size}` : null
      });
      
      // Create form data for multipart upload
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("condition", formData.condition);
      formDataToSend.append("latitude", formData.latitude);
      formDataToSend.append("longitude", formData.longitude);
      if (formData.image) {
        formDataToSend.append("image", formData.image);
      }
      
      console.log("Sending POST request to /api/items");
      const response = await fetch("/api/items", {
        method: "POST",
        body: formDataToSend,
      });
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        // Capture response text for debugging
        const responseText = await response.text();
        console.error("Raw response text:", responseText);
        
        // Try to parse as JSON
        let errorData = {};
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          console.error("Failed to parse response as JSON:", e);
        }
        
        console.error("Create item error details:", errorData);
        
        // Special handling for user not found error
        if (response.status === 404 && (errorData as any).error === "User not found") {
          // Database might have been reset, need to log out and register again
          setError("Your user account doesn't exist in the database. This might be because the database was reset. Please log out and register again.");
          // Optional: provide a button to guide user to log out
          return;
        }
        
        throw new Error((errorData as any).error || "Failed to create item");
      }
      
      console.log("Item created successfully");
      router.push("/items");
    } catch (error) {
      console.error("Error creating item:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        console.error("Unknown error type:", error);
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Share an Item</h1>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                <p>{error}</p>
                {error.includes("Your user account doesn't exist") && (
                  <button
                    onClick={handleReregister}
                    className="mt-2 text-sm bg-red-600 text-white py-1 px-3 rounded hover:bg-red-700"
                  >
                    Log out and register again
                  </button>
                )}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Item Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-black"
                    placeholder="What are you sharing?"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-black"
                    placeholder="Describe your item in detail..."
                    required
                  ></textarea>
                </div>
                
                <div>
                  <label htmlFor="condition" className="block text-sm font-medium text-gray-700">
                    Condition
                  </label>
                  <select
                    id="condition"
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-black"
                    required
                  >
                    <option value="like-new">Like New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="worn">Worn</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Item Image
                  </label>
                  <div className="mt-1 flex items-center space-x-6">
                    <div className="flex-shrink-0 h-32 w-32 border rounded-md overflow-hidden bg-gray-100">
                      {previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-400">
                          No image
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none">
                        Upload Image
                        <input
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={handleImageChange}
                          required
                        />
                      </label>
                      <p className="mt-2 text-xs text-gray-500">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <p className="mt-1 text-sm text-gray-500 mb-2">
                    Click on the map to select the pickup location
                  </p>
                  <div className="h-64 border rounded-md overflow-hidden">
                    <ClientMap 
                      items={[]}
                      center={userLocation}
                      zoom={13}
                      onLocationSelect={handleLocationSelect}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="mr-3 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {loading ? "Saving..." : "Share Item"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 