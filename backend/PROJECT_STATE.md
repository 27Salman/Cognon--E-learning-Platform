# PROJECT_STATE.md - Cognon E-Learning Platform

## Project Overview

Full-stack e-learning platform with role-based authentication (Admin, Tutor, Student).

**Current Status:** Backend authentication complete (Week 1 - Days 1-3)

**Repository:** Cognon Platform
**Structure:** Monorepo (backend + frontend)

---

## Tech Stack

### Backend
- Node.js 18.x
- Express.js 4.x
- MongoDB 6.x (Atlas)
- Mongoose 7.x
- JWT (jsonwebtoken 9.x)
- bcryptjs 2.4.3

### Frontend
- React 18.x
- Redux Toolkit
- React Router 6.x
- Tailwind CSS
- Axios

---

## Architecture

### Pattern
- **Backend:** MVC with Services Layer
- **Separation:** Model → Service → Controller → Route
- **Auth:** JWT-based stateless authentication
- **Roles:** RBAC (Role-Based Access Control)

### Request Flow
```
Route → Middleware → Controller → Service → Model → Database
```

### Layer Responsibilities
- **Model:** Data structure, schema validation, pre/post hooks
- **Service:** Business logic, reusable operations
- **Controller:** HTTP handling (thin, 10-20 lines)
- **Middleware:** Authentication, authorization, validation
- **Utility:** Helper functions (token generation, etc.)

---

## Backend Structure
```
backend/
├── src/
│   ├── config/
│   │   ├── database.js          # MongoDB connection
│   │   └── constants.js         # App constants
│   ├── models/
│   │   └── User.js              # Single user model (all roles)
│   ├── services/
│   │   └── authService.js       # Auth business logic
│   ├── controllers/
│   │   └── authController.js    # HTTP handlers
│   ├── middlewares/
│   │   ├── authMiddleware.js    # JWT verification
│   │   ├── roleMiddleware.js    # Role checking
│   │   └── errorMiddleware.js   # Error handling
│   ├── routes/
│   │   ├── authRoutes.js        # Auth endpoints
│   │   └── index.js             # Route aggregator
│   └── utils/
│       └── generateToken.js     # JWT generation
├── uploads/
├── .env
├── .gitignore
├── package.json
└── server.js                     # Entry point
```

---

## Auth Strategy

### Single User Model
- **Model:** User.js handles all roles (Student, Tutor, Admin)
- **Role Field:** Enum ['student', 'tutor', 'admin']
- **Profiles:** Conditional (studentProfile, tutorProfile)

### Authentication Flow
1. User registers (student/tutor only)
2. Password hashed (bcrypt, pre-save hook)
3. JWT generated (7d expiry, contains userId + role)
4. Token sent to client
5. Client stores token (localStorage)
6. Token sent in Authorization header
7. Middleware verifies token → sets req.user

### Authorization
- **protect middleware:** Verify JWT, attach user to req.user
- **restrictTo(...roles):** Check user role
- **adminOnly/tutorOnly/studentOnly:** Convenience methods

### Admin Creation
- Admin accounts manually created in database
- No signup endpoint for admin

---

## Database Design

### User Model (models/User.js)

**Common Fields:**
- name, email (unique), password (hashed), phone
- role: 'student' | 'tutor' | 'admin'
- status: 'active' | 'blocked' | 'pending' | 'inactive'
- profileImage, isVerified, lastLogin

**Student-Specific:**
```javascript
studentProfile: {
  enrolledCourses: [{ courseId, enrolledAt, progress, completedLessons }],
  certificates: [ObjectId]
}
```

**Tutor-Specific:**
```javascript
tutorProfile: {
  bio, expertise: [], experience,
  coursesCreated: [ObjectId],
  isApproved: Boolean  // Admin must approve
}
```

**Hooks:**
- Pre-save: Hash password if modified

**Instance Methods:**
- comparePassword(candidatePassword)
- hasRole(role)

---

## Completed Features

### Day 1: Foundation
- [x] User model (single model, role-based)
- [x] authService (registerUser, loginUser, validation)
- [x] generateToken utility
- [x] Database connection
- [x] Constants configuration

### Day 2: Controllers & Routes
- [x] authController (signup, login, logout, getCurrentUser)
- [x] authRoutes (public + protected endpoints)
- [x] Routes connected to server.js

### Day 3: Middleware
- [x] authMiddleware (protect, optionalAuth)
- [x] roleMiddleware (restrictTo, adminOnly, tutorOnly, studentOnly)
- [x] errorMiddleware (global error handling, 404 handler)
- [x] Protected routes updated (/logout, /me)

---

## API Endpoints

### Public Routes
```
POST /api/auth/signup   - Register student/tutor
POST /api/auth/login    - Login all roles
```

### Protected Routes
```
POST /api/auth/logout   - Logout (requires token)
GET  /api/auth/me       - Get current user (requires token)
```

---

## Environment Variables
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
```

---

## Current Phase

**Week 1: Backend Authentication - COMPLETE**

Authentication system fully functional:
- User registration (students, tutors)
- User login (all roles)
- JWT token generation
- Token verification
- Role-based access control
- Error handling
- Password encryption
- Status management (blocked users)

---

## Next Immediate Tasks

### Option 1: Frontend (Recommended)
- React authentication pages (Login, Signup)
- Protected routes (ProtectedRoute component)
- Token storage (localStorage)
- API integration (axios + Redux)
- Role-based UI routing

### Option 2: Backend Core Modules
- Course model + CRUD
- Category model + CRUD
- Enrollment system
- User profile management

### Option 3: Backend Enhancements
- Password reset
- Email verification
- Refresh tokens
- Admin approval system for tutors

---

## Important Architectural Rules

1. **Single User Model:** One User model with role field, NOT separate models
2. **Services Layer:** All business logic in services, NOT controllers
3. **Thin Controllers:** Controllers only handle HTTP (10-20 lines)
4. **Password Hashing:** Automatic in model pre-save hook
5. **JWT in Headers:** Format: `Authorization: Bearer <token>`
6. **Middleware Order:** protect → role check → controller
7. **Error Handling:** Centralized in errorMiddleware
8. **No SuperAdmin:** Single admin is sufficient
9. **Tutor Approval:** Tutors require admin approval (isApproved field)
10. **Status Checks:** Blocked users cannot login

---

## Testing

**Tools:** Postman
**Test Flow:**
1. Signup student/tutor
2. Login → receive token
3. Access /me with token → success
4. Access /me without token → 401
5. Login as unapproved tutor → 401

---

## Key Dependencies
```json
{
  "express": "^4.18.2",
  "mongoose": "^7.6.3",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2",
  "dotenv": "^16.3.1",
  "cors": "^2.8.5",
  "helmet": "^7.0.0"
}
```

---

## Notes

- MongoDB connection: Atlas (cloud)
- Token expiry: 7 days (configurable)
- CORS enabled for http://localhost:3000
- Error responses: Consistent format { success, message }
- Password min length: 6 characters
- Phone validation: Indian format (10 digits, starts with 6-9)

---

**Last Updated:** Week 1 Day 3 Complete
**Ready For:** Frontend development or backend module expansion