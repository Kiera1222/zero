"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  itemId: string | null;
  senderId: string;
  receiverId: string;
  sender?: {
    id: string;
    name: string | null;
    image: string | null;
  };
  receiver?: {
    id: string;
    name: string | null;
    image: string | null;
  };
  item?: {
    id: string;
    name: string;
    image: string | null;
  } | null;
}

type ConversationPartner = {
  id: string;
  name: string | null;
  image: string | null;
  messages: Message[];
  lastMessage: Message;
  itemId?: string | null;
};

// Extend the Session type to include our User type
declare module "next-auth" {
  interface Session {
    user: User;
  }
}

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<{
    sent: Message[];
    received: Message[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // Check if user is authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/messages");
    }
  }, [status, router]);

  // Fetch messages
  useEffect(() => {
    async function fetchMessages() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/messages");
        
        if (!response.ok) {
          throw new Error("Failed to fetch messages");
        }
        
        const data = await response.json();
        setMessages(data);
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setIsLoading(false);
      }
    }

    if (session?.user) {
      fetchMessages();
    }
  }, [session]);

  // Organize messages by conversation partner
  const conversations = messages
    ? Object.values(
        [...messages.sent, ...messages.received].reduce((acc: Record<string, ConversationPartner>, message: Message) => {
          const isOutgoing = message.senderId === session?.user?.id;
          const partnerId = isOutgoing ? message.receiverId : message.senderId;
          const partner = isOutgoing ? message.receiver : message.sender;
          
          if (!partner) return acc;
          
          if (!acc[partnerId]) {
            acc[partnerId] = {
              id: partnerId,
              name: partner.name,
              image: partner.image,
              messages: [message],
              lastMessage: message,
              itemId: message.itemId,
            };
          } else {
            acc[partnerId].messages.push(message);
            
            // Update last message if this one is newer
            const currentLastDate = new Date(acc[partnerId].lastMessage.createdAt);
            const thisMessageDate = new Date(message.createdAt);
            
            if (thisMessageDate > currentLastDate) {
              acc[partnerId].lastMessage = message;
            }
          }
          
          return acc;
        }, {})
      ).sort((a, b) => {
        return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
      })
    : [];

  const selectedConversationMessages = selectedConversation
    ? conversations.find((c) => c.id === selectedConversation)?.messages.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
    : [];

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyContent.trim() || !selectedConversation) return;
    
    try {
      setSendingReply(true);
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: replyContent,
          receiverId: selectedConversation,
          itemId: conversations.find((c) => c.id === selectedConversation)?.itemId || null,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to send message");
      }
      
      // Refresh messages
      const messagesResponse = await fetch("/api/messages");
      const messagesData = await messagesResponse.json();
      setMessages(messagesData);
      
      // Clear reply content
      setReplyContent("");
    } catch (err: any) {
      setError(err.message || "Something went wrong sending your reply");
    } finally {
      setSendingReply(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'long' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Messages</h1>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg">
        {conversations.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-500">No messages yet</h3>
            <p className="mt-2 text-gray-400">
              Start by browsing items and contacting owners.
            </p>
            <Link 
              href="/items" 
              className="mt-4 inline-block bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Browse Items
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 h-[600px]">
            {/* Conversation list */}
            <div className="border-r border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Conversations</h2>
              </div>
              <div className="overflow-y-auto h-[540px]">
                {conversations.map((conversation) => (
                  <div 
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation.id)}
                    className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                      selectedConversation === conversation.id ? 'bg-green-50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {conversation.image ? (
                          <img
                            className="h-10 w-10 rounded-full"
                            src={conversation.image}
                            alt={conversation.name || "User"}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-green-700 font-medium">
                              {conversation.name?.charAt(0) || "U"}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {conversation.name || "User"}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {conversation.lastMessage.content}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400">
                          {formatDate(conversation.lastMessage.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Message view */}
            <div className="md:col-span-2 flex flex-col h-full">
              {selectedConversation ? (
                <>
                  <div className="p-4 border-b border-gray-200 flex items-center space-x-2">
                    {conversations.find((c) => c.id === selectedConversation)?.image ? (
                      <img
                        className="h-8 w-8 rounded-full"
                        src={conversations.find((c) => c.id === selectedConversation)?.image || ""}
                        alt={conversations.find((c) => c.id === selectedConversation)?.name || "User"}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-green-700 font-medium">
                          {conversations.find((c) => c.id === selectedConversation)?.name?.charAt(0) || "U"}
                        </span>
                      </div>
                    )}
                    <h2 className="text-lg font-medium text-gray-900">
                      {conversations.find((c) => c.id === selectedConversation)?.name || "User"}
                    </h2>
                    
                    {conversations.find((c) => c.id === selectedConversation)?.itemId && (
                      <Link 
                        href={`/items/${conversations.find((c) => c.id === selectedConversation)?.itemId}`}
                        className="ml-auto text-sm text-green-600 hover:text-green-700"
                      >
                        View Item
                      </Link>
                    )}
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {selectedConversationMessages?.map((message) => (
                      <div 
                        key={message.id}
                        className={`flex ${message.senderId === session?.user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            message.senderId === session?.user?.id 
                            ? 'bg-green-600 text-white' 
                            : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <p>{message.content}</p>
                          <div className={`text-xs mt-1 ${message.senderId === session?.user?.id ? 'text-green-100' : 'text-gray-500'}`}>
                            {new Date(message.createdAt).toLocaleString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="p-4 border-t border-gray-200">
                    <form onSubmit={handleSendReply} className="flex space-x-2">
                      <input
                        type="text"
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-black"
                        disabled={sendingReply}
                      />
                      <button
                        type="submit"
                        disabled={sendingReply || !replyContent.trim()}
                        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                          sendingReply || !replyContent.trim() ? 'opacity-70 cursor-not-allowed' : ''
                        }`}
                      >
                        {sendingReply ? 'Sending...' : 'Send'}
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-gray-500">Select a conversation</h3>
                    <p className="mt-1 text-sm text-gray-400">
                      Choose a conversation from the list to view messages
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 