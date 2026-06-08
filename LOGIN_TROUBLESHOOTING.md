# LOGIN TROUBLESHOOTING GUIDE

## Overview
This guide helps troubleshoot login failures in the CBT platform. Follow the steps below to identify and resolve issues.

---

## ⚡ QUICK DIAGNOSIS

Run this command to get a complete status report:
```bash
npm run diagnose:login
```

This will check:
- ✅ Environment variables
- ✅ Database connection
- ✅ Seeded test users
- ✅ Schools and test data
- ✅ Common configuration issues

---

## 🚨 COMMON ERRORS & FIXES

### 1. "Invalid password for this student ID" (Status 401)

**What it means**: Student ID exists, but password is wrong.

**Fixes**:
1. Check the password - it's case-sensitive
2. For student login without password, the system defaults to `stud123`
3. Verify the account was properly seeded:
   ```bash
   npm run diagnose:login
   ```

---

### 2. "Student ID not found in system" (Status 401)

**What it means**: The student ID doesn't exist in the database.

**Fixes**:
1. Check the student ID format - should match seeded accounts exactly
2. Verify accounts were seeded:
   ```bash
   npm run seed:mock
   ```
3. Check which accounts exist:
   ```bash
   npm run diagnose:login
   ```

---

### 3. "Email address not found in system" (Status 401)

**What it means**: The email address doesn't have a registered account.

**Fixes**:
1. Check the email spelling - it's case-insensitive but must match exactly
2. For dashboard access, only admins and teachers can login (not students)
3. Students must use "Student Exam" mode with their student ID
4. Seed test accounts if needed:
   ```bash
   npm run seed:mock
   ```

---

### 4. "Invalid password for this email address" (Status 401)

**What it means**: Email exists, but password is incorrect.

**Fixes**:
1. Verify the password is correct (case-sensitive)
2. Check if the account is actually a student - students can't use dashboard access
3. Reset password by asking the school admin (no self-service password reset yet)

---

### 5. "Email not verified. Please verify your account before signing in." (Status 403)

**What it means**: Email verification is required, but the account isn't verified.

**Conditions**:
- Only appears if `REQUIRE_EMAIL_VERIFICATION=true` in environment
- Email verification flow not yet implemented

**Fixes**:
1. **Temporary**: Remove `REQUIRE_EMAIL_VERIFICATION` from .env or set to `false`
2. **Permanent**: Contact admin to verify your email in the database:
   ```sql
   UPDATE "User" SET "emailVerified"=true WHERE "email"='your@email.com';
   ```

---

### 6. "Environment validation error: JWT_SECRET must be at least 32 characters"

**What it means**: JWT_SECRET is missing or too short.

**Fixes**:
1. Add JWT_SECRET to .env.local with minimum 32 characters:
   ```bash
   # Generate a secure secret:
   openssl rand -base64 32
   
   # Add to .env.local:
   JWT_SECRET=<your-generated-secret>
   ```
2. Restart the dev server:
   ```bash
   npm run dev
   ```

---

### 7. "Database connection refused"

**What it means**: DATABASE_URL is missing, invalid, or the database is down.

**Fixes**:
1. **Check DATABASE_URL is set**:
   ```bash
   echo $DATABASE_URL  # Should print PostgreSQL connection string
   ```

2. **Verify PostgreSQL is running**:
   ```bash
   # For local PostgreSQL:
   psql -U postgres -d cbt_database -c "SELECT 1"
   
   # For Supabase:
   curl https://your-project.supabase.co/rest/v1/ -H "apikey: your-key"
   ```

3. **Check connection string format**:
   ```
   postgresql://username:password@host:port/database
   # or for Supabase:
   postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres
   ```

4. **Add to .env.local and restart**:
   ```bash
   DATABASE_URL="postgresql://user:pass@localhost:5432/cbt"
   npm run dev
   ```

---

### 8. "Dashboard login is only available for admins and teachers"

**What it means**: Student tried to use Dashboard Access instead of Student Exam mode.

**Fixes**:
1. **For Students**: Use "Student Exam" mode instead
   - Click "Student Exam" button
   - Enter your Student ID
   - Enter your password (or leave blank for default "stud123")
   - Click "Enter Exam"

2. **For Dashboard**: Only for admin/teacher/super-admin
   - Use "Dashboard Access" mode
   - Enter email and password

---

### 9. "An error occurred. Please try again." (Generic error)

**What it means**: Something unexpected failed. Check browser console and server logs.

**Fixes**:
1. **Check browser console** (F12):
   - Look for JavaScript errors
   - Check network tab for failed requests
   - Note any error messages

2. **Check server logs**:
   ```bash
   # Terminal where dev server is running
   # Look for error messages in the output
   ```

3. **Enable debug logging** temporarily:
   - Add console.log statements to trace the issue
   - Check /api response with curl:
     ```bash
     curl -X POST http://localhost:3000/api/auth/login \
       -H "Content-Type: application/json" \
       -d '{"email":"test@example.com","password":"password123"}'
     ```

---

## 🔍 STEP-BY-STEP DEBUG

### Step 1: Verify Environment
```bash
npm run diagnose:login
```

Check:
- ✅ NODE_ENV=development (not "production")
- ✅ JWT_SECRET is set and >= 32 chars
- ✅ DATABASE_URL is set and valid
- ✅ Database connection is OK
- ✅ Users exist in database
- ✅ No users require email verification

### Step 2: Seed Test Data
```bash
npm run seed:mock
```

Expected output:
```
✅ Created SUPER_ADMIN: adebayosamuel015@gmail.com
✅ Created school: laterna
✅ Created SCHOOL_ADMIN: samuela@laternabooks.ng
✅ Created STUDENT user: adebayosulaimansamuel@gmail.com
```

### Step 3: Verify Dev Server
```bash
npm run dev
```

Expected output:
```
  ▲ Next.js 16.2.6 (webpack)
  - Local:        http://localhost:3000
  - Environments: .env.local, .env

✓ Ready in 3.2s
```

### Step 4: Test Login Manually
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "adebayosamuel015@gmail.com",
    "password": "Hibilero@2104"
  }'
```

Expected output:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "adebayosamuel015@gmail.com",
    "role": "SUPER_ADMIN",
    ...
  }
}
```

### Step 5: Test in Browser
1. Open http://localhost:3000/login
2. Click "Dashboard Access"
3. Enter: `adebayosamuel015@gmail.com`
4. Password: `Hibilero@2104`
5. Click "Go to Dashboard"

Expected: Redirected to /super-admin/dashboard

### Step 6: Check Token & Cookie
Open browser DevTools (F12):
1. Go to "Application" tab
2. Check "Cookies" → http://localhost:3000
3. Look for "token" cookie
4. Should be httpOnly (not visible to JavaScript)

---

## 📋 REFERENCE DATA

### Seeded Test Accounts

#### Super Admin
- **Email**: adebayosamuel015@gmail.com
- **Password**: Hibilero@2104
- **Role**: SUPER_ADMIN
- **Access**: Dashboard → /super-admin/dashboard

#### School Admin  
- **Email**: samuela@laternabooks.ng
- **Password**: Laterna@1234
- **Role**: SCHOOL_ADMIN
- **Access**: Dashboard → /admin/dashboard

#### Student
- **Student ID**: STU-lvl-0001
- **Email**: adebayosulaimansamuel@gmail.com
- **Password**: Student@1234 (or leave blank for "stud123")
- **Role**: STUDENT
- **Access**: Student Exam → /exam-list

---

## 🛠️ ADVANCED TROUBLESHOOTING

### Checking Database Directly

```bash
# Connect to your database
psql $DATABASE_URL

# Check users
SELECT email, role, "emailVerified" FROM "User";

# Check students
SELECT "studentNo", "userId" FROM "Student";

# Check schools
SELECT "shortCode", name FROM "School";

# Verify specific user
SELECT * FROM "User" WHERE email = 'your@email.com';
```

### Resetting User Data (Development Only)

⚠️ **WARNING**: This deletes data! Only use in development.

```bash
# Delete all users and start fresh
npm run seed:mock  # Will recreate seeded accounts

# Or manually in database:
DELETE FROM "User" WHERE email LIKE 'test%';
```

### Checking JWT Token

Decode a token at [jwt.io](https://jwt.io):
1. Copy the token from login response
2. Paste at jwt.io
3. Verify payload contains: id, email, role

### Rate Limiting Issues

If you see "Too many login attempts":
1. Wait 60 seconds (default rate limit window)
2. Or disable rate limiting in development:
   ```bash
   DISABLE_RATE_LIMIT=true npm run dev
   ```

---

## 📞 WHEN TO CONTACT SUPPORT

Contact your system administrator if:
- Database connection fails even with correct credentials
- Students can't be created/seeded
- JWT_SECRET requirements can't be met
- Email verification is stuck
- Account needs to be unlocked/reset

---

## ✅ VERIFICATION CHECKLIST

Before reporting an issue, verify:
- [ ] NODE_ENV is "development" (not "production")
- [ ] JWT_SECRET is set and >= 32 chars
- [ ] DATABASE_URL is valid and database is accessible
- [ ] Test accounts seeded: `npm run seed:mock`
- [ ] Dev server running: `npm run dev`
- [ ] No rate limiting triggered
- [ ] Credentials match seeded accounts exactly (case-sensitive)
- [ ] Using correct login mode:
  - [ ] Dashboard for admin/teacher/super-admin
  - [ ] Student Exam for students
- [ ] REQUIRE_EMAIL_VERIFICATION not blocking (set to false)
- [ ] Browser cookies enabled
- [ ] Not using incognito/private mode (clears cookies)

---

## 📚 RELATED DOCS

- [Authentication Flow](./AUTH_DOCUMENTATION.md)
- [Environment Configuration](./PRODUCTION_ENV_REFERENCE.md)
- [Database Setup](./DATABASE_SETUP.md)
- [API Documentation](./API_DOCUMENTATION.md)
