const { Client } = require('pg');

async function checkSchema() {
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
    console.log('Connected to database!');

    const res = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users';
    `);

    console.table(res.rows);
  } catch (err) {
    console.error('Error connecting to database:', err);
  } finally {
    await client.end();
  }
}

checkSchema();
