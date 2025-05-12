'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { Item } from '@/lib/types';

interface ItemDetailClientProps {
  itemId: string;
}

export default function ItemDetailClient({ itemId }: ItemDetailClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationText, setLocationText] = useState<string>('Loading location...');

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await fetch(`/api/items/${itemId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch item');
        }
        const data = await response.json();
        setItem(data);
      } catch (error) {
        console.error('Error fetching item:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [itemId]);

  useEffect(() => {
    if (item?.latitude && item?.longitude) {
      const fetchLocationText = async () => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${item.latitude}&lon=${item.longitude}&zoom=18&addressdetails=1&accept-language=en`
          );
          const data = await response.json();
          
          if (data.address) {
            const address = data.address;
            const parts = [];
            
            if (address.city) parts.push(address.city);
            else if (address.town) parts.push(address.town);
            else if (address.village) parts.push(address.village);
            
            if (address.state || address.state_district) 
              parts.push(address.state || address.state_district);
            
            if (address.country) parts.push(address.country);
            
            setLocationText(parts.join(', '));
          } else {
            setLocationText('Location information not available');
          }
        } catch (error) {
          console.error('Error fetching location text:', error);
          setLocationText('Could not retrieve location details');
        }
      };
      
      fetchLocationText();
    }
  }, [item]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mb-8" />
          <div className="h-96 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.back()}
            className="mb-8 text-gray-600 hover:text-gray-900 flex items-center"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Item not found</h1>
            <p className="mt-2 text-gray-600">The item you&apos;re looking for doesn&apos;t exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-8 text-gray-600 hover:text-gray-900 flex items-center"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="relative h-96 rounded-lg overflow-hidden">
            {(item.imageUrl || item.image) ? (
              <Image
                src={item.imageUrl || item.image || ''}
                alt={item.name}
                fill
                className="object-cover"
                unoptimized={true}
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                No image available
              </div>
            )}
          </div>

          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{item.name}</h1>
            <p className="text-gray-600 mb-6">{item.description}</p>

            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-medium text-gray-900">Condition</h2>
                <p className="mt-1 text-gray-600">{item.condition}</p>
              </div>

              <div>
                <h2 className="text-sm font-medium text-gray-900">Location</h2>
                <p className="mt-1 text-gray-600">{locationText}</p>
              </div>

              <div className="mt-8">
                <button
                  className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors"
                  onClick={async () => {
                    if (!session) {
                      router.push('/login?callbackUrl=' + encodeURIComponent(`/items/${item.id}`));
                      return;
                    }
                    
                    router.push(`/messages/new?item=${item.id}&receiver=${item.user?.id}`);
                  }}
                >
                  Contact
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 