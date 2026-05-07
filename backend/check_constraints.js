const { Client } = require('pg');
async function checkConstraints() {
  const client = new Client({
    host: '88.218.121.213',
    port: 5967,
    user: 'zp',
    password: 'lmLG7k2ed4vas19',
    database: 'zp-db',
    ssl: false,
  });
  try {
    await client.connect();
    const res = await client.query(`
      SELECT conname, pg_get_constraintdef(c.oid)
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE conrelid = 'users'::regclass;
    `);
    console.table(res.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}
checkConstraints();
