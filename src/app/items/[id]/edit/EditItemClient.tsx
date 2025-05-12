'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import ClientMap from '@/components/ClientMap';
import { Item } from '@/lib/types';

// Default location (London)
const DEFAULT_LOCATION: [number, number] = [51.505, -0.09];

interface EditItemClientProps {
  itemId: string;
}

export default function EditItemClient({ itemId }: EditItemClientProps) {
  const router = useRouter();
  const { data: session } = useSession();

  const [item, setItem] = useState<Item | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState('');
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [mapKey, setMapKey] = useState(Date.now()); // 用於強制重新渲染地圖
  const [locationSearch, setLocationSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 只在初次載入和 itemId 變化時獲取數據，移除 status 依賴以避免無限循環
  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }

    const fetchItem = async () => {
      try {
        setStatus('loading');
        const response = await fetch(`/api/items/${itemId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch item');
        }
        const data = await response.json();
        setItem(data);
        setName(data.name);
        setDescription(data.description);
        setCondition(data.condition || 'Good');
        setLocation([data.latitude, data.longitude]);
        setImageUrl(data.imageUrl || '');
        setStatus('success');
        
        // 設置新的 mapKey 以強制重新渲染地圖
        setMapKey(Date.now());
      } catch (error) {
        console.error('Error fetching item:', error);
        setStatus('error');
        setError('Failed to load item. Please try again.');
      }
    };

    fetchItem();
  }, [itemId, router, session]);

  const handleLocationSelect = (lat: number, lng: number) => {
    setLocation([lat, lng]);
    console.log("Location selected:", lat, lng);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setError('只能上传图片文件');
      return;
    }

    // 文件大小限制为 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError('图片太大，最大允许 5MB');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      
      // 创建 FormData 实例
      const formData = new FormData();
      formData.append('file', file);
      
      console.log(`正在上传图片: ${file.name}, 类型: ${file.type}, 大小: ${Math.round(file.size / 1024)}KB`);
      
      // 发送上传请求
      const response = await fetch('/api/items/upload', {
        method: 'POST',
        body: formData,
      });
      
      // 检查响应状态
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`上传错误 (${response.status}):`, errorText);
        
        // 尝试解析错误信息
        let errorMessage = '图片上传失败';
        let errorDetails = '';
        
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
          if (errorData.details) {
            errorDetails = errorData.details;
          }
        } catch (e) {
          console.error('无法解析错误响应:', e);
          errorMessage = `上传失败 (HTTP ${response.status})`;
        }
        
        throw new Error(`${errorMessage}${errorDetails ? ': ' + errorDetails : ''}`);
      }
      
      // 解析成功响应
      const data = await response.json();
      
      if (!data.url) {
        throw new Error('服务器未返回图片URL');
      }
      
      console.log('图片上传成功，使用 data URL');
      setImageUrl(data.url);
      
    } catch (error) {
      console.error('图片上传错误:', error);
      setError(`上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 表单验证
    if (!name) {
      setError('物品名称不能为空');
      return;
    }
    
    if (!description) {
      setError('物品描述不能为空');
      return;
    }
    
    if (!location) {
      setError('请选择一个位置');
      return;
    }
    
    try {
      setStatus('loading');
      setError(null);
      
      // 准备提交数据
      const itemData = {
        name,
        description,
        condition,
        latitude: location[0],
        longitude: location[1],
        imageUrl,
      };
      
      console.log(`更新物品 ${itemId}:`, JSON.stringify(itemData, null, 2));
      
      // 发送更新请求
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });
      
      // 处理响应
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`更新错误 (${response.status}):`, errorText);
        
        // 尝试解析错误消息
        let errorMessage = '更新失败';
        let errorDetails = '';
        
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
          if (errorData.message) {
            errorDetails = errorData.message;
          } else if (errorData.details) {
            errorDetails = errorData.details;
          }
        } catch (e) {
          console.error('无法解析错误响应:', e);
          errorMessage = `更新失败 (HTTP ${response.status})`;
        }
        
        throw new Error(`${errorMessage}${errorDetails ? ': ' + errorDetails : ''}`);
      }
      
      // 处理成功响应
      const updatedItem = await response.json();
      console.log('物品更新成功:', updatedItem);
      
      // 更新状态并跳转
      setStatus('success');
      router.push(`/items/${itemId}`);
    } catch (error) {
      console.error('更新物品时出错:', error);
      setStatus('error');
      setError(`更新失败: ${error instanceof Error ? error.message : '未知错误'}`);
      
      // 滚动到顶部以显示错误消息
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLocationSearch = async (query: string) => {
    setLocationSearch(query);
    
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }
    
    try {
      setIsSearching(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
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

  const handleSelectSearchResult = (result: any) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    
    if (!isNaN(lat) && !isNaN(lon)) {
      setLocation([lat, lon]);
      setLocationSearch(result.display_name);
      setSearchResults([]);
      // Force map to re-render with new location
      setMapKey(Date.now());
    }
  };

  if (!session) {
    return null; // Will redirect in useEffect
  }
  
  if (status === 'loading' && !item) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4" />
            <div className="h-64 bg-gray-200 rounded" />
            <div className="h-8 bg-gray-200 rounded w-1/2" />
            <div className="h-32 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error' && !item) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900">Error</h1>
          <p className="mt-2 text-gray-600">{error || 'An error occurred while loading the item.'}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md"
          >
            Go Back
          </button>
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

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Item</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-black"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-black"
              required
            />
          </div>

          <div>
            <label htmlFor="condition" className="block text-sm font-medium text-gray-700">
              Condition
            </label>
            <select
              id="condition"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-black"
              required
            >
              <option value="New">New</option>
              <option value="Like New">Like New</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
            </select>
          </div>

          <div>
            <label htmlFor="locationSearch" className="block text-sm font-medium text-gray-700">
              Search Location
            </label>
            <div className="relative">
              <input
                type="text"
                id="locationSearch"
                value={locationSearch}
                onChange={(e) => handleLocationSearch(e.target.value)}
                placeholder="Search for an address or district"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-black"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image
            </label>
            {imageUrl ? (
              <div className="relative h-64 mb-4">
                <img 
                  src={imageUrl} 
                  alt="Item preview" 
                  className="w-full h-full object-cover rounded-md"
                />
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center bg-gray-100 rounded-md mb-2">
                <p className="text-gray-500">No image selected</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
            {uploading && (
              <div className="mt-2 flex items-center text-sm text-gray-600">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location (Click to set)
            </label>
            <div className="h-64 bg-gray-100 rounded-md overflow-hidden">
              {location && (
                <div className="h-full" key={mapKey}>
                  <ClientMap
                    center={location}
                    zoom={13}
                    onLocationSelect={handleLocationSelect}
                    items={[{
                      id: itemId,
                      name: name,
                      description: description,
                      condition: condition,
                      latitude: location[0],
                      longitude: location[1],
                      userId: '',
                      createdAt: new Date(),
                      updatedAt: new Date()
                    }]}
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={status === 'loading' || uploading}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {status === 'loading' ? 'Updating...' : 'Update Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 