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
  // Determine if we're in production or development
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return (
    <html lang="en">
      <head>
        {/* Only include base tag in development */}
        {isDevelopment && (
          <base href={`http://localhost:${process.env.PORT || '3001'}`} />
        )}
        
        {/* 預載入 Leaflet CSS */}
        <link 
          rel="stylesheet" 
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        
        {/* Script to fix cross-origin issues and ensure proper URL resolution */}
        <Script id="port-correction" strategy="beforeInteractive">
          {`
            // Ensure proper URL resolution when loading resources
            (function() {
              // In production, use the window's origin
              // In development, fall back to localhost with port
              window.__NEXT_PORT = window.location.port || '3000';
              
              // Intercept fetch requests to ensure proper URL resolution
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
