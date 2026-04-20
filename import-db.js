const mariadb = require('mariadb');
const fs = require('fs');

async function importDb() {
  const pool = mariadb.createPool({
    host: 'shinkansen.proxy.rlwy.net',
    port: 54880,
    user: 'root',
    password: 'tkdsWwlehTOqmippZzFJhXXrWVsIgWjb',
    database: 'railway',
    multipleStatements: true,
    connectTimeout: 30000,
    allowPublicKeyRetrieval: true
  });

  let conn;
  try {
    console.log("Connecting to Railway database...");
    conn = await pool.getConnection();
    console.log("Connected. Reading backup.sql...");
    const sql = fs.readFileSync('backup.sql', 'utf8');
    console.log("Executing SQL...");
    await conn.query(sql);
    console.log("Database imported successfully.");
  } catch (err) {
    console.error("Error importing database:", err);
  } finally {
    if (conn) conn.end();
    pool.end();
  }
}

importDb();
