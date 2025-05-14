'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
    </div>
  );
}

function NewMessageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const itemId = searchParams.get('item');
  const receiverId = searchParams.get('receiver');
  
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [item, setItem] = useState<any>(null);
  const [receiver, setReceiver] = useState<any>(null);
  const [error, setError] = useState('');

  // Check if user is authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/messages/new');
    }
  }, [status, router]);

  // Fetch item and receiver info
  useEffect(() => {
    const fetchData = async () => {
      if (!itemId || !receiverId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch item details
        if (itemId) {
          const itemResponse = await fetch(`/api/items/${itemId}`);
          if (itemResponse.ok) {
            const itemData = await itemResponse.json();
            setItem(itemData);
          }
        }

        // For demo purposes, we'll get receiver info from the item owner
        // In a production app, you'd have a separate API to fetch user profiles
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load required information');
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchData();
    }
  }, [session, itemId, receiverId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }
    
    if (!receiverId) {
      setError('Recipient information is missing');
      return;
    }
    
    setSending(true);
    
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: message,
          receiverId: receiverId,
          itemId: itemId || null,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }
      
      // Redirect to messages page
      router.push('/messages');
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
      setSending(false);
    }
  };

  if (status === 'loading' || loading) {
    return <LoadingState />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Link href="/messages" className="flex items-center text-green-600 mb-6">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Messages
      </Link>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">New Message</h1>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          {item && (
            <div className="mb-6 p-4 bg-gray-50 rounded-md">
              <h2 className="text-sm font-medium text-gray-500 mb-2">Regarding Item:</h2>
              <div className="flex items-center">
                {item.imageUrl && (
                  <div className="relative h-16 w-16 rounded overflow-hidden mr-3">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <h3 className="font-medium text-gray-900">{item.name}</h3>
                  {item.user && (
                    <p className="text-sm text-gray-500">Owner: {item.user.name}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                id="message"
                rows={6}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-black"
                placeholder="Type your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              ></textarea>
            </div>
            
            <div className="flex justify-end">
              <Link
                href="/messages"
                className="mr-3 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={sending}
                className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function NewMessagePage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <NewMessageContent />
    </Suspense>
  );
} 