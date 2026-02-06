// ===========================================
// SmartProperty - Home Page
// Based on JustHome Figma Design
// ===========================================

import { Layout } from "../../components/layout";

export default function HomePage() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
            Find Your Dream
            <br />
            <span className="text-indigo-600">Home</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Discover the perfect property that matches your lifestyle. Browse
            thousands of listings and find your next home today.
          </p>

          {/* Search Box */}
          <div className="bg-white rounded-full shadow-xl p-2 max-w-3xl mx-auto flex flex-col md:flex-row gap-2">
            <input
              type="text"
              placeholder="Enter location..."
              className="flex-1 px-6 py-4 rounded-full outline-none text-gray-900"
            />
            <select className="px-6 py-4 rounded-full outline-none text-gray-600 bg-gray-100">
              <option>Property Type</option>
              <option>House</option>
              <option>Apartment</option>
              <option>Villa</option>
              <option>Land</option>
            </select>
            <button className="px-8 py-4 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors">
              Search
            </button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div>
              <p className="text-4xl font-bold text-gray-900">10K+</p>
              <p className="text-gray-600">Properties</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-gray-900">5K+</p>
              <p className="text-gray-600">Happy Clients</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-gray-900">200+</p>
              <p className="text-gray-600">Cities</p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
