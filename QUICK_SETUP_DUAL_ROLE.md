# Quick Setup: Dual Role System

## ⚠️ IMPORTANT: Run This First!

Before testing, you MUST run the database migration:

```bash
node backend/scripts/migrateUserIndex.js
```

This updates the database indexes to allow same email with different roles.

## What Was Fixed

### 1. ✅ Same Email, Different Roles
- Users can now register as BOTH student and tutor with the same email
- Each role is a separate account

### 2. ✅ Role-Based Login
- Login now checks email + selected role (Student/Tutor tab)
- Redirects to correct dashboard based on role

### 3. ✅ Single Login Toast
- Fixed duplicate "Login successful!" messages
- Now shows exactly ONE toast

### 4. ✅ Logout Toast
- Shows "Logged out successfully" message
- Already implemented in all dashboards

### 5. ✅ Google OAuth Phone Numbers
- Google users no longer get random phone numbers
- Phone is set to `null` for Google users (can be added later)
- Manual registration still requires phone number

## How to Test

### Test 1: Register Same Email as Both Roles
```
1. Register as Student: test@example.com
2. Verify OTP and login
3. Logout
4. Register as Tutor: test@example.com (same email!)
5. Verify OTP and login
6. Both accounts should work independently
```

### Test 2: Login with Role Selection
```
1. Go to Login page
2. Select STUDENT tab
3. Login with: test@example.com
4. Should go to Student Dashboard
5. Logout
6. Select TUTOR tab
7. Login with: test@example.com (same email)
8. Should go to Tutor Dashboard
```

### Test 3: Google OAuth
```
1. Click "Continue with Google" on STUDENT tab
2. Should create student account
3. Logout
4. Click "Continue with Google" on TUTOR tab
5. Should create tutor account (same Google email)
6. Both accounts work separately
```

## Files Modified

### Backend
- `backend/src/models/User.js` - Compound unique index
- `backend/src/services/authService.js` - Check email+role
- `backend/src/controllers/authController.js` - Require role in login
- `backend/src/controllers/googleAuthController.js` - Check email+role
- `backend/scripts/migrateUserIndex.js` - NEW migration script

### Frontend
- `frontend/src/pages/auth/Login.jsx` - Send role, single toast
- `frontend/src/pages/auth/GoogleAuthSuccess.jsx` - Single toast with delay

## Quick Commands

```bash
# 1. Run migration (REQUIRED!)
node backend/scripts/migrateUserIndex.js

# 2. Restart backend
cd backend
npm run dev

# 3. Restart frontend (in another terminal)
cd frontend
npm run dev

# 4. Test the system
# Open http://localhost:3000
```

## Expected Behavior

| Action | Result |
|--------|--------|
| Register as Student | Creates student account |
| Register as Tutor (same email) | Creates separate tutor account |
| Login as Student | Goes to Student Dashboard |
| Login as Tutor (same email) | Goes to Tutor Dashboard |
| Google signup as Student | Creates student account |
| Google signup as Tutor (same email) | Creates separate tutor account |
| Logout | Shows "Logged out successfully" |
| Login (any method) | Shows ONE "Login successful!" toast |

## Troubleshooting

**Error: "E11000 duplicate key error"**
→ Run: `node backend/scripts/migrateUserIndex.js`

**Still seeing duplicate toasts**
→ Clear browser cache and restart frontend

**Wrong dashboard after login**
→ Make sure you selected the correct role tab before logging in

**"Role is required" error**
→ Backend is working correctly, make sure frontend is updated

## Need Help?

Check these files for details:
- `DUAL_ROLE_IMPLEMENTATION.md` - Complete technical documentation
- `backend/scripts/migrateUserIndex.js` - Migration script with comments

