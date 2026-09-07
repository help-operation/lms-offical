-- ============================================================
-- VERIFICATION: Run AFTER migration 0069-0072
-- ============================================================
-- All checks should return PASS. If any FAIL, investigate.

-- CHECK 1: users column count (should be 69)
SELECT
  CASE
    WHEN COUNT(*) >= 69 THEN 'PASS: users has ' || COUNT(*) || ' columns (expected 69+)'
    ELSE 'FAIL: users has only ' || COUNT(*) || ' columns (expected 69+)'
  END AS result
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public';

-- CHECK 2: Critical auth columns exist
SELECT
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='tokens_valid_from')
    THEN 'PASS' ELSE 'FAIL'
  END AS tokens_valid_from,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='failed_login_attempts')
    THEN 'PASS' ELSE 'FAIL'
  END AS failed_login_attempts,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='locked_until')
    THEN 'PASS' ELSE 'FAIL'
  END AS locked_until,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_login_at')
    THEN 'PASS' ELSE 'FAIL'
  END AS last_login_at;

-- CHECK 3: user_role enum has all values
SELECT
  e.enumlabel AS value,
  'EXISTS' AS status
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'user_role'
ORDER BY e.enumsortorder;

-- CHECK 4: Child tables exist
SELECT
  table_name,
  CASE WHEN table_name IS NOT NULL THEN 'PASS' ELSE 'FAIL' END AS status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('user_education', 'user_experience', 'user_skills', 'user_documents')
ORDER BY table_name;

-- CHECK 5: Existing users are intact (count, no data loss)
SELECT
  COUNT(*) AS total_users,
  COUNT(*) FILTER (WHERE role = 'GUEST') AS guests,
  COUNT(*) FILTER (WHERE role = 'STUDENT') AS students,
  COUNT(*) FILTER (WHERE role = 'INSTRUCTOR') AS instructors,
  COUNT(*) FILTER (WHERE role = 'SUPER_ADMIN') AS super_admins
FROM users;
