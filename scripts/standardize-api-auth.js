const fs = require('fs');
const path = require('path');
const files = [
  'app/api/admin/admins/route.ts',
  'app/api/admin/admins/[id]/route.ts',
  'app/api/admin/assign-student/route.ts',
  'app/api/admin/classrooms/route.ts',
  'app/api/admin/dashboard/route.ts',
  'app/api/admin/exams/route.ts',
  'app/api/admin/questions/route.ts',
  'app/api/admin/questions/[id]/route.ts',
  'app/api/admin/students/route.ts',
  'app/api/admin/subjects/route.ts',
  'app/api/admin/teachers/route.ts',
  'app/api/analytics/exam/route.ts',
  'app/api/auth/register/route.ts',
  'app/api/exam/list/route.ts',
  'app/api/exam/save-progress/route.ts',
  'app/api/exam/start/route.ts',
  'app/api/exam/submit/route.ts',
  'app/api/exam/[id]/route.ts',
  'app/api/results/exam/[examId]/route.ts',
  'app/api/results/export/route.ts',
  'app/api/results/grouped/route.ts',
  'app/api/results/list/route.ts',
  'app/api/school/admins/route.ts',
  'app/api/school/admins/[id]/route.ts',
  'app/api/school/route.ts',
  'app/api/support/route.ts',
];

function replaceImport(text) {
  return text.replace(/import\s*\{([^}]*)\bverifyToken\b([^}]*)\}\s*from\s*["']@\/lib\/auth\/middleware["']/g, (match, before, after) => {
    const beforeTrim = before.trim();
    const afterTrim = after.trim();
    const parts = [];
    if (beforeTrim) parts.push(beforeTrim);
    parts.push('verifyTokenFromRequest');
    if (afterTrim) parts.push(afterTrim);
    return `import { ${parts.join(', ')} } from \"@/lib/auth/middleware\"`;
  });
}

function replaceAuthBlocks(text) {
  let out = text;
  out = out.replace(/const authToken = req\.headers\.get\(\"authorization\"\)\?\.split\(\" \"\)\[1\] \|\| null;\s*const decoded = authToken \? verifyToken\(authToken\) : null;/g, 'const decoded = verifyTokenFromRequest(req);');
  out = out.replace(/const token = req\.headers\.get\(\"authorization\"\)\?\.split\(\" \"\)\[1\];\s*const decoded = verifyToken\(token\);/g, 'const decoded = verifyTokenFromRequest(req);');
  out = out.replace(/const token = req\.headers\.get\(\"authorization\"\)\?\.split\(\" \"\)\[1\];\s*if \(!token\) \{[\s\S]*?\}\s*const decoded = verifyToken\(token\);/g, 'const decoded = verifyTokenFromRequest(req);');
  out = out.replace(/const token = req\.headers\.get\(\"authorization\"\)\?\.split\(\" \"\)\[1\];\s*if \(!token\) return [^\n]*\n\s*const decoded = verifyToken\(token\);/g, 'const decoded = verifyTokenFromRequest(req);');
  out = out.replace(/const decoded = token \? verifyToken\(token\) : null;/g, 'const decoded = verifyTokenFromRequest(req);');
  out = out.replace(/const token = req\.headers\.get\(\"authorization\"\)\?\.split\(\" \"\)\[1\];/g, '');
  return out;
}

files.forEach(rel => {
  const file = path.join(process.cwd(), rel);
  let text = fs.readFileSync(file, 'utf8');
  const updated = replaceImport(replaceAuthBlocks(text));
  if (updated !== text) {
    fs.writeFileSync(file, updated, 'utf8');
    console.log('Updated:', rel);
  } else {
    console.log('No changes:', rel);
  }
});
