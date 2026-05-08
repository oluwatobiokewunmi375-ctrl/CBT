# 🔒 QUICK REFERENCE - PROJECT PROTECTION SYSTEM

**Project Status:** SEALED & LOCKED  
**Date:** 2026-05-08  
**Level:** MAXIMUM PROTECTION  

---

## 📖 QUICK START FOR SAFE DEVELOPMENT

### Before You Code
```bash
npm run secure              # Check project status
```

### Make a Change
```bash
git checkout -b feature/name     # Create branch
# ... make your changes ...
npm run dev                       # Test
npm run verify                    # Verify files intact
git add .
git commit -m "Feature: description"
```

### After Changes
```bash
npm run check                     # Full check
npm run lock                      # Create checkpoint
```

---

## 🚨 EMERGENCY COMMANDS

**Everything broken?**
```bash
git reset --hard HEAD
npm install
npm run dev
```

**Files missing?**
```bash
git status              # What's missing
git checkout .          # Restore
npm install             # Restore node_modules
npm run verify          # Confirm
```

**Need to see what changed?**
```bash
git status              # Current changes
git diff                # Detailed diff
git log --oneline       # History
```

---

## ✅ PROTECTION FILES INSTALLED

| File | Purpose | Check |
|------|---------|-------|
| `PROJECT_LOCK.md` | Lock documentation | `cat PROJECT_LOCK.md` |
| `SECURITY.md` | Security policy | `cat SECURITY.md` |
| `.structure-snapshot` | Current structure | `cat .structure-snapshot` |
| `scripts/verify-integrity.js` | Verification script | `npm run verify` |
| `package.json` (updated) | New safety scripts | `npm run verify\|check\|lock` |
| `.git/` | Version control | `git log -1` |

---

## 📊 KEY COMMANDS

| Command | What It Does |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run verify` | Check critical files |
| `npm run check` | Full project check |
| `npm run secure` | Status + verify |
| `npm run lock` | Create checkpoint |
| `git status` | Show changes |
| `git diff` | Show what changed |
| `git commit` | Save changes |

---

## 🔐 THE RULES

### ✅ ALWAYS DO
1. Run `npm run verify` before committing
2. Create branches for features
3. Test in dev before committing
4. Use clear commit messages
5. Make additive changes only

### ❌ NEVER DO
1. Delete critical files
2. Move core directories
3. Manually edit migrations
4. Force-push to main
5. Delete .git/ or .next/

---

## 📁 CRITICAL FILES (PROTECTED)

```
❌ DO NOT DELETE:
  src/app/page.tsx
  src/server/auth/jwt.ts
  prisma/schema.prisma
  .env.local
  next.config.js
  tsconfig.json
  package.json
  .git/
```

---

## 🆘 TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| Files missing | `git checkout .` |
| node_modules broken | `npm install` |
| Code won't compile | `npm run type-check` |
| Database issue | `npx prisma db push` |
| Everything broken | `git reset --hard HEAD` |

---

## 📞 SUPPORT DOCS

Read these for more details:
- **PROJECT_LOCK.md** - Complete lock documentation
- **SECURITY.md** - Full security policy
- **.structure-snapshot** - Current file structure
- **README.md** - Project overview

---

## 🟢 PROJECT STATUS

```
✅ Locked:      YES
✅ Protected:   YES
✅ Backed up:   YES
✅ Verified:    YES
✅ Git history: YES
✅ Dev server:  RUNNING
```

**Ready for development with full protection!**

---

*Run `npm run verify` to confirm everything is in place.*
