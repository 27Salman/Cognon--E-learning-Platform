# Dual Role Implementation Guide

## Overview
Users can now register and login with the SAME email as both Student AND Tutor. Each role is treated as a separate account.

## What Changed

### Backend Changes

1. **User Model** (`backend/src/models/User.js`)
   - Removed `unique: true` from email field
   - Added compound unique index: `{ email: 1, role: 1 }`
   - Same email can exist multiple times with different roles

2. **Auth Service** (`backend/src/services/authService.js`)
   - `registerUser()`: Now checks email+role combination
   - `loginUser()`: Now requires role parameter and checks email+role

3. **Auth Controller** (`backend/src/controllers/authController.js`)
   - `login`: Now requires `role` in request body
   - Returns error if role not provided

4. **Google OAuth** (`backend/src/controllers/googleAuthController.js`)
   - Checks email+role combination
   - Creates separate accounts for same email with different roles

### Frontend Changes

1. **Login Page** (`frontend/src/pages/auth/Login.jsx`)
   - Sends `activeRole` (student/tutor) with login request
   - User is logged into the account matching email+role
   - Single "Login successful!" toast (no duplicates)

2. **Signup Page** (`frontend/src/pages/auth/Signup.jsx`)
   - Sends selected role with registration
   - Google signup also passes role parameter

3. **Logout Toast**
   - Already implemented in all dashboards
   - Shows "Logged out successfully" message

## Migration Required

### IMPORTANT: Run Migration Script

Before using the new system, you MUST run the migration script to update database indexes:

```bash
node backend/scripts/migrateUserIndex.js
```

This script will:
1. Drop the old unique index on `email`
2. Drop the old unique index on `phone` (if exists)
3. Create new compound unique index on `(email, role)`

## How It Works

### Registration Flow

1. **Student Registration**
   ```
   Email: user@example.com
   Role: student
   → Creates account: user@example.com (student)
   ```

2. **Tutor Registration (Same Email)**
   ```
   Email: user@example.com
   Role: tutor
   → Creates account: user@example.com (tutor)
   ```

Both accounts exist independently!

### Login Flow

1. **Student Login**
   ```
   User selects: STUDENT tab
   Email: user@example.com
   Password: ****
   Role sent: student
   → Logs into student account
   → Redirects to Student Dashboard
   ```

2. **Tutor Login**
   ```
   User selects: TUTOR tab
   Email: user@example.com
   Password: ****
   Role sent: tutor
   → Logs into tutor account
   → Redirects to Tutor Dashboard
   ```

### Google OAuth Flow

1. **Google Student Registration**
   ```
   Click "Continue with Google" on STUDENT tab
   → Creates: user@gmail.com (student)
   → Redirects to Student Dashboard
   ```

2. **Google Tutor Registration (Same Email)**
   ```
   Logout
   Click "Continue with Google" on TUTOR tab
   → Creates: user@gmail.com (tutor)
   → Redirects to Tutor Dashboard
   ```

## Database Structure

### Before (Old System)
```
users collection:
{
  email: "user@example.com" (unique),
  role: "student",
  ...
}
```
❌ Cannot create another user with same email

### After (New System)
```
users collection:
{
  email: "user@example.com",
  role: "student",
  ...
},
{
  email: "user@example.com",
  role: "tutor",
  ...
}
```
✅ Same email, different roles = separate accounts

## Testing Checklist

### Manual Registration
- [ ] Register as Student with email: test@example.com
- [ ] Verify OTP and login as Student
- [ ] Logout
- [ ] Register as Tutor with SAME email: test@example.com
- [ ] Verify OTP and login as Tutor
- [ ] Both accounts should exist independently

### Login with Role Selection
- [ ] Login as Student (select STUDENT tab)
- [ ] Should redirect to Student Dashboard
- [ ] Logout (should show "Logged out successfully")
- [ ] Login as Tutor (select TUTOR tab) with same email
- [ ] Should redirect to Tutor Dashboard
- [ ] Logout (should show "Logged out successfully")

### Google OAuth
- [ ] Click "Continue with Google" on STUDENT tab
- [ ] Should create student account
- [ ] Logout
- [ ] Click "Continue with Google" on TUTOR tab (same Google account)
- [ ] Should create tutor account
- [ ] Both accounts should exist

### Toast Messages
- [ ] Login shows ONE "Login successful!" toast (not two)
- [ ] Logout shows "Logged out successfully" toast
- [ ] No duplicate toasts

### Error Handling
- [ ] Try to register same email+role twice → Should show error
- [ ] Try to login with wrong role → Should show "No {role} account found"
- [ ] Try to login without selecting role → Should show error

## API Changes

### Login Endpoint
**Before:**
```json
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

**After:**
```json
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123",
  "role": "student"  // ← NEW: Required field
}
```

### Registration Endpoint
No changes - already had role field

### Google OAuth
**Before:**
```
GET /api/auth/google?role=student
```

**After:**
```
GET /api/auth/google?role=student
```
Now checks email+role combination instead of just email

## Important Notes

1. **Phone Numbers**: Each account (even with same email) needs a unique phone number. For Google OAuth, we generate random valid phone numbers.

2. **Passwords**: Student and Tutor accounts can have different passwords (they're separate accounts).

3. **Data Isolation**: Student profile data and Tutor profile data are completely separate.

4. **Admin Approval**: Tutor accounts still require admin approval before they can create courses.

5. **Upgrade Feature**: The "Upgrade to Tutor" feature is now less relevant since users can just register a separate tutor account.

## Troubleshooting

### Error: "E11000 duplicate key error"
- Run the migration script: `node backend/scripts/migrateUserIndex.js`
- This drops old indexes and creates new compound index

### Error: "Role is required"
- Frontend must send `role` field in login request
- Check that `activeRole` is being passed in Login.jsx

### User redirected to wrong dashboard
- Backend returns user with their actual role
- Frontend navigates based on `user.role` from response
- Check that login is sending correct role

### Duplicate "Login successful!" toast
- Check that toast is only shown in ONE place
- Login.jsx: Toast in useEffect with hasShownToast ref
- GoogleAuthSuccess.jsx: Toast before navigation with setTimeout

## Rollback (If Needed)

If you need to revert to the old system:

1. Restore User model:
   ```javascript
   email: {
     type: String,
     required: true,
     unique: true,  // ← Add back
     ...
   }
   ```

2. Remove compound index:
   ```javascript
   // Remove this line
   userSchema.index({ email: 1, role: 1 }, { unique: true });
   ```

3. Revert authService.loginUser() to not require role parameter

4. Revert frontend Login.jsx to not send role

5. Run:
   ```bash
   # Drop compound index
   mongo
   use cognon
   db.users.dropIndex("email_1_role_1")
   
   # Recreate simple email index
   db.users.createIndex({ email: 1 }, { unique: true })
   ```

## Summary

✅ Same email can register as both Student and Tutor
✅ Login requires role selection (Student/Tutor tab)
✅ Each role is a separate account with separate data
✅ Google OAuth works for both roles
✅ Single login success toast (no duplicates)
✅ Logout shows success toast
✅ Redirects to correct dashboard based on role

