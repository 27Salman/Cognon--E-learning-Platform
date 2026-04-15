# Cognon — E-Learning Platform

A full-stack MERN e-learning platform built as a first project, following real-world architecture patterns. This document captures the current state of the application, what has been built, architectural decisions made, bugs encountered and resolved, and what remains to be done.

---

## Tech Stack

### Backend
- Node.js + Express 5
- MongoDB + Mongoose
- JWT authentication (7-day expiry)
- Bcrypt (password hashing via pre-save hook)
- Multer (local file uploads)
- Nodemailer (OTP emails)
- Passport + Google OAuth 2.0
- Helmet, CORS, express-rate-limit, express-mongo-sanitize (security)
- Razorpay (payment — installed, not yet integrated)
- Socket.io (real-time — installed, not yet integrated)

### Frontend
- React 18 + Vite
- React Router DOM v6
- Redux Toolkit + React-Redux (auth state)
- Tailwind CSS
- Axios (with interceptors)
- Lucide React (icons)
- React Hot Toast (notifications)

---

## Project Structure

```
cognon/
├── backend/
│   ├── server.js
│   ├── scripts/
│   │   └── admin.js              # CLI script to create admin user
│   └── src/
│       ├── config/
│       │   ├── constants.js      # All enums and constants
│       │   ├── db.js             # MongoDB connection
│       │   └── multer.js         # File upload config
│       ├── controllers/
│       │   ├── adminController.js
│       │   ├── authController.js
│       │   ├── courseController.js
│       │   ├── googleAuthController.js
│       │   ├── tutorController.js
│       │   └── userController.js
│       ├── middleware/
│       │   ├── asyncHandler.js   # Wraps async route handlers
│       │   ├── authMiddleware.js # JWT protect middleware
│       │   ├── errorMiddleware.js
│       │   ├── roleMiddleware.js # Role + approval checks
│       │   └── validation.js
│       ├── models/
│       │   ├── Course.js
│       │   ├── OTP.js
│       │   └── User.js
│       ├── routes/
│       │   ├── adminRoutes.js
│       │   ├── authRoutes.js
│       │   ├── courseRoutes.js
│       │   └── tutorRoutes.js
│       ├── services/
│       │   ├── adminService.js
│       │   ├── authService.js
│       │   ├── courseService.js
│       │   ├── emailService.js
│       │   ├── fileService.js
│       │   ├── otpService.js
│       │   ├── tutorService.js
│       │   └── userService.js
│       ├── uploads/              # Local profile image storage
│       ├── utils/
│       │   └── generateToken.js
│       └── validators/
│           ├── authValidator.js
│           ├── courseValidator.js
│           └── userValidator.js
│
└── frontend/
    └── src/
        ├── api/
        │   ├── axios.js          # Axios instance + interceptors
        │   ├── adminAPI.js
        │   ├── authAPI.js
        │   ├── studentAPI.js
        │   └── tutorAPI.js
        ├── components/
        │   ├── admin/
        │   ├── auth/
        │   ├── common/
        │   ├── layouts/
        │   ├── student/
        │   └── tutor/
        ├── pages/
        │   ├── admin/
        │   ├── auth/
        │   ├── student/
        │   └── tutor/
        ├── routes/
        │   ├── ProtectedRoute.jsx
        │   └── RoleRoute.jsx
        ├── store/
        │   ├── store.js
        │   └── slices/authSlice.js
        └── utils/
            ├── constants.js
            └── helpers.js
```

---

## Environment Variables

### Backend (`backend/.env`)
```
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email
EMAIL_PASS=your_app_password
BASE_URL=http://localhost:5000
CLIENT_URL=http://localhost:3001
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### Frontend (`frontend/.env`)
```
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Cognon
```

---

## Running the Project

```bash
# Backend
cd backend
npm install
npm run dev          # nodemon server.js on port 5000

# Create admin user
npm run create-admin

# Frontend
cd frontend
npm install
npm run dev          # Vite on port 3001
```

---

## Database Models

### User
Single model for all roles (student, tutor, admin) with role field.

```js
{
  name, email, password, phone,
  role: enum['student', 'tutor', 'admin'],
  status: enum['active', 'blocked', 'inactive'],
  profileImage,
  isVerified,
  authProvider: enum['local', 'google'],
  studentProfile: { enrolledCourses, certificates },
  tutorProfile: {
    bio, subject, expertise, experience,
    coursesCreated,
    approvalStatus: enum['pending', 'approved', 'rejected']
  }
}
```

### OTP
```js
{
  email, otp, purpose: enum['email_change', 'password_change', 'email_verification'],
  newEmail,       // only for email_change
  verified,
  expiresAt       // TTL index — auto-deleted after 10 minutes
}
```

---

## API Endpoints

### Auth (`/api/auth`)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/signup` | Register student or tutor |
| POST | `/login` | Login with role |
| POST | `/logout` | Logout |
| GET | `/me` | Get current user |
| POST | `/verify-otp` | Verify email OTP |
| POST | `/resend-otp` | Resend verification OTP |
| POST | `/forgot-password` | Send password reset OTP |
| POST | `/verify-reset-otp` | Verify reset OTP |
| POST | `/reset-password` | Reset password |

### Admin (`/api/admin`) — requires admin JWT
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/profile` | Get admin profile |
| PUT | `/profile` | Update profile + image |
| POST | `/change-password/request` | Send OTP |
| POST | `/change-password/verify` | Change password |
| GET | `/tutors` | List tutors (paginated, filterable) |
| GET | `/students` | List students (paginated, filterable) |
| PATCH | `/tutors/:id/approve` | Approve tutor |
| PATCH | `/tutors/:id/reject` | Reject tutor |
| PATCH | `/users/:id/block` | Block user |
| PATCH | `/users/:id/unblock` | Unblock user |

### Tutor (`/api/tutor`) — requires tutor JWT + approved status
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/profile` | Get profile |
| PUT | `/profile` | Update profile + image |
| POST | `/change-email/request` | Send OTP to new email |
| POST | `/change-email/verify` | Verify OTP + update email |
| POST | `/change-password/request` | Send OTP |
| POST | `/change-password/verify` | Change password |

### Student (`/api/user`) — requires student JWT
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/profile` | Get profile |
| PUT | `/profile` | Update profile + image |
| POST | `/change-password/request` | Send OTP |
| POST | `/change-password/verify` | Change password |

---

## Architecture Decisions

### Service Pattern
All business logic lives in service files. Controllers are thin HTTP handlers only.

```
Request → Route → Middleware → Controller → Service → Response
```

Controllers only call service methods and send responses. Services throw errors, controllers never catch and re-throw.

### Error Handling
- `asyncHandler` middleware wraps all async route handlers — no try/catch in controllers
- Services throw plain `Error` objects with meaningful messages
- `errorMiddleware` handles all errors centrally, including Mongoose `CastError`, duplicate key `11000`, `ValidationError`, JWT errors
- No try/catch in services unless transforming a specific low-level error into a domain error

### Authentication Flow
- JWT stored in `localStorage` as `cognon_token`
- Axios interceptor attaches token to every request
- 401 response → auto-logout + redirect to login
- `ProtectedRoute` checks `isAuthenticated` from Redux
- `RoleRoute` checks `user.role` against `allowedRoles`

### Tutor Approval Flow
- New tutors register with `approvalStatus: 'pending'`
- Tutors can log in and edit their profile at any time
- `tutorOnly` middleware blocks course creation and other actions until `approvalStatus === 'approved'`
- Admin approves/rejects from Tutor Management page
- Three states: `pending` → `approved` or `rejected`

### OTP Flow
- Email change: OTP sent to the **new** email (proves ownership)
- Password change: OTP sent to the **current** email (proves identity)
- 10-minute TTL via MongoDB index — auto-deleted after expiry
- One-time use — marked `verified: true` after use

### File Uploads
- Multer stores files locally in `backend/src/uploads/`
- Filename format: `userId-timestamp.ext`
- Only the filename is stored in MongoDB
- Full URL built at response time using `BASE_URL`
- Old image deleted from disk when a new one is uploaded
- Future: migrate to Cloudinary/S3 by changing `fileService.js` only

---

## Frontend Architecture

### Routing
```
/ → Home (public)
/login, /signup → Auth pages (public)
/student/* → ProtectedRoute → RoleRoute(['student']) → StudentLayout
/tutor/* → ProtectedRoute → RoleRoute(['tutor']) → TutorLayout
/admin/* → ProtectedRoute → RoleRoute(['admin']) → AdminLayout
/unauthorized → 403 page
* → 404 page
```

### Role-Based Access
- `ProtectedRoute` — redirects to login if not authenticated
- `RoleRoute` — redirects to `/unauthorized` if wrong role
- `Unauthorized.jsx` — 403 page with "Go to My Dashboard" button
- `NotFound.jsx` — 404 page with role-aware home button

### Redux Auth State
```js
{
  isAuthenticated: boolean,
  user: { id, name, email, role, profileImage, tutorProfile, ... } | null,
  token: string | null,
  loading: boolean
}
```

---

## Completed Features

### Authentication
- [x] Email/password signup with OTP email verification
- [x] Login with role selection (student/tutor)
- [x] Admin login (separate page)
- [x] Google OAuth login
- [x] Forgot password / reset password via OTP
- [x] JWT-based session management
- [x] Auto-logout on token expiry or password change

### Admin Panel
- [x] Admin profile management (name, phone, profile image)
- [x] Admin password change via OTP
- [x] Tutor management (list, search, filter, paginate)
- [x] Student management (list, search, filter, paginate)
- [x] Block / unblock users
- [x] Tutor approval (approve / reject with 3-state enum)
- [x] Tutor detail modal with professional UI

### Tutor Panel
- [x] Tutor profile management (name, phone, bio, subject, profile image)
- [x] Email change via OTP (sent to new email)
- [x] Password change via OTP

### Student Panel
- [x] Student profile management (name, phone, profile image)
- [x] Password change via OTP

### Platform
- [x] Role-based routing with 403 Unauthorized page
- [x] 404 Not Found page with role-aware redirect
- [x] Responsive layouts (mobile-first)
- [x] Toast notifications throughout

---

## Bugs Found and Fixed

### 1. Tutor/Student controllers had business logic (no service pattern)
**Problem:** `tutorController.js` and `userController.js` contained direct DB queries, OTP calls, and file operations — violating the service pattern used by `adminController.js`.  
**Fix:** Extracted all logic into `tutorService.js` and `userService.js`. Controllers now only call service methods and send HTTP responses.

### 2. Controllers used try/catch instead of asyncHandler
**Problem:** After the service refactor, tutor and user controllers still used manual `try/catch` blocks while admin and auth controllers used `asyncHandler`.  
**Fix:** Replaced all `try/catch` in controllers with `asyncHandler` wrapper, matching the admin pattern.

### 3. Redundant try/catch in authController forgotPassword
**Problem:** Inside `forgotPassword` (already wrapped by `asyncHandler`), there was a nested `try/catch` that caught the email error and re-threw a vague `'Failed to send reset OTP'` — losing the real error detail.  
**Fix:** Removed the inner `try/catch`. `asyncHandler` handles it directly.

### 4. USER_STATUS had duplicate key
**Problem:** `constants.js` had `APPROVAL: 'pending'` which duplicated `PENDING: 'pending'` in `USER_STATUS`.  
**Fix:** Removed the duplicate `APPROVAL` key.

### 5. Tutor approval used boolean instead of enum
**Problem:** `tutorProfile.isApproved` was a `Boolean` — couldn't represent `pending`, `approved`, or `rejected` states.  
**Fix:** Replaced with `approvalStatus: enum['pending', 'approved', 'rejected']` using a new `TUTOR_APPROVAL_STATUS` constant. Added `approveTutor` and `rejectTutor` to `adminService` and `adminController`.

### 6. Typo: TUTOR_APPROVAL_STATUS.PENDIN
**Problem:** In `User.js`, the default value was `TUTOR_APPROVAL_STATUS.PENDIN` (missing G) — would silently set `undefined` as default.  
**Fix:** Corrected to `TUTOR_APPROVAL_STATUS.PENDING`.

### 7. adminService.approveTutor used USER.ROLES instead of USER_ROLES
**Problem:** `USER.ROLES.TUTOR` — `USER` is not defined, `USER_ROLES` is the correct import.  
**Fix:** Changed to `USER_ROLES.TUTOR`.

### 8. adminRoutes imported approveTutor/rejectTutor from service, not controller
**Problem:** Routes were calling service functions directly, bypassing `asyncHandler`. Any thrown error would crash the server instead of being handled by `errorMiddleware`.  
**Fix:** Moved `approveTutor` and `rejectTutor` imports to `adminController`.

### 9. Loose equality in roleMiddleware
**Problem:** `approvalStatus != TUTOR_APPROVAL_STATUS.APPROVED` used `!=` instead of `!==`.  
**Fix:** Changed to strict `!==`.

### 10. RoleRoute silently redirected wrong-role users
**Problem:** A tutor visiting `/admin/dashboard` was silently redirected to their own dashboard with no explanation — confusing UX.  
**Fix:** `RoleRoute` now redirects to `/unauthorized` (403 page) which shows "Access Denied" and a "Go to My Dashboard" button.

### 11. NotFound "Go Back" used navigate(-1)
**Problem:** `navigate(-1)` on a 404 page could go nowhere (if user typed URL directly) or navigate out of the app.  
**Fix:** Replaced with role-aware redirect — logged-in users go to their dashboard, guests go to `/`.

### 12. Tutor detail modal approval section was outside the modal div
**Problem:** The approval row (label + buttons) was placed outside the modal's content wrapper, causing it to render below the modal card with no padding or styling.  
**Fix:** Moved into a dedicated footer section inside the modal with proper padding, background, and full-width solid buttons.

### 13. API response data access was one level too shallow
**Problem:** After block/unblock/approve/reject, the code did `res.data` to get the user object. But the controller wraps responses as `{ success, data }`, so the actual object is at `res.data.data`.  
**Fix:** Updated all response handlers to use `res.data.data`.

---

## What's Next

### Course Management (Priority)
- [ ] Course model (title, description, price, category, thumbnail, lessons, status)
- [ ] Lesson model (title, video URL, duration, order)
- [ ] Course CRUD for tutors (create, edit, publish, archive)
- [ ] Course listing for students (browse, search, filter by category)
- [ ] Course detail page

### Enrollment & Progress
- [ ] Student enrollment (free / paid via Razorpay)
- [ ] Progress tracking per lesson
- [ ] Course completion certificate

### Categories
- [ ] Category model
- [ ] Admin: create/manage categories
- [ ] Course filtering by category

### Payments
- [ ] Razorpay integration for paid courses
- [ ] Order model
- [ ] Payment history for students and tutors

### Real-time Features
- [ ] Socket.io for live notifications
- [ ] Tutor gets notified when a student enrolls

### Dashboard Data
- [ ] Admin dashboard: total users, revenue, course stats
- [ ] Tutor dashboard: enrolled students, course performance
- [ ] Student dashboard: enrolled courses, progress

### Production Readiness
- [ ] Migrate file uploads to Cloudinary or AWS S3
- [ ] Add refresh token mechanism
- [ ] Rate limiting tuning
- [ ] Environment-based logging
- [ ] Docker setup

---

## Known Limitations (Current State)

- Profile images stored locally — will not persist on cloud deployments without migration
- No email templates for tutor approval notification (tutor is not emailed when approved/rejected)
- Admin dashboard page exists but has no data yet (placeholder)
- Google OAuth callback needs `CLIENT_URL` set correctly for production
- No pagination on student profile enrolled courses list (not built yet)
