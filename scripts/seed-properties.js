// =============================================
// SmartProperty - Properties Seed Script
// Run via: mongosh smartproperty seed-properties.js
// Or paste into mongo-express → smartproperty DB → Run Command
// =============================================

const BASE_URL = "https://smartproperties.tech/images";

const properties = [
  {
    _id: ObjectId(),
    title: "Contemporary Palm Villa",
    description: "Luxury modern villa with landscaped garden and poolside terrace.",
    type: "villa",
    status: "available",
    category: "sale",
    price: 980000,
    currency: "TND",
    address: {
      street: "18 Rue des Jasmins",
      city: "La Marsa",
      state: "Tunis",
      zipCode: "2070",
      country: "Tunisie",
      coordinates: { lat: 36.8863, lng: 10.3256 }
    },
    features: {
      bedrooms: 5,
      bathrooms: 4,
      area: 420,
      parkingSpaces: 3,
      furnished: true,
      petFriendly: true,
      amenities: ["pool", "garden", "wifi", "air conditioning"]
    },
    images: [
      `${BASE_URL}/image.png`,
      `${BASE_URL}/image1.png`,
      `${BASE_URL}/image2.png`
    ],
    ownerId: "69f60b185cd3a286c66d1c27",
    managerId: "69f60b045cd3a286c66d1c26",
    createdAt: new Date("2026-05-02T00:00:00.000Z"),
    updatedAt: new Date("2026-05-02T00:00:00.000Z")
  },
  {
    _id: ObjectId(),
    title: "Sidi Bou Said Sea House",
    description: "Elegant hillside house with sea breeze and bright interiors.",
    type: "house",
    status: "available",
    category: "rental",
    price: 4600,
    currency: "TND",
    address: {
      street: "9 Impasse Ennour",
      city: "Sidi Bou Said",
      state: "Tunis",
      zipCode: "2026",
      country: "Tunisie",
      coordinates: { lat: 36.8716, lng: 10.347 }
    },
    features: {
      bedrooms: 3,
      bathrooms: 2,
      area: 210,
      parkingSpaces: 2,
      furnished: true,
      petFriendly: true,
      amenities: ["sea view", "terrace", "garage"]
    },
    images: [
      `${BASE_URL}/image3.png`,
      `${BASE_URL}/image4.png`,
      `${BASE_URL}/image5.png`
    ],
    ownerId: "69f60b185cd3a286c66d1c27",
    managerId: "69f60b045cd3a286c66d1c26",
    createdAt: new Date("2026-05-02T00:00:00.000Z"),
    updatedAt: new Date("2026-05-02T00:00:00.000Z")
  },
  {
    _id: ObjectId(),
    title: "Ariana Family Garden Home",
    description: "Warm family house with open-plan living and private garden.",
    type: "house",
    status: "available",
    category: "sale",
    price: 620000,
    currency: "TND",
    address: {
      street: "45 Rue de Carthage",
      city: "Ariana",
      state: "Ariana",
      zipCode: "2080",
      country: "Tunisie",
      coordinates: { lat: 36.8625, lng: 10.1956 }
    },
    features: {
      bedrooms: 4,
      bathrooms: 2,
      area: 260,
      parkingSpaces: 2,
      furnished: false,
      petFriendly: true,
      amenities: ["garden", "garage", "storage room"]
    },
    images: [
      `${BASE_URL}/image7.png`,
      `${BASE_URL}/image8.png`,
      `${BASE_URL}/image.png`
    ],
    ownerId: "69f60b185cd3a286c66d1c27",
    managerId: "69f60b045cd3a286c66d1c26",
    createdAt: new Date("2026-05-02T00:00:00.000Z"),
    updatedAt: new Date("2026-05-02T00:00:00.000Z")
  },
  {
    _id: ObjectId(),
    title: "Hammamet Poolside Villa",
    description: "High-end villa near the coast with large pool and shaded deck.",
    type: "villa",
    status: "available",
    category: "management",
    price: 7900,
    currency: "TND",
    address: {
      street: "7 Route de la Plage",
      city: "Hammamet",
      state: "Nabeul",
      zipCode: "8050",
      country: "Tunisie",
      coordinates: { lat: 36.4004, lng: 10.6169 }
    },
    features: {
      bedrooms: 4,
      bathrooms: 3,
      area: 330,
      parkingSpaces: 3,
      furnished: true,
      petFriendly: true,
      amenities: ["pool", "terrace", "sea breeze", "smart home"]
    },
    images: [
      `${BASE_URL}/image1.png`,
      `${BASE_URL}/image2.png`,
      `${BASE_URL}/image3.png`
    ],
    ownerId: "69f60b185cd3a286c66d1c27",
    managerId: "69f60b045cd3a286c66d1c26",
    createdAt: new Date("2026-05-02T00:00:00.000Z"),
    updatedAt: new Date("2026-05-02T00:00:00.000Z")
  },
  {
    _id: ObjectId(),
    title: "Sousse Marina Apartment",
    description: "Stylish city apartment close to marina and main amenities.",
    type: "apartment",
    status: "available",
    category: "rental",
    price: 1750,
    currency: "TND",
    address: {
      street: "22 Avenue de la Corniche",
      city: "Sousse",
      state: "Sousse",
      zipCode: "4000",
      country: "Tunisie",
      coordinates: { lat: 35.8245, lng: 10.6346 }
    },
    features: {
      bedrooms: 2,
      bathrooms: 2,
      area: 110,
      parkingSpaces: 1,
      furnished: true,
      petFriendly: false,
      amenities: ["elevator", "wifi", "concierge"]
    },
    images: [
      `${BASE_URL}/image4.png`,
      `${BASE_URL}/image5.png`,
      `${BASE_URL}/image7.png`
    ],
    ownerId: "69f60b185cd3a286c66d1c27",
    managerId: "69f60b045cd3a286c66d1c26",
    createdAt: new Date("2026-05-02T00:00:00.000Z"),
    updatedAt: new Date("2026-05-02T00:00:00.000Z")
  },
  {
    _id: ObjectId(),
    title: "Monastir Contemporary Condo",
    description: "Modern condo with natural light and practical layout.",
    type: "condo",
    status: "available",
    category: "sale",
    price: 345000,
    currency: "TND",
    address: {
      street: "14 Rue Ibn Khaldoun",
      city: "Monastir",
      state: "Monastir",
      zipCode: "5000",
      country: "Tunisie",
      coordinates: { lat: 35.777, lng: 10.8262 }
    },
    features: {
      bedrooms: 3,
      bathrooms: 2,
      area: 165,
      parkingSpaces: 2,
      furnished: false,
      petFriendly: true,
      amenities: ["gym access", "balcony", "storage"]
    },
    images: [
      `${BASE_URL}/image8.png`,
      `${BASE_URL}/image.png`,
      `${BASE_URL}/image1.png`
    ],
    ownerId: "69f60b185cd3a286c66d1c27",
    managerId: "69f60b045cd3a286c66d1c26",
    createdAt: new Date("2026-05-02T00:00:00.000Z"),
    updatedAt: new Date("2026-05-02T00:00:00.000Z")
  },
  {
    _id: ObjectId(),
    title: "Djerba Island Garden Villa",
    description: "Private island-style villa with greenery and outdoor dining.",
    type: "villa",
    status: "available",
    category: "management",
    price: 5600,
    currency: "TND",
    address: {
      street: "3 Rue des Palmiers",
      city: "Midoun",
      state: "Médenine",
      zipCode: "4116",
      country: "Tunisie",
      coordinates: { lat: 33.8081, lng: 10.9923 }
    },
    features: {
      bedrooms: 4,
      bathrooms: 3,
      area: 300,
      parkingSpaces: 2,
      furnished: true,
      petFriendly: true,
      amenities: ["garden", "outdoor kitchen", "pool"]
    },
    images: [
      `${BASE_URL}/image2.png`,
      `${BASE_URL}/image3.png`,
      `${BASE_URL}/image4.png`
    ],
    ownerId: "69f60b185cd3a286c66d1c27",
    managerId: "69f60b045cd3a286c66d1c26",
    createdAt: new Date("2026-05-02T00:00:00.000Z"),
    updatedAt: new Date("2026-05-02T00:00:00.000Z")
  },
  {
    _id: ObjectId(),
    title: "Nabeul Designer Studio",
    description: "Compact designer studio for professionals and short stays.",
    type: "studio",
    status: "available",
    category: "rental",
    price: 980,
    currency: "TND",
    address: {
      street: "11 Avenue de la République",
      city: "Nabeul",
      state: "Nabeul",
      zipCode: "8000",
      country: "Tunisie",
      coordinates: { lat: 36.4561, lng: 10.7376 }
    },
    features: {
      bedrooms: 1,
      bathrooms: 1,
      area: 58,
      parkingSpaces: 1,
      furnished: true,
      petFriendly: false,
      amenities: ["wifi", "city view", "security door"]
    },
    images: [
      `${BASE_URL}/image5.png`,
      `${BASE_URL}/image7.png`,
      `${BASE_URL}/image8.png`
    ],
    ownerId: "69f60b185cd3a286c66d1c27",
    managerId: "69f60b045cd3a286c66d1c26",
    createdAt: new Date("2026-05-02T00:00:00.000Z"),
    updatedAt: new Date("2026-05-02T00:00:00.000Z")
  }
];

// Insert all properties
db.properties.insertMany(properties);
print(`✅ Inserted ${properties.length} properties successfully!`);
db.properties.find({}, { title: 1, "images": 1 }).forEach(p =>
  print(`📍 ${p.title}: ${p.images.length} images`)
);
