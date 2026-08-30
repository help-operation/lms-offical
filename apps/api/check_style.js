const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:root@localhost:5432/lms' });
(async () => {
  const r = await pool.query("SELECT id, title, style_overrides FROM courses WHERE id=6");
  console.log(JSON.stringify(r.rows[0].style_overrides, null, 2));
  await pool.end();
})();
