# 🔐 SECURITY & PROTECTION POLICY

**Status:** LOCKED FOR PRODUCTION  
**Last Updated:** 2026-05-08  
**Protection Level:** MAXIMUM  

---

## 🛡️ WHAT THIS MEANS

This project is now in a **SEALED STATE**. All critical files and paths are protected. Any changes should be:
- **Additive** (adding new features, not removing code)
- **Tested** before committing
- **Documented** in commit messages
- **Verified** with `npm run verify`

---

## ⚠️ CRITICAL DO NOT'S

```
❌ DO NOT:
  - Delete src/ directory or subdirectories
  - Remove prisma/ or database files
  - Delete .env.local without backup
  - Move or rename critical files
  - Delete git history (.git/)
  - Manually edit migration files
  - Force-push to main branch
  - Remove dependencies without testing
```

---

## ✅ SAFE OPERATIONS

```
✅ DO:
  - Add new components in src/components/
  - Add new hooks in src/hooks/
  - Add new utilities in src/utils/
  - Create new routes in src/app/
  - Add new environment variables
  - Create database migrations with prisma
  - Use git branches for features
  - Commit changes with clear messages
  - Run npm run verify before commit
  - Test thoroughly before pushing
```

---

## 🔒 PROTECTION SYSTEM

### File Monitoring
- All critical files are tracked in git
- Changes are automatically logged
- Integrity checks run on demand

### Backup System
- Automatic backups in `.backups/` directory
- Git history preserved (DO NOT delete .git/)
- Snapshots created before major changes

### Verification
Run anytime:
```bash
npm run verify      # Check file integrity
npm run check       # Full project check
npm run secure      # Status + verify
```

---

## 📋 CHANGE REQUEST WORKFLOW

When you need to make changes:

1. **PLAN** - What exactly are you changing?
   ```bash
   npm run secure
   ```

2. **BRANCH** - Create a feature branch
   ```bash
   git checkout -b feature/my-feature
   ```

3. **IMPLEMENT** - Add/modify code (don't delete)
   ```bash
   # Edit files, add new features
   ```

4. **TEST** - Run dev server
   ```bash
   npm run dev
   npm run check
   ```

5. **VERIFY** - Check integrity
   ```bash
   npm run verify
   git status
   git diff --stat
   ```

6. **COMMIT** - Save changes
   ```bash
   git add .
   git commit -m "Feature: description of changes"
   ```

7. **LOCK** - Checkpoint
   ```bash
   npm run lock
   ```

---

## 🚨 INCIDENT RESPONSE

### If files are missing:
```bash
git status
git log --oneline | head -10
git checkout .           # Restore from git
npm install              # Restore node_modules
```

### If database is corrupted:
```bash
npx prisma migrate status      # Check state
npx prisma db push             # Apply schema
npx prisma migrate resolve     # Fix issues
```

### If code won't compile:
```bash
npm run type-check
npm run lint
npm run build              # Test build
```

### PANIC MODE - Full reset:
```bash
git reset --hard HEAD
git clean -fd
npm install
npm run dev
```

---

## 📊 FILE PROTECTION LEVELS

### LEVEL 1 - CRITICAL (DO NOT TOUCH)
```
.git/
prisma/schema.prisma
prisma/migrations/
src/server/auth/
```

**Action if deleted:** Full project restore from git

---

### LEVEL 2 - IMPORTANT (BACKUP BEFORE CHANGE)
```
src/app/
src/server/api/
package.json
.env.local
```

**Action if modified:** Test thoroughly, may require database rebuild

---

### LEVEL 3 - STANDARD (TEST BEFORE MERGE)
```
src/components/
src/hooks/
src/utils/
src/lib/
```

**Action if modified:** Run full test suite, verify in dev

---

### LEVEL 4 - CONFIGURATION (CHANGE WITH CARE)
```
next.config.js
tsconfig.json
vercel.json
```

**Action if modified:** Rebuild and test entire project

---

## 🔐 VERIFICATION CHECKLIST

Before pushing to production, verify:

```
☐ npm run verify        → All critical files present
☐ npm run type-check    → No TypeScript errors
☐ npm run lint          → Code meets standards
☐ npm run build         → Production build succeeds
☐ npm run dev           → Dev server starts
☐ git status            → No uncommitted changes
☐ git log --oneline     → Commits are clear
☐ .env.local            → All vars configured
☐ DATABASE_URL          → Connection verified
☐ npm run test          → All tests pass
```

---

## 📞 WHEN IN DOUBT

```bash
# Show project status
npm run secure

# Verify everything
npm run check

# View recent changes
git log --oneline -10
git status

# See what would change
git diff
```

---

## 🔐 FINAL LOCK

This project is now under maximum protection. 

**Any changes must:**
1. ✅ Follow this policy
2. ✅ Pass verification
3. ✅ Be committed to git
4. ✅ Have clear commit messages

**The seal will be maintained.**

---

*Last verified: 2026-05-08*  
*Seal maintained by: CBT Security System*  
*Questions? See PROJECT_LOCK.md*
