# PROJECT_STATE.md - Cognon E-Learning Platform

## Project Overview

**Name:** Cognon E-Learning Platform  
**Type:** Full-stack MERN e-learning application  
**Purpose:** Educational platform with three user roles (Student, Tutor, Admin)  
**Status:** Week 1 Complete (Backend Auth), Frontend Setup Complete  
**Developer:** Learning full-stack development through structured project building

---

## Tech Stack

### Backend
- **Runtime:** Node.js v18+
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (jsonwebtoken) with bcrypt password hashing
- **Validation:** express-validator
- **Security:** cors, helmet, express-rate-limit
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
- **API Testing:** Postman (collection available)
- **Version Control:** Git/GitHub
- **Code Editor:** VS Code (assumed)

---

## Architecture Overview

### System Architecture
- **Pattern:** Monorepo with separate `/backend` and `/frontend` folders
- **API Style:** RESTful JSON API
- **Auth Method:** JWT tokens (7-day expiry) stored in localStorage
- **Communication:** Frontend (port 3000) → Backend (port 5000) via Vite proxy

### Key Architectural Decisions
1. **Single User Model:** One unified User schema with `role` field (student/tutor/admin)
2. **Separate Admin Login:** `/admin/login` as hidden URL for security
3. **Role-Based Routing:** Client-side route guards (ProtectedRoute, RoleRoute)
4. **Token Storage:** localStorage (key: `cognon_token`, `cognon_user`)
5. **Auto-Redirect:** Based on user role after successful login
6. **Color Scheme:** Primary purple (#8b5cf6) for all roles (not blue)

---

## Backend Structure
```
backend/
├── server.js              # Entry point
├── config/
│   └── db.js             # MongoDB connection
├── models/
│   └── User.js           # Unified user model (Student/Tutor/Admin)
├── routes/
│   └── authRoutes.js     # Auth endpoints
├── controllers/
│   └── authController.js # Auth logic (signup, login, getCurrentUser)
├── middleware/
│   └── authMiddleware.js # JWT verification, role-based access
├── utils/
│   └── validation.js     # Input validation functions
└── .env                  # Environment variables
```

### Backend API Endpoints

**Auth Routes** (`/api/auth`)
- `POST /signup` - Register student/tutor (role in body)
- `POST /login` - Login all roles (email, password)
- `GET /me` - Get current user (requires auth)

### User Model Schema
```javascript
{
  name: String (required, min 3 chars),
  email: String (required, unique, validated),
  phone: String (required, 10 digits, starts 6-9),
  password: String (required, hashed with bcrypt, min 6 chars),
  role: String (enum: ['student', 'tutor', 'admin'], default: 'student'),
  status: String (enum: ['active', 'inactive', 'blocked'], default: 'active'),
  createdAt: Date,
  updatedAt: Date
}
```

### Backend Environment Variables
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/cognon
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development
```

---

## Frontend Structure
```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── api/
│   │   ├── axios.js              # Axios instance with interceptors
│   │   └── authAPI.js            # Auth API calls
│   ├── components/
│   │   └── common/
│   │       ├── Button.jsx        # Reusable button
│   │       ├── Input.jsx         # Form input with validation
│   │       └── Loader.jsx        # Loading spinner
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.jsx         # Student/Tutor login with tabs
│   │   │   ├── Signup.jsx        # Student/Tutor signup with tabs
│   │   │   ├── AdminLogin.jsx    # Admin-only login
│   │   │   ├── ForgotPassword.jsx
│   │   │   └── AdminForgotPassword.jsx
│   │   ├── student/
│   │   │   └── StudentDashboard.jsx
│   │   ├── tutor/
│   │   │   └── TutorDashboard.jsx
│   │   ├── admin/
│   │   │   └── AdminDashboard.jsx
│   │   └── Home.jsx              # Landing page
│   ├── routes/
│   │   ├── ProtectedRoute.jsx    # Auth guard
│   │   └── RoleRoute.jsx         # Role-based guard
│   ├── store/
│   │   ├── store.js              # Redux store config
│   │   └── slices/
│   │       └── authSlice.js      # Auth state + thunks
│   ├── utils/
│   │   ├── constants.js          # Routes, roles, API endpoints
│   │   └── helpers.js            # Token mgmt, validation, formatting
│   ├── App.jsx                   # Main routing
│   ├── main.jsx                  # Entry point
│   └── index.css                 # Global Tailwind styles
├── .env
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

### Frontend Routes

**Public:**
- `/` - Home
- `/login` - Student/Tutor login
- `/signup` - Student/Tutor signup
- `/forgot-password` - Student/Tutor password reset
- `/admin/login` - Admin login (hidden URL)
- `/admin/forgot-password` - Admin password reset

**Protected (Student):**
- `/student/dashboard`
- `/student/courses`
- `/student/profile`

**Protected (Tutor):**
- `/tutor/dashboard`
- `/tutor/courses`
- `/tutor/profile`
- `/tutor/revenues`

**Protected (Admin):**
- `/admin/dashboard`
- `/admin/users`
- `/admin/courses`
- `/admin/categories`
- `/admin/tutors`

### Redux Auth State
```javascript
{
  user: null,           // User object from backend
  token: null,          // JWT token
  isAuthenticated: false,
  loading: false,
  error: null
}
```

### Axios Interceptors
- **Request:** Auto-attach JWT token from localStorage
- **Response:** Handle 401 (logout + redirect), 403, 500 errors

### Frontend Environment Variables
```
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Cognon
```

---

## Authentication Strategy

### Flow
1. User submits credentials → dispatch `loginUser()`
2. API call → backend validates → returns `{ token, user }`
3. Redux saves to state + localStorage
4. Axios interceptor adds token to future requests
5. Auto-redirect based on `user.role`
6. On 401 error → auto-logout + clear state + redirect `/login`

### Validation Rules
- **Email:** Standard email regex
- **Phone:** 10 digits, starts with 6-9 (Indian format)
- **Password:** Minimum 6 characters
- **Name:** Minimum 3 characters

### Security Features
- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with 7-day expiry
- Admin login separate URL for security
- Role verification on protected routes (both frontend + backend)
- CORS enabled for `http://localhost:3000`

---

## Design System

### Colors (Tailwind Config)
```javascript
primary: {
  50: '#f5f3ff',
  500: '#8b5cf6',  // Main brand purple
  600: '#7c3aed',
  700: '#6d28d9',
}
```

### Login/Signup Pages
- **Layout:** Split-screen (illustration left, form right)
- **Tabs:** Student/Tutor role selection
- **Theme:** Purple gradient background
- **Dynamic:** Left side animates when switching roles
- **Responsive:** Mobile-first design

---

## Completed Features

### Backend (Week 1)
✅ MongoDB connection setup  
✅ User model with role-based schema  
✅ Auth controller (signup, login, getCurrentUser)  
✅ JWT authentication middleware  
✅ Input validation  
✅ Password hashing  
✅ Error handling  
✅ CORS configuration  
✅ Postman collection for testing  

### Frontend (Current)
✅ Project setup with Vite + React 18  
✅ Redux Toolkit state management  
✅ Axios configuration with interceptors  
✅ Protected route guards (auth + role-based)  
✅ Login page (Student/Tutor tabs, dynamic UI)  
✅ Signup page (Student/Tutor tabs, dynamic UI)  
✅ Admin login page (separate)  
✅ Forgot password pages (all roles)  
✅ Dashboard placeholders (Student, Tutor, Admin)  
✅ Reusable components (Button, Input, Loader)  
✅ Token management utilities  
✅ Form validation  
✅ Toast notifications  
✅ Tailwind CSS styling with purple theme  
✅ Responsive design  

---

## Current Phase

**Status:** Frontend authentication UI complete and functional  
**Working:** Dev server running, all auth pages rendering  
**Testing:** Ready for integration testing with backend  

---

## Next Immediate Tasks

### Week 1: Pendings
1. Complete the authentication processes
2. OTP verification, email etc
3. Make the password strong
4. Need validation for username
5. Google login and signup
6. Showing an error when a user or tutor registers.(Showing a pop up  message of "next is not a function" error)
7. The registration and login fails

### Week 2: Full Auth Integration & Testing
1. Start backend server (`npm start` in `/backend`)
2. Start frontend server (`npm run dev` in `/frontend`)
3. Test signup flow (Student → create account → auto-login → redirect)
4. Test login flow (Tutor → login → redirect to dashboard)
5. Test admin login flow
6. Verify protected routes (try accessing without login)
7. Verify role restrictions (student cannot access tutor routes)
8. Test logout functionality
9. Test token persistence (refresh page, should stay logged in)

### Week 3: Course Module (Planned)
- Course model (title, description, tutor, price, modules)
- Course CRUD endpoints
- Course listing page
- Course detail page
- Enrollment system

---

## Important Architectural Rules

### Code Standards
1. **React Components:** Functional components with hooks only
2. **File Naming:** PascalCase for components, camelCase for utilities
3. **State Management:** Redux for global auth, local state for UI-only
4. **API Calls:** Always through Redux thunks, never direct in components
5. **Error Handling:** Try-catch in thunks, display via toast
6. **Loading States:** Show spinner on async operations
7. **Validation:** Both client-side (instant feedback) and server-side (security)

### Dependency Versions (Critical)
- React: 18.3.1 (NOT 19.x)
- Vite: 5.4.11 (NOT 7.x or 8.x beta)
- Tailwind: 3.4.17 (NOT 4.x)
- Use exact versions in `package.json` (no ^ or ~)

### Common Issues & Solutions
- **Vite cache errors:** Delete `node_modules/.vite` and restart
- **Port 3000 busy:** Kill process with `taskkill /PID <number> /F`
- **Blank page:** Hard refresh `Ctrl+Shift+R` or use incognito
- **401 errors:** Check backend running, verify token in localStorage

### File Location Rules
- **Never commit:** `node_modules/`, `.env`, `dist/`
- **Backend runs on:** Port 5000
- **Frontend runs on:** Port 3000
- **MongoDB runs on:** localhost:27017

---

## Development Workflow

### Starting Development
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Testing Auth Flow
1. Open `http://localhost:3000/signup`
2. Register as student with test credentials
3. Verify auto-login and redirect to `/student/dashboard`
4. Logout and test login at `/login`
5. Test role switching (Student ↔ Tutor tabs)

---

## Project Documentation Reference

- **Postman Collection:** `Cognon_postman_collection.json`
- **Module List:** `Cognon_Module_list.pdf`
- **Timeline:** `Cognon_Timeline.pdf`
- **Admin UI Reference:** `Cognon__admincompressed.pdf`
- **Tutor UI Reference:** `Cognon__tutorcompressed.pdf`
- **Architecture Diagram:** `diagramexport11620268_45_56PM.png`

---

**Last Updated:** Week 1 Complete, Frontend Setup Complete, the bugs to be fixed. 
**Next Milestone:** Complete the google authentication login configure settings, otp varifications etc, forgot password sending to email and verification etc, Full authentication testing and course module planning