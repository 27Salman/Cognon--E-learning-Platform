# PROJECT_STATE.md - Cognon E-Learning Platform

## Project Overview

**Name:** Cognon  
**Type:** E-Learning Platform (MERN Stack)  
**Timeline:** 4 weeks development + Week 5 deployment  
**Current Week:** Week 1 - Core Authentication & Profile Management  
**Ports:** Backend: 5000, Frontend: 3001  
**Database:** MongoDB Atlas (database: cognon)

## Tech Stack

### Frontend
- React 18+ with Vite
- React Router DOM
- Redux (auth state management)
- Tailwind CSS
- Axios (API calls)
- Lucide React (icons)

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication (7-day expiry)
- Bcrypt (password hashing)
- Multer (file uploads)
- Nodemailer (email service)
- CORS enabled

### Storage
- Development: Local disk (`/backend/uploads/profiles/`)
- Production: AWS S3/Cloudinary (future migration)

## Architecture

### Authentication
- JWT tokens stored in `localStorage` as `cognon_token`
- Single User model with role field: `student`, `tutor`, `admin`
- Token included in all API requests via Axios interceptor
- Auto-logout on 401 responses

### File Upload Strategy
- Profile images: FormData → Multer → Local disk
- Filename format: `userId_timestamp.ext`
- Stored in MongoDB: filename only
- Served via Express static middleware at `/uploads/profiles/`
- Response includes full URL: `http://localhost:5000/uploads/profiles/...`

### OTP System
- MongoDB collection with TTL index (10-minute expiry)
- Purposes: `email_change`, `password_change`, `email_verification`
- Email change: OTP sent to NEW email
- Password change: OTP sent to CURRENT email
- Auto-delete from DB after expiry

## Frontend Structure
```
src/
├── api/
│   ├── axios.js              # Axios instance with interceptors
│   ├── constants.js          # API_URL, endpoints, routes
│   ├── authAPI.js            # Auth endpoints
│   ├── adminAPI.js           # Admin endpoints (with api import)
│   └── tutorAPI.js           # Tutor endpoints (with api import)
│
├── layouts/
│   ├── AdminLayout.jsx       # Admin wrapper (purple theme)
│   └── TutorLayout.jsx       # Tutor wrapper (sky blue theme)
│
├── components/
│   ├── admin/
│   │   ├── AdminNavbar.jsx
│   │   ├── AdminSidebar.jsx
│   │   └── DummySection.jsx
│   ├── tutor/
│   │   ├── TutorNavbar.jsx
│   │   ├── TutorSidebar.jsx
│   │   ├── ChangeEmailModal.jsx
│   │   └── DummySection.jsx
│   └── Common/
│       └── Footer.jsx         # Shared footer
│
├── pages/
│   ├── admin/
│   │   └── AdminProfile.jsx   # Profile management
│   └── tutor/
│       ├── TutorProfile.jsx   # Profile + Bio (500 char limit)
│       └── ChangePassword.jsx # Password change with auto-logout
│
└── utils/
    └── helpers.js             # getToken, clearAuthData
```

### Frontend Color Schemes
- **Admin:** Purple (#7C3AED primary, #6D28D9 hover)
- **Tutor:** Sky Blue (#0EA5E9 primary, #0284C7 hover)
- **Student:** TBD

### localStorage Keys
- `cognon_token`: JWT token
- `cognon_user`: User object
- `adminInfo`: Admin profile data
- `tutorInfo`: Tutor profile data

## Backend Structure
```
backend/
├── src/
│   ├── config/
│   │   ├── database.js       # MongoDB connection
│   │   └── multer.js         # File upload config (5MB max)
│   │
│   ├── models/
│   │   ├── User.js           # Single model with role field
│   │   └── OTP.js            # OTP storage with TTL
│   │
│   ├── middleware/
│   │   ├── auth.js           # JWT verification (protect)
│   │   └── roleCheck.js      # Role-based access (restrictTo)
│   │
│   ├── controllers/
│   │   ├── admin/
│   │   │   └── profileController.js
│   │   └── tutor/
│   │       └── profileController.js
│   │
│   ├── services/
│   │   ├── emailService.js   # Nodemailer OTP emails
│   │   ├── otpService.js     # Generate/verify OTP
│   │   └── fileService.js    # Delete old images
│   │
│   ├── routes/
│   │   ├── adminRoutes.js    # /api/admin/*
│   │   └── tutorRoutes.js    # /api/tutor/*
│   │
│   └── utils/
│       └── emailTemplates.js # HTML email templates
│
├── uploads/
│   └── profiles/             # Profile images
│
├── .env
└── server.js
```

## Database Models

### User Model
```javascript
{
  name: String,
  email: String (unique, lowercase),
  password: String (bcrypt hashed),
  phone: String,
  role: enum['student', 'tutor', 'admin'],
  profileImage: String,        // Filename
  subject: String,             // Tutor only
  bio: String (max 500),       // Tutor only
  isEmailVerified: Boolean,
  isActive: Boolean,
  isBlocked: Boolean,
  googleAuth: Boolean,
  timestamps: true
}
```

### OTP Model
```javascript
{
  email: String,
  otp: String (6-digit),
  purpose: enum['email_change', 'password_change', 'email_verification'],
  newEmail: String,            // For email_change only
  expiresAt: Date (10 minutes),
  verified: Boolean,
  timestamps: true
}
```

## API Endpoints

### Admin
- `GET /api/admin/profile` - Get profile
- `PUT /api/admin/profile` - Update profile + image (multipart/form-data)
- `POST /api/admin/change-email/request` - Send OTP to new email
- `POST /api/admin/change-email/verify` - Verify OTP & update email
- `POST /api/admin/change-password/request` - Send OTP to current email
- `POST /api/admin/change-password/verify` - Verify OTP & change password

### Tutor
Same endpoints as Admin with `/api/tutor/` prefix

## Completed Features

### Week 1: Profile Management (Admin & Tutor)
- ✅ Admin layout components (Navbar, Sidebar, Profile, Footer)
- ✅ Tutor layout components (Navbar, Sidebar, Profile, Footer)
- ✅ Profile CRUD with image upload
- ✅ Email change with OTP verification (OTP to new email)
- ✅ Password change with OTP verification (OTP to current email)
- ✅ Auto-logout after password change (2 seconds delay)
- ✅ Backend: User & OTP models
- ✅ Backend: Multer file upload (5MB max, jpg/png/gif/webp)
- ✅ Backend: Email service with HTML templates
- ✅ Backend: Profile controllers for Admin & Tutor
- ✅ Backend: JWT authentication middleware
- ✅ Backend: Role-based access control

### Frontend-Backend Integration Status
- ✅ API structure defined (adminAPI.js, tutorAPI.js)
- ✅ Axios interceptors configured
- ⚠️ **Pending:** Import statements added to API files
- ⚠️ **Pending:** Profile components updated with real API calls
- ⚠️ **Pending:** Email/Password modals connected to backend

## Current Phase

**Week 1 Day 5-6:** Finalizing profile management integration

### Integration Requirements
1. Add `import api from './axios';` to adminAPI.js
2. Add `import api from './axios';` to tutorAPI.js
3. Update TutorProfile.jsx handleSave with FormData API call
4. Update AdminProfile.jsx handleSave with FormData API call
5. Update ChangeEmailModal.jsx with tutorAPI calls
6. Update ChangePassword.jsx with tutorAPI calls + auto-logout

## Next Immediate Tasks

### Week 1 Remaining (1-2 days)
1. Complete frontend-backend integration (6 files)
2. Test profile update with image upload
3. Test email change with real OTP emails
4. Test password change with auto-logout
5. Student profile management system

### Week 2 (Critical - Database Design First)
**Day 1:** Database schema design (MUST complete first)
- Course model
- Lesson model
- Enrollment model
- Category model
- Quiz model
- Certificate model

**Day 2-6:** Course CRUD operations
- Course creation (Admin & Tutor)
- Lesson management
- Quiz management
- Course enrollment

## Important Architectural Rules

### File Upload
- Always convert base64 to blob before sending to backend
- Delete old image when updating profile
- Use FormData with `Content-Type: multipart/form-data`
- Images served via Express static: `app.use('/uploads', express.static(...))`

### OTP Flow
- Email change: OTP → NEW email (verify ownership)
- Password change: OTP → CURRENT email (verify identity)
- 10-minute expiry, one-time use
- Auto-delete via MongoDB TTL index

### Password Change Flow
1. Verify OTP
2. Hash password (bcrypt pre-save hook)
3. Save to database
4. Frontend: Show success (2 seconds)
5. Frontend: Clear localStorage
6. Frontend: Redirect to login
7. User must re-login with new password

### Design Patterns
- Children prop pattern for layouts (simpler than Outlet)
- Role-based components (AdminLayout, TutorLayout, StudentLayout)
- Shared components in Common folder
- DummySection placeholders for unimplemented features

### Security
- JWT in Authorization header: `Bearer <token>`
- 401 → Auto-logout and redirect
- Role middleware: `restrictTo('admin', 'tutor')`
- Password hashing on pre-save hook
- OTP verification before sensitive changes

### Environment Variables
**Frontend (.env.local):**
```
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Cognon
```

**Backend (.env):**
```
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=...
JWT_EXPIRE=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=...
EMAIL_PASS=...
API_URL=http://localhost:5000
CLIENT_URL=http://localhost:3001
```

## Known Issues & Decisions

### Avatar Storage
- Current: Local disk storage
- Future: Migrate to AWS S3/Cloudinary
- Filename stored in MongoDB, not full path
- Easy migration path: just change file service

### Layout Architecture
- Decision: Children prop pattern (not React Router Outlet)
- Reason: Simpler state management, direct control
- Each role has dedicated layout component

### Role Management
- Single User model with role field
- No separate Admin/Tutor/Student models
- Simplifies authentication and profile management

### Bio Character Limit
- Tutor only: 500 characters maximum
- Counter displayed: `{bio.length}/500`
- Frontend validation + backend validation

### No Share Profile Button
- Explicitly removed from Tutor sidebar
- User requirement from reference design

## File Locations Reference

**Frontend components:** All in `/mnt/user-data/outputs/`
**Backend guides:** BACKEND_PROFILE_MANAGEMENT_PART1.md, PART2.md
**Integration guide:** FRONTEND_BACKEND_INTEGRATION_GUIDE.md
**Visual diagrams:** VISUAL_FLOW_DIAGRAM.md
**Quick reference:** QUICK_REFERENCE.md

## Context for Next Chat

When resuming this project:
1. Profile management (Admin/Tutor) is complete but needs final integration
2. Student profile management is next (similar to Tutor but simpler)
3. Week 2 MUST start with database schema design before Course CRUD
4. Backend files are documented but not yet created in project
5. Integration requires 6 small file changes (imports + API calls)
6. Timeline is strict: Week 1 = Auth & Profiles, Week 2 = Courses