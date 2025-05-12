'use client';

import { useState } from 'react';
import ClientMap from '@/components/ClientMap';
import Link from 'next/link';

export default function MapTestPage() {
  const [location, setLocation] = useState<[number, number]>([51.505, -0.09]);
  
  const handleLocationSelect = (lat: number, lng: number) => {
    setLocation([lat, lng]);
    console.log('Selected location:', lat, lng);
  };
  
  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">地圖測試頁面</h1>
          <Link href="/" className="text-green-600 hover:text-green-700">
            返回首頁
          </Link>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-2">
            這是一個測試頁面，用於確認 Leaflet 地圖是否正常顯示。點擊地圖任意位置來選擇位置。
          </p>
          <p className="text-gray-600 mb-4">
            當前選擇的位置：緯度 {location[0].toFixed(6)}，經度 {location[1].toFixed(6)}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="h-[400px] w-full map-container">
            <ClientMap 
              center={location}
              zoom={13}
              onLocationSelect={handleLocationSelect}
            />
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">地圖故障排除</h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-600">
            <li>確保您的瀏覽器已啟用 JavaScript</li>
            <li>檢查網絡連接，因為地圖需要從 OpenStreetMap 加載圖磚</li>
            <li>嘗試清除瀏覽器緩存並重新加載頁面</li>
            <li>如果使用隱私瀏覽器或擴展程序，請暫時禁用它們再試</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 