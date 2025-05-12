import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import SessionProvider from "@/components/SessionProvider";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zero Waste",
  description: "Find and share free items in your community. Reduce waste, help others, and promote sustainability.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 當前在 dev 環境中使用的端口
  const currentPort = process.env.PORT || '3001';
  
  return (
    <html lang="en">
      <head>
        {/* 確保正確的資源基本 URL */}
        <base href={`http://localhost:${currentPort}`} />
        
        {/* 預載入 Leaflet CSS */}
        <link 
          rel="stylesheet" 
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        
        {/* 修復跨端口問題的腳本 */}
        <Script id="port-correction" strategy="beforeInteractive">
          {`
            // 確保加載資源時使用當前窗口的主機和端口
            (function() {
              window.__NEXT_PORT = window.location.port || '3000';
              
              // 攔截 fetch 請求，確保使用當前窗口的主機和端口
              const originalFetch = window.fetch;
              window.fetch = function(url, options) {
                if (typeof url === 'string' && url.startsWith('/')) {
                  url = window.location.origin + url;
                }
                return originalFetch.call(this, url, options);
              };
            })();
          `}
        </Script>
      </head>
      <body className={inter.className}>
        <SessionProvider>
          <Navbar />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
