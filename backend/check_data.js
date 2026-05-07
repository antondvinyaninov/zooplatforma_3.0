const { Client } = require('pg');
async function checkData() {
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
    const res = await client.query('SELECT count(*) FROM users;');
    console.log('Users count:', res.rows[0].count);
    const res2 = await client.query('SELECT * FROM users ORDER BY id DESC LIMIT 1;');
    console.log('Latest user:', res2.rows[0]);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}
checkData();
