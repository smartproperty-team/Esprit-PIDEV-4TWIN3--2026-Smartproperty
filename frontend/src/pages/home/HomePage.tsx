// ===========================================
// SmartProperty - Home Page
// Based on JustHome Figma Design
// ===========================================

import { Search } from "lucide-react";
import { useState } from "react";
import { Layout } from "../../components/layout";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"sale" | "rent">("sale");

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2075&q=80')",
          }}
        >
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
          {/* Badge */}
          <div className="inline-block mb-8">
            <span className="px-6 py-2 rounded-full border border-white/50 text-white text-sm font-medium tracking-wider uppercase">
              Let us guide your home
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-12 leading-tight">
            Discover a place you'll
            <br />
            love to live
          </h1>

          {/* Search Box */}
          <div className="bg-white rounded-2xl shadow-2xl p-2 max-w-2xl mx-auto">
            {/* Tabs */}
            <div className="flex justify-center gap-8 mb-4 pt-2">
              <button
                onClick={() => setActiveTab("sale")}
                className={`pb-2 text-lg font-medium transition-colors relative ${
                  activeTab === "sale"
                    ? "text-gray-900"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                Sale
                {activeTab === "sale" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("rent")}
                className={`pb-2 text-lg font-medium transition-colors relative ${
                  activeTab === "rent"
                    ? "text-gray-900"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                Rent
                {activeTab === "rent" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
                )}
              </button>
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-2 p-2">
              <input
                type="text"
                placeholder="Enter Name, Keywords..."
                className="flex-1 px-4 py-3 text-gray-700 outline-none text-lg"
              />
              <button className="w-12 h-12 rounded-full bg-amber-400 hover:bg-amber-500 transition-colors flex items-center justify-center">
                <Search className="w-5 h-5 text-gray-900" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
