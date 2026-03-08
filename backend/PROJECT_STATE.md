# PROJECT_STATE.md - Cognon E-Learning Platform

## Project Overview

**Name:** Cognon E-Learning Platform  
**Type:** Full-stack MERN e-learning application  
**Purpose:** Educational platform with three user roles (Student, Tutor, Admin)  
**Status:** Week 1 Complete - Authentication with OTP verification implemented  
**Developer:** Learning full-stack development through structured project building

---

## Tech Stack

### Backend
- **Runtime:** Node.js v18+
- **Framework:** Express.js 5.2.1
- **Database:** MongoDB Atlas (Cloud) with Mongoose ODM
- **Authentication:** JWT (jsonwebtoken) with bcrypt password hashing
- **Validation:** express-validator
- **Security:** cors, helmet, express-rate-limit
- **Email:** Nodemailer (Gmail SMTP)
- **Environment:** dotenv

### Frontend
- **Library:** React 18.3.1
- **Build Tool:** Vite 5.4.11
- **State Management:** Redux Toolkit 2.2.7
- **Routing:** React Router DOM 6.26.0
- **Styling:** Tailwind CSS 3.4.17
- **HTTP Client:** Axios 1.7.2
- **UI Utilities:** react-hot-toast 2.4.1, react-icons 5.2.1

### Development Tools
- **API Testing:** Postman
- **Version Control:** Git/GitHub
- **Database Management:** MongoDB Atlas

---

## Architecture Overview

### System Architecture
- **Pattern:** Monorepo with separate `/backend` and `/frontend` folders
- **API Style:** RESTful JSON API
- **Auth Method:** JWT tokens (7-day expiry) stored in localStorage
- **Communication:** Frontend (port 3000) → Backend (port 5000)

### Key Architectural Decisions
1. **Single User Model:** One unified User schema with `role` field (student/tutor/admin)
2. **Role-Based Profiles:** Students have `studentProfile`, Tutors have `tutorProfile`
3. **Student-to-Tutor Upgrade:** Students can become tutors (retain both profiles)
4. **Email Verification:** OTP-based verification (5-minute expiry)
5. **Separate Admin Login:** `/admin/login` as hidden URL for security
6. **Role-Based Routing:** Client-side route guards (ProtectedRoute, RoleRoute)
7. **Token Storage:** localStorage (keys: `cognon_token`, `cognon_user`)
8. **Auto-Redirect:** Based on user role after successful login
9. **Color Scheme:** Primary purple (#8b5cf6) for all roles

---

## Backend Structure
```
backend/
├── server.js
├── .env
├── src/
│   ├── config/
│   │   ├── db.js
│   │   └── constants.js
│   ├── models/
│   │   ├── User.js
│   │   └── Course.js
│   ├── routes/
│   │   ├── index.js
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   └── devRoutes.js (development only)
│   ├── controllers/
│   │   ├── authController.js
│   │   └── userController.js
│   ├── services/
│   │   ├── authService.js
│   │   └── emailService.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── roleMiddleware.js
│   │   ├── errorMiddleware.js
│   │   ├── asyncHandler.js
│   │   └── validation.js
│   ├── validators/
│   │   └── authValidator.js
│   └── utils/
│       ├── generateToken.js
│       └── otpGenerator.js
└── package.json
```

### Backend API Endpoints

**Auth Routes** (`/api/auth`)
- `POST /signup` - Register student/tutor with OTP email
- `POST /login` - Login with email verification check
- `POST /verify-otp` - Verify email with 6-digit OTP
- `POST /resend-otp` - Resend verification OTP
- `POST /forgot-password` - Request password reset OTP
- `POST /verify-reset-otp` - Verify reset OTP
- `POST /reset-password` - Reset password with token
- `POST /logout` - Logout (requires auth)
- `GET /me` - Get current user (requires auth)

**User Routes** (`/api/users`)
- `POST /upgrade-to-tutor` - Upgrade student to tutor (requires auth)

**Dev Routes** (`/api/dev` - development only)
- `GET /users` - List all users
- `DELETE /users/clear` - Delete all users
- `DELETE /users/unverified` - Delete unverified users
- `DELETE /users/email/:email` - Delete by email

---

## Frontend Structure
```
frontend/
├── public/
├── src/
│   ├── api/
│   │   ├── axios.js
│   │   └── authAPI.js
│   ├── components/
│   │   └── common/
│   │       ├── Button.jsx
│   │       ├── Input.jsx
│   │       └── Loader.jsx
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── VerifyOTP.jsx
│   │   │   ├── AdminLogin.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   └── AdminForgotPassword.jsx
│   │   ├── student/
│   │   │   └── StudentDashboard.jsx
│   │   ├── tutor/
│   │   │   └── TutorDashboard.jsx
│   │   ├── admin/
│   │   │   └── AdminDashboard.jsx
│   │   └── Home.jsx
│   ├── routes/
│   │   ├── ProtectedRoute.jsx
│   │   └── RoleRoute.jsx
│   ├── store/
│   │   ├── store.js
│   │   └── slices/
│   │       └── authSlice.js
│   ├── utils/
│   │   ├── constants.js
│   │   └── helpers.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env
├── vite.config.js
├── tailwind.config.js
└── package.json
```

### Frontend Routes

**Public:**
- `/` - Home
- `/login` - Student/Tutor login (tabbed)
- `/signup` - Student/Tutor signup (tabbed)
- `/verify-otp` - OTP verification
- `/forgot-password` - Password reset
- `/admin/login` - Admin login (hidden)

**Protected (Student):**
- `/student/dashboard`

**Protected (Tutor):**
- `/tutor/dashboard`

**Protected (Admin):**
- `/admin/dashboard`

---

## Authentication Strategy

### Registration Flow
1. User submits signup form (role selection: Student/Tutor)
2. Frontend validates input, dispatches `signupUser()` thunk
3. Backend validates, creates user with `isVerified: false`
4. Backend generates 6-digit OTP, stores in-memory (5-minute expiry)
5. Backend sends OTP via email (Nodemailer + Gmail SMTP)
6. User redirected to `/verify-otp` with email and timestamp
7. User enters OTP, backend verifies
8. Backend sets `isVerified: true`
9. User redirected to `/login`

### Login Flow
1. User submits credentials
2. Backend checks `isVerified` flag
3. If not verified, throws error
4. If tutor, checks `tutorProfile.isApproved`
5. Returns JWT token + user object
6. Frontend stores in localStorage
7. Auto-redirect based on role

### OTP System
- **Storage:** In-memory Map (resets on server restart)
- **Expiry:** 5 minutes
- **Attempts:** Max 3 attempts per OTP
- **Resend:** Available after 60 seconds
- **Timer:** Client-side countdown with timestamp tracking

### Security Features
- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with 7-day expiry
- Unverified users auto-deleted on re-registration
- Role verification on protected routes (frontend + backend)
- CORS enabled for `http://localhost:3000`
- Multi-database cleanup (prevents ghost users in `test` database)

---

## User Model Schema
```javascript
{
  name: String (required, 3-50 chars),
  email: String (required, unique, lowercase),
  phone: String (required, 10 digits, starts 6-9),
  password: String (required, bcrypt hashed, min 8 chars),
  role: String (enum: ['student', 'tutor', 'admin'], default: 'student'),
  status: String (enum: ['active', 'inactive', 'blocked'], default: 'active'),
  isVerified: Boolean (default: false),
  
  studentProfile: {
    enrolledCourses: [{ courseId, enrolledAt, progress, completedLessons }],
    certificates: [ObjectId]
  },
  
  tutorProfile: {
    bio: String (max 500 chars),
    expertise: [String],
    experience: Number,
    coursesCreated: [ObjectId],
    isApproved: Boolean (default: false)
  },
  
  profileImage: String (default placeholder),
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### User Role Architecture
- **Student Only:** Has `studentProfile`, no `tutorProfile`
- **Tutor Only:** Has `tutorProfile`, no `studentProfile`
- **Student → Tutor:** Has both profiles (role changes to 'tutor')

---

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://cognonuser:Cognon123@cognon.unc0blb.mongodb.net/cognon?retryWrites=true&w=majority
JWT_SECRET=mySecretKey123
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3000

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=cognon.elearning@gmail.com
SMTP_PASS=muxlrhrnfyfzjnuj
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Cognon
```

---

## Completed Features

### Backend
- MongoDB connection with retry logic
- User model with role-based profiles
- Auth controller (signup, login, logout, getCurrentUser)
- JWT authentication middleware
- Role-based access middleware
- Input validation with express-validator
- Password hashing with bcrypt
- Error handling middleware
- CORS configuration
- OTP generation and storage (in-memory Map)
- Email service (Nodemailer + Gmail)
- OTP verification endpoints
- Password reset with OTP
- Multi-database cleanup (prevents ghost users)
- Student-to-tutor upgrade endpoint
- Dev routes for testing

### Frontend
- Vite + React 18 setup
- Redux Toolkit state management
- Axios configuration with interceptors
- Protected route guards (auth + role-based)
- Login page (Student/Tutor tabs)
- Signup page (Student/Tutor tabs)
- OTP verification page with timer
- Admin login page
- Forgot password pages
- Dashboard placeholders (Student, Tutor, Admin)
- Reusable components (Button, Input, Loader)
- Token management utilities
- Form validation
- Toast notifications
- Tailwind CSS with purple theme
- Responsive design
- Password strength indicator

---

## Current Phase

**Status:** Authentication complete and functional  
**Working:** Signup → OTP verification → Login → Dashboard redirect  
**Email System:** Configured with Gmail SMTP, OTP delivery working  
**Database:** MongoDB Atlas (cognon database)

---

## Known Issues & Fixes Applied

### Issue: Ghost Users in Multiple Databases
**Problem:** Users created in both `cognon` and `test` databases  
**Cause:** Connection string missing database name at one point  
**Fix:** authService now cleans unverified users from ALL databases

### Issue: Role Not Saving Correctly
**Problem:** Tutor registration saving as student  
**Cause:** Backend not using role parameter from request  
**Fix:** authService properly uses `role || USER_ROLES.STUDENT`

### Issue: Duplicate Index Warning
**Problem:** Mongoose warning about duplicate email index  
**Cause:** Index defined in both schema field and schema.index()  
**Fix:** Remove explicit schema.index() calls

---

## Next Immediate Tasks

### Week 2: Complete Auth Polish
- Implement Google OAuth (Passport.js)
- Add strong password requirements (8 chars, uppercase, lowercase, number, special)
- Add username uniqueness validation
- Test complete auth flow end-to-end
- Add admin approval workflow for tutors

### Week 3: Course Module
- Course model (title, description, tutor, price, modules, lessons)
- Course CRUD endpoints
- Course listing page
- Course detail page
- Enrollment system
- Tutor course creation interface

---

## Important Architectural Rules

### Code Standards
- React: Functional components with hooks only
- File Naming: PascalCase for components, camelCase for utilities
- State Management: Redux for global auth, local state for UI
- API Calls: Through Redux thunks, never direct in components
- Error Handling: Try-catch in thunks, display via toast
- Loading States: Show spinner on async operations
- Validation: Client-side (instant feedback) + server-side (security)

### Dependency Versions (Critical)
- React: 18.3.1 (NOT 19.x)
- Vite: 5.4.11 (NOT 7.x or 8.x)
- Tailwind: 3.4.17 (NOT 4.x)
- Express: 5.2.1
- Mongoose: 9.1.4

### Database Rules
- Never commit: `node_modules/`, `.env`, `dist/`
- Backend: Port 5000
- Frontend: Port 3000
- MongoDB: Atlas cloud (cognon database)
- Always specify database name in MONGO_URI

### Common Issues
- Vite cache errors: Delete `node_modules/.vite` and restart
- Port busy: `taskkill /PID <number> /F` (Windows)
- Blank page: Hard refresh `Ctrl+Shift+R`
- 401 errors: Check backend running, verify token in localStorage
- Ghost users: Run cleanup script to delete from all databases

---

**Last Updated:** March 8, 2026  
**Next Milestone:** Google OAuth + Strong password validation + Course module planning