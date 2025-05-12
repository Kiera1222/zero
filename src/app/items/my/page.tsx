'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Item } from '@/lib/types';

export default function MyItemsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchMyItems = async () => {
      if (status !== 'authenticated') return;
      
      try {
        const response = await fetch('/api/items/my');
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

    fetchMyItems();
  }, [status]);

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      // Remove the item from the list
      setItems(items.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item. Please try again.');
    }
  };

  if (status === 'loading' || (loading && status === 'authenticated')) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Items</h1>
          <Link
            href="/items/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
          >
            Share New Item
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-gray-600 mb-4">You haven't shared any items yet.</p>
            <Link
              href="/items/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              Share Your First Item
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(item => (
              <div key={item.id} className="bg-white shadow rounded-lg overflow-hidden">
                <div className="relative h-48 w-full">
                  <Image
                    src={item.imageUrl || item.image || '/placeholder-image.jpg'}
                    alt={item.name}
                    fill
                    className="object-cover"
                    unoptimized={true}
                  />
                </div>
                <div className="p-4">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">{item.name}</h2>
                  <p className="text-gray-600 line-clamp-2 mb-3">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/items/${item.id}/edit`}
                      className="text-sm font-medium text-green-600 hover:text-green-500"
                    >
                      Edit Item
                    </Link>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-sm font-medium text-red-600 hover:text-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 