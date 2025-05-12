'use client';

import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            About Zero Waste
          </h1>
          <p className="mt-4 text-xl text-gray-500">
            Our mission is to reduce waste and promote sustainability through community sharing.
          </p>
        </div>

        <div className="mt-12 space-y-12">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Vision</h2>
            <p className="text-gray-600">
              We envision a world where items are shared and reused instead of being thrown away. 
              By connecting people in local communities, we make it easy to give items a second life 
              and reduce unnecessary waste.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How It Works</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">1. Share Items</h3>
                <p className="text-gray-600">
                  List items you no longer need. Add photos, descriptions, and pickup details.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">2. Find Items</h3>
                <p className="text-gray-600">
                  Browse items available in your area. Use the map to find items near you.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">3. Connect</h3>
                <p className="text-gray-600">
                  Message item owners to arrange pickup. Meet in person to exchange items.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Why Zero Waste?</h2>
            <p className="text-gray-600">
              Every year, millions of tons of usable items end up in landfills. By sharing and reusing 
              items, we can significantly reduce waste and its environmental impact. Our platform makes 
              it easy for communities to come together and make a difference.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 