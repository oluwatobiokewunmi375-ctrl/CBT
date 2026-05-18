#!/usr/bin/env node

/**
 * 🔒 CBT PROJECT INTEGRITY CHECK
 * 
 * This script verifies that critical files haven't been deleted
 * or moved to unexpected locations.
 * 
 * Run with: node scripts/verify-integrity.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CRITICAL_FILES = [
  // Core application - using new app structure
  'app/layout.tsx',
  'app/page.tsx',
  'prisma/schema.prisma',
  
  // Configuration
  'next.config.mjs',
  'tsconfig.json',
  'package.json',
  
  // Security
  'PROJECT_LOCK.md',
  '.gitignore',
];

const CRITICAL_DIRECTORIES = [
  'app',
  'components',
  'hooks',
  'lib',
  'prisma',
  'prisma/migrations',
  'public',
];

console.log('\n🔒 CBT PROJECT INTEGRITY CHECK\n');
console.log('='.repeat(50));

let errorCount = 0;

// Check critical files
console.log('\n📄 Checking critical files...\n');
CRITICAL_FILES.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ MISSING: ${file}`);
    errorCount++;
  }
});

// Check critical directories
console.log('\n📁 Checking critical directories...\n');
CRITICAL_DIRECTORIES.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (fs.existsSync(dirPath)) {
    console.log(`✅ ${dir}/`);
  } else {
    console.log(`❌ MISSING: ${dir}/`);
    errorCount++;
  }
});

// Summary
console.log('\n' + '='.repeat(50));
if (errorCount === 0) {
  console.log('\n✅ PROJECT INTEGRITY: VERIFIED\n');
  process.exit(0);
} else {
  console.log(`\n❌ INTEGRITY CHECK FAILED: ${errorCount} critical items missing\n`);
  console.log('Run: git checkout . && npm install\n');
  process.exit(1);
}
