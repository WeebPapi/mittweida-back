// test-connection.js
const { Client } = require('pg');

const client = new Client({
  host: 'bnrpvndrndrepzxprrts.supabase.co',
  port: 6543,
  user: 'postgres',
  password: 'PCNCrnga0atxKZQK', // Replace this
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});

client
  .connect()
  .then(() => {
    console.log('✅ Connected successfully!');
    return client.query('SELECT version()');
  })
  .then((result) => {
    console.log('Database version:', result.rows[0].version);
    client.end();
  })
  .catch((err) => {
    console.error('❌ Connection failed:', err.message);
    console.error('Full error:', err);
  });
