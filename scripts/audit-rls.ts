/**
 * RLS Audit Script
 * Verifies all tables have RLS enabled and policies defined.
 * Run: npx tsx scripts/audit-rls.ts
 */

import fs from 'fs'
import path from 'path'

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations')

// Extract tables from schema migration
const schemaFile = fs.readFileSync(
  path.join(migrationsDir, '002_core_schema.sql'),
  'utf-8'
)
const rlsFile = fs.readFileSync(
  path.join(migrationsDir, '003_rls_policies.sql'),
  'utf-8'
)
const apiFile = fs.readFileSync(
  path.join(migrationsDir, '007_api_keys_webhooks.sql'),
  'utf-8'
)

const allSql = schemaFile + '\n' + rlsFile + '\n' + apiFile

// Find all CREATE TABLE statements
const tableRegex = /CREATE TABLE (\w+)/g
const tables: string[] = []
let match
while ((match = tableRegex.exec(schemaFile + '\n' + apiFile)) !== null) {
  tables.push(match[1])
}

// Find all ALTER TABLE ... ENABLE ROW LEVEL SECURITY
const rlsEnabledRegex = /ALTER TABLE (\w+) ENABLE ROW LEVEL SECURITY/g
const rlsEnabled = new Set<string>()
while ((match = rlsEnabledRegex.exec(allSql)) !== null) {
  rlsEnabled.add(match[1])
}

// Find all CREATE POLICY on tables
const policyRegex = /CREATE POLICY "[^"]*" ON (\w+)/g
const policiesByTable = new Map<string, number>()
while ((match = policyRegex.exec(allSql)) !== null) {
  const count = policiesByTable.get(match[1]) ?? 0
  policiesByTable.set(match[1], count + 1)
}

// Find USING (true) policies
const usingTrueRegex = /CREATE POLICY "([^"]*)" ON (\w+)[\s\S]*?USING \(true\)/g
const publicPolicies: Array<{ name: string; table: string }> = []
while ((match = usingTrueRegex.exec(allSql)) !== null) {
  publicPolicies.push({ name: match[1], table: match[2] })
}

// Report
let hasErrors = false

console.log('=== RLS AUDIT REPORT ===\n')
console.log(`Total tables: ${tables.length}`)
console.log(`Tables with RLS: ${rlsEnabled.size}\n`)

for (const table of tables) {
  const hasRLS = rlsEnabled.has(table)
  const policyCount = policiesByTable.get(table) ?? 0

  if (!hasRLS) {
    console.error(`❌ ${table}: RLS NOT ENABLED`)
    hasErrors = true
  } else if (policyCount === 0) {
    console.error(`⚠️  ${table}: RLS enabled but NO POLICIES`)
    hasErrors = true
  } else {
    console.log(`✅ ${table}: RLS enabled, ${policyCount} policies`)
  }
}

if (publicPolicies.length > 0) {
  console.log('\n--- Public policies (USING true) ---')
  for (const p of publicPolicies) {
    console.warn(`⚠️  "${p.name}" on ${p.table}: USING (true) — verify this is intentional`)
  }
}

console.log('\n=== AUDIT COMPLETE ===')
if (hasErrors) {
  process.exit(1)
} else {
  console.log('All tables have RLS enabled with policies.')
}
