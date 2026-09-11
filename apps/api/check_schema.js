const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres123@127.0.0.1:5432/lms'
});

async function main() {
  try {
    // 1. Get all columns from users table
    const cols = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    console.log('=== USERS TABLE COLUMNS (' + cols.rows.length + ' total) ===');
    cols.rows.forEach(r => {
      console.log(r.column_name + ' | ' + r.data_type + ' | nullable=' + r.is_nullable + ' | default=' + (r.column_default || 'none'));
    });

    // 2. Check drizzle_migrations table
    const migrations = await pool.query(`
      SELECT idx, tag FROM drizzle."__drizzle_migrations" ORDER BY idx
    `).catch(() => null);
    if (migrations) {
      console.log('\n=== DRIZZLE MIGRATIONS APPLIED ===');
      console.log('Total: ' + migrations.rows.length);
      const lastMigration = migrations.rows[migrations.rows.length - 1];
      console.log('Last migration: idx=' + lastMigration.idx + ' tag=' + lastMigration.tag);
      // Check if 0069+ exist
      const recent = migrations.rows.filter(r => r.idx >= 69);
      console.log('Migrations 0069+: ' + (recent.length > 0 ? recent.map(r => r.tag).join(', ') : 'NONE'));
    } else {
      console.log('\n=== DRIZZLE MIGRATIONS TABLE NOT FOUND ===');
    }

    // 3. Check for specific columns that should exist from 0070-0072
    const expectedCols = [
      'employee_id', 'department', 'designation', 'joining_date', 'employment_type',
      'date_of_birth', 'national_id', 'profile_picture',
      'emergency_contact_name', 'emergency_contact_phone',
      'salary', 'bank_name', 'bank_account_number',
      'present_address', 'permanent_address',
      'nid_type', 'emergency_contact_relationship', 'banking_type', 'banking_provider',
      'division', 'district', 'thana', 'union_name', 'post_code',
      'father_name', 'mother_name',
      'present_division', 'present_district', 'present_thana', 'present_union',
      'present_post_code', 'present_country', 'same_as_permanent',
      'house_rent', 'medical_allowance', 'transport_allowance', 'other_allowance',
      'gross_salary', 'overtime_rate', 'tax_deduction', 'provident_fund',
      'other_deduction', 'net_salary',
      'bonus_type', 'bonus_calculation_type', 'bonus_amount', 'bonus_frequency',
      'bonus_eligibility', 'bonus_notes',
      'failed_login_attempts', 'locked_until', 'tokens_valid_from', 'last_login_at'
    ];
    const existingColNames = cols.rows.map(r => r.column_name);
    const missing = expectedCols.filter(c => !existingColNames.includes(c));
    const existing = expectedCols.filter(c => existingColNames.includes(c));
    console.log('\n=== SCHEMA MISMATCH CHECK ===');
    console.log('Expected columns found: ' + existing.length + '/' + expectedCols.length);
    if (missing.length > 0) {
      console.log('MISSING COLUMNS (' + missing.length + '): ' + missing.join(', '));
    } else {
      console.log('ALL EXPECTED COLUMNS PRESENT');
    }

    // 4. Check user_role enum values
    const enumVals = await pool.query(`
      SELECT e.enumlabel
      FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'user_role'
      ORDER BY e.enumsortorder
    `).catch(() => null);
    if (enumVals) {
      console.log('\n=== USER_ROLE ENUM VALUES ===');
      console.log(enumVals.rows.map(r => r.enumlabel).join(', '));
    }

    // 5. Check child tables
    const tables = await pool.query(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename IN ('user_education', 'user_experience', 'user_skills', 'user_documents')
      ORDER BY tablename
    `);
    console.log('\n=== CHILD TABLES (0072) ===');
    console.log(tables.rows.map(r => r.tablename).join(', ') || 'NONE FOUND');

  } catch (e) {
    console.error('ERROR: ' + e.message);
  } finally {
    await pool.end();
  }
}

main();
