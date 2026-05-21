import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function escapeValue(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'object') {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

async function main() {
  const backupPath = path.resolve(process.cwd(), 'backup_before_constraints.sql');
  const tables = await prisma.$queryRaw`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema='public'
      AND table_type='BASE TABLE'
      AND table_name NOT LIKE 'pg_%'
      AND table_name != '_prisma_migrations'
      AND table_name != '_prisma_migrations'
  `;

  let sql = `-- Backup created by Node script\n-- Tables: ${tables.map((t) => t.table_name).join(', ')}\n\n`;

  for (const row of tables) {
    const table = row.table_name;
    const columns = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema='public' AND table_name=${table}
      ORDER BY ordinal_position
    `;
    const columnNames = columns.map((c) => c.column_name);
    const items = await prisma.$queryRawUnsafe(`SELECT * FROM "${table}"`);
    if (!items || items.length === 0) continue;
    sql += `\n-- Table: ${table}\n`;
    for (const item of items) {
      const values = columnNames.map((column) => escapeValue(item[column]));
      sql += `INSERT INTO "${table}" (${columnNames.map((c) => `"${c}"`).join(', ')}) VALUES (${values.join(', ')});\n`;
    }
  }

  fs.writeFileSync(backupPath, sql);
  console.log('Backup written to', backupPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
