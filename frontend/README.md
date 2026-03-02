# Cognon E-Learning Platform - Frontend

React-based frontend for the Cognon e-learning platform with role-based authentication and dashboards.

## 🚀 Tech Stack

- **React 18.3** - UI Library
- **Redux Toolkit** - State Management
- **React Router 6** - Routing
- **Tailwind CSS 3** - Styling
- **Axios** - HTTP Client
- **Vite** - Build Tool
- **React Hot Toast** - Notifications
- **React Icons** - Icon Library

---

## 📁 Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── api/                    # API service layer
│   │   ├── axios.js           # Axios instance with interceptors
│   │   └── authAPI.js         # Authentication API calls
│   ├── components/
│   │   ├── common/            # Reusable components
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   └── Loader.jsx
│   │   └── auth/              # Auth-specific components
│   ├── pages/                 # Page components
│   │   ├── auth/
│   │   │   ├── Login.jsx              # Student/Tutor login
│   │   │   ├── Signup.jsx             # Student/Tutor signup
│   │   │   ├── AdminLogin.jsx         # Admin login (separate)
│   │   │   ├── ForgotPassword.jsx     # Password reset
│   │   │   └── AdminForgotPassword.jsx
│   │   ├── student/
│   │   │   └── StudentDashboard.jsx
│   │   ├── tutor/
│   │   │   └── TutorDashboard.jsx
│   │   ├── admin/
│   │   │   └── AdminDashboard.jsx
│   │   └── Home.jsx
│   ├── routes/
│   │   ├── ProtectedRoute.jsx  # Auth guard
│   │   └── RoleRoute.jsx       # Role-based guard
│   ├── store/                  # Redux store
│   │   ├── store.js           # Store configuration
│   │   └── slices/
│   │       └── authSlice.js   # Auth state management
│   ├── utils/
│   │   ├── constants.js       # App constants
│   │   └── helpers.js         # Helper functions
│   ├── App.jsx                # Main app component
│   ├── index.css              # Global styles
│   └── main.jsx               # Entry point
├── .env
├── .gitignore
├── package.json
├── tailwind.config.js
├── vite.config.js
└── README.md
```

---

## 🛠️ Setup Instructions

### 1. Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Backend server running on `http://localhost:5000`

### 2. Installation

```bash
# Navigate to frontend directory
cd cognon-frontend

# Install dependencies
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Cognon
```

### 4. Run Development Server

```bash
npm run dev
```

Frontend will run on: **http://localhost:3000**

### 5. Build for Production

```bash
npm run build
```

Production files will be in the `dist/` directory.

---

## 🔐 Authentication Flow

### User Types

1. **Student** - Can enroll in courses, track progress
2. **Tutor** - Can create courses, manage lessons
3. **Admin** - Full platform management access

### Login Routes

```
/login              → Student/Tutor login (with role tabs)
/signup             → Student/Tutor signup (with role tabs)
/admin/login        → Admin-only login (hidden URL)
/forgot-password    → Student/Tutor password reset
/admin/forgot-password → Admin password reset
```

### Protected Routes

```
Student:
- /student/dashboard
- /student/courses
- /student/profile

Tutor:
- /tutor/dashboard
- /tutor/courses
- /tutor/profile
- /tutor/revenues

Admin:
- /admin/dashboard
- /admin/users
- /admin/courses
- /admin/categories
- /admin/tutors
```

---

## 🎨 Design System

### Colors (Tailwind)

```javascript
Primary Purple: #8b5cf6 (primary-500)
Accent Red: #FF0000
Accent Pink: #E6B3FF
```

### Components

All reusable components are in `src/components/common/`:

- **Button** - `<Button variant="primary" size="md" fullWidth />`
- **Input** - `<Input label="Email" type="email" error={error} />`
- **Loader** - `<Loader size="lg" text="Loading..." />`

---

## 📡 API Integration

### Axios Instance

Configured with:
- Base URL from environment
- Request interceptor (auto-attach JWT token)
- Response interceptor (handle 401/403 errors)

### API Services

```javascript
// authAPI.js
signup(userData)      // Register student/tutor
login(credentials)    // Login all roles
logout()             // Logout
getCurrentUser()     // Get current user data
```

---

## 🗂️ State Management (Redux)

### Auth Slice

```javascript
// State
{
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null
}

// Actions
signupUser()        // Async thunk for signup
loginUser()         // Async thunk for login
logoutUser()        // Async thunk for logout
fetchCurrentUser()  // Async thunk for fetching user
clearError()        // Clear error state
```

---

## 🛡️ Route Protection

### ProtectedRoute

Protects routes from unauthenticated access:

```jsx
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
```

### RoleRoute

Restricts access based on user role:

```jsx
<RoleRoute allowedRoles={[ROLES.STUDENT]}>
  <StudentDashboard />
</RoleRoute>
```

---

## 🧪 Testing Workflow

### Test Authentication

1. **Signup as Student**
   - Go to `/signup`
   - Select "Student" tab
   - Fill form and submit
   - Should redirect to `/student/dashboard`

2. **Signup as Tutor**
   - Go to `/signup`
   - Select "Tutor" tab
   - Fill form and submit
   - Should redirect to `/tutor/dashboard`

3. **Admin Login**
   - Go to `/admin/login` (manually in URL)
   - Login with admin credentials
   - Should redirect to `/admin/dashboard`

4. **Protected Routes**
   - Try accessing `/student/dashboard` without login
   - Should redirect to `/login`

5. **Role Restriction**
   - Login as Student
   - Try accessing `/tutor/dashboard`
   - Should redirect to `/student/dashboard`

---

## 📦 Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

---

## 🔑 Key Features

✅ Role-based authentication (Student, Tutor, Admin)
✅ Protected routes with auth guards
✅ Separate admin login portal
✅ JWT token management
✅ Auto token refresh on page reload
✅ Form validation
✅ Error handling
✅ Toast notifications
✅ Responsive design
✅ Loading states
✅ Logout functionality

---

## 🚧 Coming Soon

- Course browsing and enrollment
- User profile management
- Tutor course creation
- Admin panel features
- File upload
- Real-time notifications
- Dark mode

---

## 🐛 Troubleshooting

### CORS Errors

Make sure backend has CORS enabled for `http://localhost:3000`

### 401 Unauthorized

- Check if backend is running
- Verify token in localStorage
- Check API endpoint URLs

### Routing Issues

- Ensure `BrowserRouter` is wrapping `App`
- Check route paths in `constants.js`

---

## 📝 Development Guidelines

### Code Style

- Use functional components with hooks
- Follow component naming: `PascalCase`
- Use destructuring for props
- Add JSDoc comments for functions
- Keep components under 200 lines

### File Organization

- One component per file
- Group related files in folders
- Use `index.js` for barrel exports
- Keep utilities separate from components

### State Management

- Use Redux for global state
- Use local state for UI-only state
- Dispatch actions from components
- Handle async in thunks

---

## 📞 Support

For issues or questions, refer to:
- Backend API documentation
- Project knowledge base
- Development team

---

**Built with ❤️ for Cognon E-Learning Platform**
