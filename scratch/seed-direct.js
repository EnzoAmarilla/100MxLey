const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seed() {
  const dbUrl = process.env.DATABASE_URL || 'mysql://root:@localhost:3306/100mxley';
  console.log('Connecting to:', dbUrl);
  
  const connection = await mysql.createConnection(dbUrl);

  try {
    const adminEmail = "admin@100mxley.com";
    const hashedPassword = await bcrypt.hash("admin123", 10);

    // Check if user exists
    const [users] = await connection.execute('SELECT id FROM User WHERE email = ?', [adminEmail]);
    
    let userId;
    if (users.length > 0) {
      userId = users[0].id;
      await connection.execute('UPDATE User SET password = ? WHERE id = ?', [hashedPassword, userId]);
      console.log('User updated');
    } else {
      userId = `admin-${Date.now()}`;
      await connection.execute(
        'INSERT INTO User (id, email, name, password, credits) VALUES (?, ?, ?, ?, ?)',
        [userId, adminEmail, 'Admin 100MxLey', hashedPassword, 500]
      );
      console.log('User created');
    }

    console.log('Success! Use admin@100mxley.com / admin123 to login.');
  } catch (error) {
    console.error('Error seeding:', error);
  } finally {
    await connection.end();
  }
}

seed();
