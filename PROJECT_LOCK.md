# 🔒 CBT PROJECT LOCK FILE - DO NOT MODIFY CARELESSLY

**Project Status:** SEALED & LOCKED FOR PRODUCTION  
**Lock Date:** May 8, 2026  
**Last Stable Commit:** b8b676d  

---

## ⚠️ CRITICAL FILES - PROTECT FROM DELETION

These files are essential to project stability. **DO NOT DELETE OR MOVE:**

### Core Application Files
- `src/app/page.tsx` - Main landing page
- `src/server/auth/jwt.ts` - Authentication token handling
- `prisma/schema.prisma` - Database schema definition
- `.env.local` - Environment configuration

### Configuration Files (REQUIRED FOR RUNTIME)
- `next.config.js` - Next.js configuration
- `tsconfig.json` - TypeScript configuration
- `package.json` - Dependencies and scripts
- `prisma/prisma.config.js` - Prisma configuration

### Database
- `prisma/migrations/` - Migration history (DO NOT MODIFY MANUALLY)
- `prisma/schema.prisma` - Database models

---

## 📁 PROTECTED DIRECTORY STRUCTURE

```
src/
├── app/              ✅ Core app logic
├── server/
│   ├── auth/         ✅ Authentication
│   ├── api/          ✅ API endpoints
│   └── services/     ✅ Business logic
├── components/       ✅ React components
├── hooks/            ✅ Custom hooks
├── lib/              ✅ Utilities
└── utils/            ✅ Helper functions

prisma/
├── schema.prisma     ✅ Database schema
├── prisma.config.js  ✅ Config
└── migrations/       ✅ Version history
```

---

## 🛡️ SAFETY RULES

### ✅ ALLOWED CHANGES
- Add new features/components (additive)
- Update existing code logic
- Add new database models
- Add new environment variables
- Create new migrations

### ❌ FORBIDDEN CHANGES
- Deleting critical files without backup
- Moving core directories
- Removing middleware/auth files
- Changing database schema without migrations
- Deleting `node_modules` (run `npm install` to restore)

---

## 📊 CURRENT PROJECT STATE

**Generated:** 2026-05-08  
**Node Version:** >=20.0.0  
**NPM Version:** >=9.0.0  

### Installed Dependencies
```
next@16.2.5
react@19.2.6
react-dom@19.2.6
@prisma/client@7.8.0
prisma@7.8.0
typescript@5.0.0
```

### Environment Variables Required
```
DATABASE_URL=postgresql://...
JWT_SECRET=***
NEXTAUTH_SECRET=***
NEXT_PUBLIC_APP_URL=http://localhost:3000
VERCEL_OIDC_TOKEN=***
```

---

## 🔄 IF YOU NEED TO MAKE CHANGES

1. **Check git status first:**
   ```bash
   git status
   git diff
   ```

2. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make changes incrementally:**
   - Make small changes
   - Test locally: `npm run dev`
   - Commit: `git add . && git commit -m "Feature: description"`

4. **Never force-push to main:**
   ```bash
   git push --no-force
   ```

---

## 📋 BACKUP & RECOVERY

**Latest Backup:** See `.backups/` directory  
**Recovery Command:**
```bash
git reset --hard HEAD
git clean -fd
```

**Full Project Restore:**
```bash
git checkout .
npm install
npx prisma generate
```

---

## 🚨 EMERGENCY PROCEDURES

### If code is broken:
```bash
# Revert to last stable commit
git revert HEAD
npm install
npm run dev
```

### If database schema is corrupted:
```bash
# Check migrations status
npx prisma migrate status

# Reset to known good state
npx prisma migrate resolve --rolled-back migration_name
```

### If node_modules is corrupted:
```bash
rm -r node_modules package-lock.json
npm install
```

---

## ✅ VERIFICATION CHECKLIST

Before deploying, verify:
- [ ] All TypeScript files compile: `npm run build`
- [ ] Environment variables are set: `cat .env.local`
- [ ] Database is accessible: `npx prisma db push`
- [ ] Dev server runs: `npm run dev`
- [ ] No uncommitted changes: `git status`
- [ ] All tests pass: `npm run test`

---

## 📞 SUPPORT & DOCUMENTATION

- **Prisma Docs:** https://www.prisma.io/docs/
- **Next.js Docs:** https://nextjs.org/docs
- **Database Migrations:** See `prisma/migrations/`
- **API Routes:** See `src/server/api/`

---

**🔐 PROJECT IS NOW SEALED - PROCEED WITH CAUTION**

Only update when necessary. Test thoroughly. Commit often.
