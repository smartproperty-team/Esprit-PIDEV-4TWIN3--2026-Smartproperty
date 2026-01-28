# SmartProperty Database Schema

## MongoDB Collections Overview

This document describes the database schema for the SmartProperty platform using MongoDB.

---

## Collections Summary

| Collection             | Purpose                                                   |
| ---------------------- | --------------------------------------------------------- |
| `users`                | User accounts (owners, tenants, managers, agents, admins) |
| `user_profiles`        | Extended user info, preferences, documents                |
| `properties`           | Property listings with details, images, location          |
| `applications`         | Rental applications from tenants                          |
| `leases`               | Active/historical rental agreements                       |
| `payments`             | Payment records and transactions                          |
| `maintenance_requests` | Property maintenance tickets                              |
| `notifications`        | User notifications                                        |
| `conversations`        | Chat threads between users                                |
| `messages`             | Individual messages in conversations                      |
| `reviews`              | Property reviews and ratings                              |
| `favorites`            | User's saved/bookmarked properties                        |

---

## Schema Details

### Users Collection

```javascript
{
  _id: ObjectId,                    // Primary Key
  email: String,                    // Unique, required
  password: String,                 // Hashed, required
  firstName: String,                // Required
  lastName: String,                 // Required
  phone: String,
  avatar: String,                   // URL to profile image
  role: String,                     // Enum: [admin, owner, tenant, manager, agent]
  isEmailVerified: Boolean,         // Default: false
  isActive: Boolean,                // Default: true
  lastLogin: Date,
  refreshToken: String,             // For JWT refresh
  passwordResetToken: String,
  passwordResetExpires: Date,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
{ email: 1 }                        // Unique
{ role: 1 }
{ isActive: 1 }
```

---

### User Profiles Collection

```javascript
{
  _id: ObjectId,                    // Primary Key
  userId: ObjectId,                 // FK → Users (unique)
  dateOfBirth: Date,
  bio: String,
  occupation: String,
  income: Number,
  preferences: {
    propertyTypes: [String],        // [apartment, house, condo, etc.]
    minBudget: Number,
    maxBudget: Number,
    preferredLocations: [String]
  },
  documents: [{
    type: String,                   // [id_card, passport, proof_of_income, etc.]
    url: String,
    verified: Boolean
  }],
  createdAt: Date,
  updatedAt: Date
}

// Indexes
{ userId: 1 }                       // Unique
```

---

### Properties Collection

```javascript
{
  _id: ObjectId,                    // Primary Key
  title: String,                    // Required
  description: String,
  type: String,                     // Enum: [apartment, house, condo, studio, villa, land]
  status: String,                   // Enum: [available, rented, maintenance, unlisted]
  price: Number,                    // Monthly rent
  currency: String,                 // Default: USD
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  features: {
    bedrooms: Number,
    bathrooms: Number,
    area: Number,                   // Square feet/meters
    parkingSpaces: Number,
    furnished: Boolean,
    petFriendly: Boolean,
    amenities: [String]             // [wifi, pool, gym, laundry, etc.]
  },
  images: [{
    url: String,
    caption: String,
    isPrimary: Boolean
  }],
  virtualTour: String,              // URL to 360° tour
  ownerId: ObjectId,                // FK → Users
  managerId: ObjectId,              // FK → Users (optional)
  createdAt: Date,
  updatedAt: Date
}

// Indexes
{ ownerId: 1 }
{ managerId: 1 }
{ status: 1 }
{ type: 1 }
{ "address.city": 1 }
{ "address.coordinates": "2dsphere" }  // Geospatial index
{ price: 1 }
{ "features.bedrooms": 1 }
```

---

### Applications Collection

```javascript
{
  _id: ObjectId,                    // Primary Key
  propertyId: ObjectId,             // FK → Properties
  applicantId: ObjectId,            // FK → Users
  status: String,                   // Enum: [pending, reviewing, approved, rejected, withdrawn]
  message: String,                  // Cover letter/message
  documents: [{
    type: String,                   // [id, proof_of_income, reference_letter, etc.]
    url: String
  }],
  employmentInfo: {
    employer: String,
    position: String,
    income: Number,
    employmentLength: String
  },
  references: [{
    name: String,
    phone: String,
    email: String,
    relationship: String
  }],
  moveInDate: Date,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
{ propertyId: 1 }
{ applicantId: 1 }
{ status: 1 }
{ propertyId: 1, applicantId: 1 }   // Compound
```

---

### Leases Collection

```javascript
{
  _id: ObjectId,                    // Primary Key
  propertyId: ObjectId,             // FK → Properties
  tenantId: ObjectId,               // FK → Users
  ownerId: ObjectId,                // FK → Users
  startDate: Date,                  // Required
  endDate: Date,                    // Required
  monthlyRent: Number,              // Required
  securityDeposit: Number,
  status: String,                   // Enum: [draft, active, expired, terminated, renewed]
  terms: String,                    // Lease terms and conditions
  documents: [{
    type: String,                   // [lease_agreement, addendum, etc.]
    url: String,
    signedAt: Date
  }],
  renewalReminder: Date,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
{ propertyId: 1 }
{ tenantId: 1 }
{ ownerId: 1 }
{ status: 1 }
{ endDate: 1 }
```

---

### Payments Collection

```javascript
{
  _id: ObjectId,                    // Primary Key
  leaseId: ObjectId,                // FK → Leases
  tenantId: ObjectId,               // FK → Users
  amount: Number,                   // Required
  currency: String,                 // Default: USD
  type: String,                     // Enum: [rent, deposit, utility, maintenance, late_fee]
  status: String,                   // Enum: [pending, completed, failed, refunded]
  method: String,                   // Enum: [card, bank_transfer, cash, check]
  transactionId: String,            // External payment gateway ID
  dueDate: Date,
  paidAt: Date,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
{ leaseId: 1 }
{ tenantId: 1 }
{ status: 1 }
{ dueDate: 1 }
{ type: 1 }
```

---

### Maintenance Requests Collection

```javascript
{
  _id: ObjectId,                    // Primary Key
  propertyId: ObjectId,             // FK → Properties
  tenantId: ObjectId,               // FK → Users
  title: String,                    // Required
  description: String,              // Required
  category: String,                 // Enum: [plumbing, electrical, appliance, hvac, structural, other]
  priority: String,                 // Enum: [low, medium, high, emergency]
  status: String,                   // Enum: [submitted, in_progress, completed, cancelled]
  images: [String],                 // Array of image URLs
  assignedTo: ObjectId,             // FK → Users (maintenance staff/contractor)
  scheduledDate: Date,
  completedDate: Date,
  cost: Number,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
{ propertyId: 1 }
{ tenantId: 1 }
{ status: 1 }
{ priority: 1 }
{ assignedTo: 1 }
```

---

### Notifications Collection

```javascript
{
  _id: ObjectId,                    // Primary Key
  userId: ObjectId,                 // FK → Users
  type: String,                     // Enum: [payment_due, payment_received, application,
                                    //        maintenance, lease, message, system]
  title: String,                    // Required
  message: String,                  // Required
  data: Object,                     // Additional data (propertyId, paymentId, etc.)
  read: Boolean,                    // Default: false
  readAt: Date,
  createdAt: Date
}

// Indexes
{ userId: 1 }
{ read: 1 }
{ type: 1 }
{ userId: 1, read: 1 }              // Compound for unread notifications
```

---

### Conversations Collection

```javascript
{
  _id: ObjectId,                    // Primary Key
  participants: [ObjectId],         // Array of User IDs
  propertyId: ObjectId,             // FK → Properties (optional, for property-related chats)
  lastMessage: {
    content: String,
    senderId: ObjectId,
    sentAt: Date
  },
  unreadCount: {                    // Object with participant IDs as keys
    "<userId1>": Number,
    "<userId2>": Number
  },
  createdAt: Date,
  updatedAt: Date
}

// Indexes
{ participants: 1 }
{ propertyId: 1 }
{ updatedAt: -1 }
```

---

### Messages Collection

```javascript
{
  _id: ObjectId,                    // Primary Key
  conversationId: ObjectId,         // FK → Conversations
  senderId: ObjectId,               // FK → Users
  receiverId: ObjectId,             // FK → Users
  propertyId: ObjectId,             // FK → Properties (optional)
  content: String,                  // Required
  attachments: [{
    type: String,                   // [image, document, video]
    url: String,
    name: String
  }],
  read: Boolean,                    // Default: false
  readAt: Date,
  createdAt: Date
}

// Indexes
{ conversationId: 1 }
{ senderId: 1 }
{ receiverId: 1 }
{ createdAt: -1 }
```

---

### Reviews Collection

```javascript
{
  _id: ObjectId,                    // Primary Key
  propertyId: ObjectId,             // FK → Properties
  reviewerId: ObjectId,             // FK → Users
  rating: Number,                   // 1-5, Required
  title: String,
  comment: String,
  categories: {
    location: Number,               // 1-5
    cleanliness: Number,            // 1-5
    communication: Number,          // 1-5
    value: Number                   // 1-5
  },
  isVerified: Boolean,              // Verified tenant review
  createdAt: Date,
  updatedAt: Date
}

// Indexes
{ propertyId: 1 }
{ reviewerId: 1 }
{ rating: 1 }
{ propertyId: 1, reviewerId: 1 }    // Compound unique
```

---

### Favorites Collection

```javascript
{
  _id: ObjectId,                    // Primary Key
  userId: ObjectId,                 // FK → Users
  propertyId: ObjectId,             // FK → Properties
  createdAt: Date
}

// Indexes
{ userId: 1 }
{ propertyId: 1 }
{ userId: 1, propertyId: 1 }        // Compound unique
```

---

## Relationships Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              RELATIONSHIPS SUMMARY                                   │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  User (1) ──────────────── (N) Properties        (Owner/Manager owns properties)    │
│  User (1) ──────────────── (1) UserProfile       (User has one profile)             │
│  User (1) ──────────────── (N) Applications      (Tenant submits applications)      │
│  User (1) ──────────────── (N) Leases            (Tenant has leases)                │
│  User (1) ──────────────── (N) Payments          (Tenant makes payments)            │
│  User (1) ──────────────── (N) Favorites         (User saves favorites)             │
│  User (1) ──────────────── (N) Notifications     (User receives notifications)      │
│  User (1) ──────────────── (N) Messages          (User sends/receives messages)     │
│  User (1) ──────────────── (N) Reviews           (User writes reviews)              │
│  Property (1) ──────────── (N) Applications      (Property receives applications)   │
│  Property (1) ──────────── (N) Leases            (Property has lease history)       │
│  Property (1) ──────────── (N) MaintenanceReq    (Property has maintenance)         │
│  Property (1) ──────────── (N) Reviews           (Property has reviews)             │
│  Property (1) ──────────── (N) Favorites         (Property saved by users)          │
│  Lease (1) ────────────── (N) Payments           (Lease has payment records)        │
│  Conversation (1) ──────── (N) Messages          (Conversation contains messages)   │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Visual Schema Diagram

```
                                    ┌─────────────────┐
                                    │      USERS      │
                                    │─────────────────│
                                    │ _id             │
                                    │ email           │
                                    │ password        │
                                    │ firstName       │
                                    │ lastName        │
                                    │ role            │
                                    └────────┬────────┘
                                             │
           ┌─────────────────────────────────┼─────────────────────────────────┐
           │                                 │                                 │
           ▼                                 ▼                                 ▼
┌─────────────────────┐           ┌─────────────────────┐           ┌─────────────────────┐
│   USER_PROFILES     │           │     PROPERTIES      │           │    NOTIFICATIONS    │
│─────────────────────│           │─────────────────────│           │─────────────────────│
│ userId (FK)         │           │ ownerId (FK)        │           │ userId (FK)         │
│ preferences         │           │ managerId (FK)      │           │ type                │
│ documents           │           │ title, price        │           │ message             │
│                     │           │ address, features   │           │ read                │
└─────────────────────┘           └──────────┬──────────┘           └─────────────────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
                    ▼                        ▼                        ▼
         ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
         │    APPLICATIONS     │  │       LEASES        │  │      REVIEWS        │
         │─────────────────────│  │─────────────────────│  │─────────────────────│
         │ propertyId (FK)     │  │ propertyId (FK)     │  │ propertyId (FK)     │
         │ applicantId (FK)    │  │ tenantId (FK)       │  │ reviewerId (FK)     │
         │ status              │  │ ownerId (FK)        │  │ rating              │
         │ employmentInfo      │  │ startDate, endDate  │  │ comment             │
         └─────────────────────┘  └──────────┬──────────┘  └─────────────────────┘
                                             │
                                             ▼
                                  ┌─────────────────────┐
                                  │      PAYMENTS       │
                                  │─────────────────────│
                                  │ leaseId (FK)        │
                                  │ tenantId (FK)       │
                                  │ amount, status      │
                                  │ type, method        │
                                  └─────────────────────┘


┌─────────────────────┐           ┌─────────────────────┐
│  MAINTENANCE_REQS   │           │    CONVERSATIONS    │
│─────────────────────│           │─────────────────────│
│ propertyId (FK)     │           │ participants []     │──────┐
│ tenantId (FK)       │           │ propertyId (FK)     │      │
│ category, priority  │           │ lastMessage         │      │
│ status              │           └─────────────────────┘      │
└─────────────────────┘                                        │
                                                               ▼
┌─────────────────────┐                             ┌─────────────────────┐
│     FAVORITES       │                             │      MESSAGES       │
│─────────────────────│                             │─────────────────────│
│ userId (FK)         │                             │ conversationId (FK) │
│ propertyId (FK)     │                             │ senderId (FK)       │
└─────────────────────┘                             │ content             │
                                                    └─────────────────────┘
```

---

## Enum Values Reference

### User Roles

- `admin` - System administrator
- `owner` - Property owner
- `tenant` - Renter/tenant
- `manager` - Property manager
- `agent` - Real estate agent

### Property Types

- `apartment`
- `house`
- `condo`
- `studio`
- `villa`
- `land`

### Property Status

- `available` - Open for applications
- `rented` - Currently occupied
- `maintenance` - Under maintenance
- `unlisted` - Hidden from search

### Application Status

- `pending` - Awaiting review
- `reviewing` - Being reviewed
- `approved` - Accepted
- `rejected` - Declined
- `withdrawn` - Cancelled by applicant

### Lease Status

- `draft` - Not yet active
- `active` - Currently in effect
- `expired` - Past end date
- `terminated` - Ended early
- `renewed` - Extended

### Payment Status

- `pending` - Awaiting payment
- `completed` - Successfully paid
- `failed` - Payment failed
- `refunded` - Money returned

### Payment Types

- `rent` - Monthly rent
- `deposit` - Security deposit
- `utility` - Utility bills
- `maintenance` - Maintenance costs
- `late_fee` - Late payment fee

### Maintenance Priority

- `low` - Non-urgent
- `medium` - Normal priority
- `high` - Urgent
- `emergency` - Immediate attention required

### Maintenance Status

- `submitted` - Newly created
- `in_progress` - Being worked on
- `completed` - Resolved
- `cancelled` - Closed without resolution

### Notification Types

- `payment_due` - Payment reminder
- `payment_received` - Payment confirmation
- `application` - Application updates
- `maintenance` - Maintenance updates
- `lease` - Lease notifications
- `message` - New message
- `system` - System announcements

---

## Notes

1. All `_id` fields are MongoDB ObjectIds
2. All timestamps use UTC
3. Passwords are hashed using bcrypt
4. Geospatial queries use 2dsphere index on coordinates
5. Soft deletes can be implemented with `isDeleted` and `deletedAt` fields if needed
