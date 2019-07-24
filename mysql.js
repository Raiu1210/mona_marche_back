const mysql = require('mysql');

let connection = mysql.createConnection({
    host : 'localhost',
    user : 'raiu',
    password : 'raiu114514',
    database: 'mona_marche'
  });

  connection.connect();

  let sql = 'show tables;';

  connection.query(sql, (err, rows, fields) => {
    if (err) throw err;
  
    console.log(rows);
  });
  
  connection.end();

