const mysql = require('mysql2');
const connection = mysql.createConnection('mysql://root:@localhost:3306/100mxley');

connection.connect((err) => {
  if (err) {
    console.error('Connection error:', err);
    process.exit(1);
  }
  console.log('Connected successfully!');
  connection.query('SELECT 1 + 1 AS solution', (err, rows) => {
    if (err) {
        console.error('Query error:', err);
        process.exit(1);
    }
    console.log('The solution is: ', rows[0].solution);
    connection.end();
  });
});
