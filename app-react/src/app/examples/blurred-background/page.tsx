"use client";

import BlurredBackgroundImage from "@/components/BlurredBackgroundImage";
import Link from "next/link";

export default function BlurredBackgroundExamples() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-3">Blurred Background Image Examples</h1>
        <p className="text-gray-700">
          This page demonstrates the BlurredBackgroundImage component with various configurations.
        </p>
        <Link href="/" className="text-blue-600 hover:underline mt-2 inline-block">
          Back to home
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Default Example */}
        <div className="rounded-lg overflow-hidden shadow-lg h-80">
          <BlurredBackgroundImage 
            src="https://images.unsplash.com/photo-1506744038136-46273834b3fb"
            alt="Mountain landscape"
          >
            <div className="p-6 h-full flex flex-col justify-center items-center text-center">
              <h2 className="text-white text-2xl font-bold mb-2">Default Settings</h2>
              <p className="text-white">Medium blur with medium opacity black overlay</p>
            </div>
          </BlurredBackgroundImage>
        </div>

        {/* Light Blur Example */}
        <div className="rounded-lg overflow-hidden shadow-lg h-80">
          <BlurredBackgroundImage 
            src="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05"
            alt="Forest landscape"
            blurAmount="sm"
            overlayOpacity="light"
          >
            <div className="p-6 h-full flex flex-col justify-center items-center text-center">
              <h2 className="text-white text-2xl font-bold mb-2">Light Blur</h2>
              <p className="text-white">Small blur amount with light opacity overlay</p>
            </div>
          </BlurredBackgroundImage>
        </div>

        {/* Heavy Blur Example */}
        <div className="rounded-lg overflow-hidden shadow-lg h-80">
          <BlurredBackgroundImage 
            src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e"
            alt="Nature landscape"
            blurAmount="xl"
            overlayOpacity="dark"
          >
            <div className="p-6 h-full flex flex-col justify-center items-center text-center">
              <h2 className="text-white text-2xl font-bold mb-2">Heavy Blur</h2>
              <p className="text-white">Extra large blur with dark overlay</p>
            </div>
          </BlurredBackgroundImage>
        </div>

        {/* Colored Overlay Example */}
        <div className="rounded-lg overflow-hidden shadow-lg h-80">
          <BlurredBackgroundImage 
            src="https://images.unsplash.com/photo-1501854140801-50d01698950b"
            alt="Ocean landscape"
            overlayColor="bg-blue-800"
            blurAmount="lg"
          >
            <div className="p-6 h-full flex flex-col justify-center items-center text-center">
              <h2 className="text-white text-2xl font-bold mb-2">Colored Overlay</h2>
              <p className="text-white">Using a blue overlay with large blur</p>
            </div>
          </BlurredBackgroundImage>
        </div>

        {/* Content Layout Example */}
        <div className="rounded-lg overflow-hidden shadow-lg h-80 md:col-span-2">
          <BlurredBackgroundImage 
            src="https://images.unsplash.com/photo-1523712999610-f77fbcfc3843"
            alt="Sunset landscape"
            blurAmount="md"
            overlayOpacity="medium"
          >
            <div className="p-8 h-full flex flex-col justify-center">
              <div className="max-w-xl">
                <h2 className="text-white text-3xl font-bold mb-4">Content Layout Example</h2>
                <p className="text-white text-lg mb-6">
                  The BlurredBackgroundImage component can contain any content layout. 
                  This example demonstrates a more complex content structure with buttons.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button className="bg-white text-blue-900 px-6 py-2 rounded-full font-medium hover:bg-blue-100 transition-colors">
                    Primary Action
                  </button>
                  <button className="bg-transparent text-white border border-white px-6 py-2 rounded-full font-medium hover:bg-white hover:bg-opacity-10 transition-colors">
                    Secondary Action
                  </button>
                </div>
              </div>
            </div>
          </BlurredBackgroundImage>
        </div>
      </div>
    </div>
  );
} 