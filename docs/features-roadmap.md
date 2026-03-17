# verifimaSmartProperty Features Roadmap

## Project Implementation Phases

This document outlines all features to be implemented in the SmartProperty platform, organized by development phases.

## Strategic Objectives Alignment (Spec v1.0)

- [ ] Achieve valuation accuracy within +/-5% of market reference prices
- [ ] Reduce vacancy time by 40% through intelligent matching workflows
- [ ] Improve rental income by 8-12% with dynamic pricing recommendations
- [ ] Provide tenant self-service portal with 24/7 automated responses
- [ ] Reduce administrative workload by 50% via process automation
- [ ] Reach 90% reliability target for AI non-payment risk scoring
- [ ] Support multi-owner and multi-asset management in one SaaS platform

---

## Phase 1: Environment Setup ✅ COMPLETED

### Infrastructure

- [x] Docker Compose configuration (MongoDB, Redis, Mongo Express, Redis Commander, MailHog)
- [x] Environment variables setup (.env files for root, backend, frontend)
- [x] Backend configuration modules (database, JWT, Redis, mail, AWS, throttler)
- [x] NestJS application bootstrap with security middleware
- [x] Swagger API documentation setup
- [x] CORS configuration
- [x] Rate limiting setup

### Database

- [x] MongoDB connection with TypeORM
- [x] Database schema design (12 collections)
- [x] Redis cache configuration
- [x] Bull queue for background jobs

---

## Phase 2: Authentication Module ✅ COMPLETED

### User Registration

- [x] Email/password registration
- [x] Input validation (email format, password strength)
- [x] Password hashing with bcrypt
- [x] Email verification flow
- [x] Welcome email sending

### User Login

- [x] Email/password login
- [x] JWT access token generation
- [x] JWT refresh token generation
- [x] Login attempt tracking
- [x] Account lockout after failed attempts

### Token Management

- [x] Access token (short-lived: 15min - 1hr)
- [x] Refresh token (long-lived: 7-30 days)
- [x] Token refresh endpoint
- [x] Token blacklisting on logout
- [x] Multiple device session management (max 5 sessions, device tracking, revocation)
- [x] Session list endpoint with device info
- [x] Single session revocation endpoint
- [x] Logout from all devices endpoint

### Password Management

- [x] Forgot password flow
- [x] Password reset email
- [x] Password reset with token
- [x] Password change (authenticated)
- [x] Password history (prevent reuse of last 5 passwords)

### OAuth Integration (Optional)

- [x] Google OAuth2 login
- [x] Facebook OAuth login
- [ ] Apple Sign-In

### Security Features

- [x] Rate limiting on auth endpoints
- [x] CAPTCHA integration (optional)
- [x] Two-factor authentication (2FA)
- [x] Session management (Session entity with device info, expiry, revocation)
- [ ] Audit logging for auth events

---

## Phase 3: User Management Module 🔄 IN PROGRESS

### User Entity

- [x] User entity with TypeORM/MongoDB
- [x] User roles (admin, owner, tenant, manager, agent)
- [ ] Extended roles from product spec (super_admin, branch_manager, rental_manager, accountant_assistant, service_provider)
- [x] User status (active, inactive, suspended, pending_verification)
- [x] Full user profile fields (firstName, lastName, phone, avatar, etc.)
- [ ] Avatar upload and storage

### User CRUD Operations

- [x] Get current user profile (/auth/me endpoint)
- [x] Get user sessions with device info
- [x] Update user profile
- [x] Change email (with verification)
- [x] Deactivate account
- [x] Delete account (GDPR compliance)

### User Preferences

- [ ] Property type preferences
- [ ] Budget range preferences
- [ ] Location preferences
- [ ] Notification preferences

### Document Management

- [x] Upload identity documents
- [x] Upload proof of income
- [x] Document verification status
- [x] Secure document storage (AWS S3)
- [ ] email me when get verified or rejected

### Admin User Management

- [x] List all users (paginated)
- [x] Search/filter users
- [x] View user details
- [x] Activate/deactivate users
- [x] Change user roles

### Multi-Tenant & Organization Management

- [ ] Tenant/agency workspace isolation (multi-tenant SaaS)
- [ ] Agency and branch hierarchy with scoped permissions
- [ ] Branch manager dashboards (portfolio view, pricing/condition validation)
- [ ] Accountant/admin assistant permissions (invoicing, reconciliation, tax reporting)
- [ ] Service provider permissions (interventions, reports, invoicing)

---

## Phase 4: Properties Module 🔄 IN PROGRESS

### Property Entity

- [x] Property entity with all fields
- [x] Property types enum
- [x] Property status enum
- [x] Address embedded document
- [x] Features embedded document
- [x] Geospatial coordinates

### Property CRUD

- [x] Create property listing
- [x] Update property details
- [x] Delete property (soft delete)
- [x] Get property by ID
- [x] List owner's properties
- [ ] Multi-step property creation wizard
- [ ] Automatic geolocation with interactive map on listing form
- [ ] Unique property identifier generation

### Portfolio Management & Data Exchange

- [ ] Property categorization (sale, rental, management)
- [ ] Portfolio dashboard with KPI widgets
- [ ] Import/export via Excel templates
- [ ] Partner API connectors for listing synchronization

### Property Images

- [x] Multiple image upload
- [x] Image optimization/resizing
- [x] Primary image selection
- [x] Image reordering
- [x] Image deletion
- [x] AWS S3/MinIO storage integration
- [ ] AI feature detection from uploaded photos

### Property Search

- [x] Full-text search
- [x] Filter by type
- [x] Filter by price range
- [ ] Filter by bedrooms/bathrooms
- [ ] Filter by amenities
- [x] Filter by location/city
- [ ] Geospatial search (nearby)
- [x] Sort options (price, date, relevance)
- [x] Pagination

### Property Features

- [x] Virtual tour URL
- [x] Amenities list
- [ ] Availability calendar
- [ ] Property comparison
- [ ] Share property link
- [ ] QR code generation

### Marketing & Distribution

- [ ] AI-generated marketing descriptions (short/medium/long)
- [ ] Tone presets (professional, warm, luxury)
- [ ] Multilingual translation for generated descriptions
- [ ] Multi-portal distribution (SeLoger, LeBonCoin, etc.)
- [ ] Auto-generated property showcase landing page

---

## Phase 5: Applications Module

### Application Entity

- [ ] Application entity
- [ ] Application status workflow
- [ ] Employment info embedded
- [ ] References embedded

### Tenant Features

- [ ] Submit rental application
- [ ] Upload required documents
- [ ] Track application status
- [ ] Withdraw application
- [ ] View application history

### Owner/Manager Features

- [ ] View received applications
- [ ] Review application details
- [ ] Request additional documents
- [ ] Approve application
- [ ] Reject application (with reason)
- [ ] Schedule property viewing

### Notifications

- [ ] New application notification
- [ ] Status change notification
- [ ] Document request notification
- [ ] Application deadline reminders

---

## Phase 6: Leases Module

### Lease Entity

- [ ] Lease entity with terms
- [ ] Lease status workflow
- [ ] Document attachments
- [ ] Digital signatures

### Lease Management

- [ ] Create lease from approved application
- [ ] Lease template generation
- [ ] Custom terms and conditions
- [ ] Lease document upload
- [ ] Digital signature integration
- [ ] Lease activation
- [ ] Electronic lease endorsements/annexes
- [ ] Digital move-in/move-out inventory with photos

### Lease Lifecycle

- [ ] Active lease tracking
- [ ] Lease renewal reminders
- [ ] Lease renewal process
- [ ] Lease termination (early/normal)
- [ ] Move-out process
- [ ] Security deposit handling

### Reporting

- [ ] Lease expiration reports
- [ ] Occupancy reports
- [ ] Revenue projections

---

## Phase 7: Payments Module

### Payment Entity

- [ ] Payment entity
- [ ] Payment types (rent, deposit, etc.)
- [ ] Payment methods
- [ ] Transaction tracking

### Payment Processing

- [ ] Stripe integration
- [ ] Card payment processing
- [ ] Bank transfer support
- [ ] Payment scheduling
- [ ] Recurring payments (auto-pay)
- [ ] Partial payments

### Payment Features

- [ ] Payment history
- [ ] Payment receipts (PDF)
- [ ] Invoice generation
- [ ] Late fee calculation
- [ ] Payment reminders
- [ ] Overdue notifications
- [ ] Rent and charges monitoring dashboard
- [ ] Automatic unpaid rent reminder workflow

### Financial Reporting

- [ ] Income reports
- [ ] Payment analytics
- [ ] Export to CSV/Excel
- [ ] Tax documentation

---

## Phase 8: Maintenance Module

### Maintenance Entity

- [ ] Maintenance request entity
- [ ] Category classification
- [ ] Priority levels
- [ ] Status workflow

### Tenant Features

- [ ] Submit maintenance request
- [ ] Upload photos/videos
- [ ] Track request status
- [ ] Rate completed work
- [ ] Emergency contact

### Owner/Manager Features

- [ ] View maintenance requests
- [ ] Assign to staff/contractor
- [ ] Schedule maintenance
- [ ] Update status
- [ ] Record costs
- [ ] Close requests

### Service Provider Operations

- [ ] Service provider portal for assigned interventions
- [ ] Intervention scheduling calendar
- [ ] Photo/report upload after intervention
- [ ] Vendor invoice submission and validation

### Predictive Maintenance

- [ ] Predictive maintenance scoring from history and incident patterns
- [ ] Suggested preventive interventions by asset type
- [ ] Local market benchmark for maintenance costs and SLA tracking

### Notifications

- [ ] New request alerts
- [ ] Status update notifications
- [ ] Scheduling reminders
- [ ] Completion notifications

---

## Phase 9: Messaging Module

### Conversations

- [ ] Conversation entity
- [ ] Participant management
- [ ] Property-linked conversations
- [ ] Unread count tracking

### Messages

- [ ] Message entity
- [ ] Text messages
- [ ] File attachments
- [ ] Read receipts
- [ ] Message search

### Real-time Features

- [ ] WebSocket integration (Socket.io)
- [ ] Real-time message delivery
- [ ] Typing indicators
- [ ] Online status
- [ ] Push notifications

---

## Phase 10: Notifications Module

### Notification System

- [ ] Notification entity
- [ ] Notification types
- [ ] In-app notifications
- [ ] Email notifications
- [ ] Push notifications (mobile)

### Notification Preferences

- [ ] Email notification settings
- [ ] Push notification settings
- [ ] Notification frequency
- [ ] Quiet hours

### Notification Features

- [ ] Mark as read
- [ ] Mark all as read
- [ ] Delete notifications
- [ ] Notification history
- [ ] Notification grouping

---

## Phase 11: Reviews & Favorites

### Reviews

- [ ] Review entity
- [ ] Property ratings
- [ ] Category ratings
- [ ] Verified tenant reviews
- [ ] Review moderation
- [ ] Response to reviews

### Favorites

- [ ] Save property to favorites
- [ ] Remove from favorites
- [ ] Favorites list view
- [ ] Share favorites

---

## Phase 12: Frontend Implementation 🔄 IN PROGRESS

### Core Setup

- [x] React 19 + Vite configuration
- [x] TailwindCSS v4 styling
- [x] React Router setup
- [x] Zustand state management with localStorage persistence
- [x] Axios API client with token refresh interceptors
- [x] React Hook Form + Zod validation
- [x] Custom useAuth hook with auto-initialization
- [x] Form validation utilities (email, password, phone)
- [x] Error handling utilities
- [x] Auth configuration constants

### Layout & Navigation

- [x] Main layout component (Dashboard header)
- [x] Responsive navigation
- [x] Footer component
- [ ] Sidebar (dashboard)
- [ ] Mobile menu

### Authentication Pages

- [x] Login page with validation
- [x] Registration page with password requirements display
- [x] Forgot password page
- [x] Reset password page
- [x] Email verification page with auto-redirect to dashboard
- [x] Protected route wrapper
- [x] Sessions management page (view/revoke)

### Dashboard

- [x] Dashboard layout with header and user menu
- [x] Email verification status alert
- [ ] Overview widgets
- [ ] Quick actions
- [ ] Recent activity
- [x] Notifications dropdown
- [x] User profile card

### Property Pages

- [x] Property listing grid
- [x] Property search with filters
- [x] Property detail page
- [ ] Property map view (Mapbox)
- [x] Image gallery/carousel
- [ ] Virtual tour viewer

### User Pages

- [ ] User profile page
- [ ] Profile edit form
- [ ] Document upload
- [ ] Preferences settings
- [ ] Password change

### Application Pages

- [ ] Application form
- [ ] Application status tracking
- [ ] Application list (owner view)
- [ ] Application review page

### Lease Pages

- [ ] Lease list view
- [ ] Lease detail page
- [ ] Lease document viewer

### Payment Pages

- [ ] Payment history
- [ ] Make payment form
- [ ] Payment receipts
- [ ] Payment settings

### Maintenance Pages

- [ ] Submit request form
- [ ] Request list view
- [ ] Request detail page

### Messaging

- [ ] Inbox view
- [ ] Conversation thread
- [ ] New message composer

---

## Phase 13: Advanced Features

### Maps & Location

- [ ] Mapbox GL integration
- [ ] Property markers on map
- [ ] Geolocation search
- [ ] Neighborhood info
- [ ] Distance calculation

### 3D Visualization

- [ ] React Three Fiber setup
- [ ] 3D property viewer
- [ ] Floor plan visualization
- [ ] Virtual staging (future)

### Analytics Dashboard

- [ ] Property performance metrics
- [ ] Revenue analytics
- [ ] Occupancy trends
- [ ] User engagement stats
- [ ] Chart.js/Recharts integration

### Search & Discovery

- [ ] Elasticsearch integration (optional)
- [ ] Advanced search filters
- [ ] Saved searches
- [ ] Search alerts
- [ ] Recently viewed

### Distribution & Marketplace

- [ ] Cross-agency property marketplace
- [ ] Lead sharing rules and partner agency permissions
- [ ] Listing syndication monitoring and publication status
- [ ] Agency-branded mini-sites for portfolio/property promotion

---

## Phase 14: AI Services (Future)

### Property Recommendations

- [ ] User preference analysis
- [ ] Collaborative filtering
- [ ] Content-based recommendations
- [ ] ML model training
- [ ] Explicit + implicit criteria processing for matching
- [ ] Daily top-3 match notifications (push/email)
- [ ] Explainable compatibility score details (why this match)

### Price Prediction

- [ ] Market data collection
- [ ] Price prediction model
- [ ] Rental price suggestions
- [ ] Market trend analysis
- [ ] Confidence interval output with min-max range
- [ ] Comparative market analysis (similar sold/rented assets)
- [ ] District price evolution graphs
- [ ] Valuation report export to PDF

### Image Analysis

- [ ] Property image classification
- [ ] Quality scoring
- [ ] Auto-tagging
- [ ] Duplicate detection
- [ ] 3D virtual tour generation support pipeline

### NLP Features

- [ ] Natural language search
- [ ] Chatbot assistant
- [ ] Automated responses
- [ ] Sentiment analysis

### AI Marketing Content Generation

- [ ] One-click AI description generation from property data + images
- [ ] Multi-variant copy generation with tone customization
- [ ] Multilingual copy generation

### Solvency & Risk Intelligence

- [ ] OCR extraction from candidate supporting documents
- [ ] Document authenticity/fraud detection
- [ ] Debt ratio calculation (rent/income)
- [ ] AI risk score (0-100) with confidence metadata
- [ ] Recommendation output (Accept / Ask guarantees / Refuse)
- [ ] GDPR-compliant non-discrimination guardrails for scoring

### AI Platform Stack

- [ ] FastAPI microservices for AI orchestration
- [ ] OCR stack integration (Tesseract + PaddleOCR)
- [ ] Vector database integration (Qdrant/Pinecone) for RAG
- [ ] LangChain/LangGraph workflows for reasoning pipelines

---

## Phase 15: DevOps & Deployment

### CI/CD

- [ ] GitHub Actions workflows
- [ ] Automated testing
- [ ] Code quality checks
- [ ] Automated deployments

### Monitoring

- [ ] Application logging
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] Health checks

### Security

- [ ] Security headers
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Rate limiting
- [ ] DDoS protection

### Documentation

- [ ] API documentation
- [ ] Code documentation
- [ ] User guides
- [ ] Developer guides

---

## Phase 16: Compliance & Ecosystem Integrations (Future)

### Regulatory Compliance

- [ ] DPE workflow support and compliance checks
- [ ] ALUR process support and legal checklist automation
- [ ] Compliance audit trail for regulated actions

### API Strategy

- [ ] Dual API model (REST + GraphQL)
- [ ] GraphQL schema for portfolio, pricing, and matching domains
- [ ] External API rate plans for partner agencies

### Planned Deferred Scope from Product Spec

- [ ] Augmented reality for visits (targeted in enhancement phase)
- [ ] IoT building automation integration (connected sensors)
- [ ] Blockchain ownership registry exploration (long-term)

---

## Priority Matrix

### High Priority (MVP)

1. ✅ Phase 1: Environment Setup
2. ✅ Phase 2: Authentication
3. 🔄 Phase 3: User Management
4. 🔄 Phase 4: Properties (basic CRUD + search)
5. 🔄 Phase 12: Frontend (core pages)

### Medium Priority

6. Phase 5: Applications
7. Phase 6: Leases
8. Phase 7: Payments
9. Phase 9: Messaging
10. Phase 10: Notifications

### Lower Priority

11. Phase 8: Maintenance
12. Phase 11: Reviews & Favorites
13. Phase 13: Advanced Features
14. Phase 14: AI Services
15. Phase 15: DevOps
16. Phase 16: Compliance & Ecosystem Integrations

---

## Timeline Estimates

| Phase    | Estimated Duration | Status      |
| -------- | ------------------ | ----------- |
| Phase 1  | ✅ Completed       | Done        |
| Phase 2  | ✅ Completed       | Done        |
| Phase 3  | 2-3 days           | In Progress |
| Phase 4  | 4-5 days           | In Progress |
| Phase 5  | 2-3 days           | Not Started |
| Phase 6  | 2-3 days           | Not Started |
| Phase 7  | 3-4 days           | Not Started |
| Phase 8  | 2 days             | Not Started |
| Phase 9  | 2-3 days           | Not Started |
| Phase 10 | 2 days             | Not Started |
| Phase 11 | 1-2 days           | Not Started |
| Phase 12 | 7-10 days          | In Progress |
| Phase 13 | 5-7 days           | Not Started |
| Phase 14 | TBD                | Future      |
| Phase 15 | Ongoing            | Not Started |
| Phase 16 | TBD                | Future      |

---

## Tech Stack Summary

### Backend

- NestJS v11
- TypeORM with MongoDB
- Bull Queue (Redis)
- Passport.js + JWT
- Swagger/OpenAPI
- Socket.io
- REST + GraphQL (Apollo Server)

### Frontend

- React 19
- Vite
- TailwindCSS v4
- Zustand + Jotai
- React Hook Form + Zod
- Mapbox GL
- React Three Fiber
- Shadcn/ui + Radix UI
- Framer Motion

### Infrastructure

- MongoDB 7.0
- Redis 7.2
- Docker & Docker Compose
- AWS S3 (file storage)
- Stripe (payments)

### AI/ML Services

- FastAPI (Python)
- OpenCV + YOLOv8 + Stable Diffusion
- Scikit-learn + XGBoost + LightGBM + CatBoost
- OpenAI GPT models + Sentence Transformers
- LangChain + LangGraph
- Qdrant/Pinecone (vector store)
- Tesseract + PaddleOCR

---

## Notes

- Each phase should include unit tests
- E2E tests for critical flows
- Documentation updates with each phase
- Code reviews before merging
- Performance testing for search and listings
