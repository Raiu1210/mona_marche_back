const express = require('express')
const multer = require('multer');
const bodyParser = require('body-parser')
const bitcoinMessage = require('bitcoinjs-message')
const cors = require('cors')
const mysql = require('mysql');
const url = require('url');

const app = express()
const messagePrefix = "\x19Monacoin Signed Message:\n"

var fs = require('fs');
var https = require('https');
app.use(bodyParser.json())
app.use(cors())
app.use(express.static(__dirname));

var options = {
  key:  fs.readFileSync('../../../ssl/localhost.key'),
  cert: fs.readFileSync('../../../ssl/localhost.crt')
};

var server = https.createServer(options,app);



// index
app.get('/', (req, res) => res.sendFile('./index.html'));


// goods_list_api
app.get('/goods_list', function(req, res) {
  let connection = mysql.createConnection({
    host : 'localhost',
    user : 'raiu',
    password : 'raiu114514',
    database: 'mona_marche'
  });
  connection.connect();

  const sql = "SELECT id, goods_name, contact, price, currency, image_path FROM goods_list WHERE alive = 1";
  connection.query(sql, (err, rows, fields) => {
    if (err) throw err;  
    
    var db_string = JSON.stringify(rows);
    var goods_list_json = JSON.parse(db_string)
    res.json(goods_list_json);
  });

  connection.end();
})


// goods_info_api
app.get('/goods_detail', function(req, res) {
  let connection = mysql.createConnection({
    host : 'localhost',
    user : 'raiu',
    password : 'raiu114514',
    database: 'mona_marche',
    timezone: 'jst'
  });
  connection.connect();

  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;

  const sql = "SELECT * FROM goods_list WHERE id=" + query["id"];
  connection.query(sql, (err, rows, fields) => {
    if (err) throw err;  
    
    var db_string = JSON.stringify(rows);
    var goods_info_json = JSON.parse(db_string)
    res.json(goods_info_json);
  });

  connection.end();
})


// get_my_goods_list API
app.post('/get_my_goods', function(req, res) {
  const address = req.body.address;

  let connection = mysql.createConnection({
    host : 'localhost',
    user : 'raiu',
    password : 'raiu114514',
    database: 'mona_marche',
    timezone: 'jst'
  });
  connection.connect();

  const sql = "SELECT * FROM goods_list WHERE address = '" + address + "'" + " AND alive = 1";
    connection.query(sql, (err, rows, fields) => {
      if (err) throw err;  
      
      var db_string = JSON.stringify(rows);
      var goods_info_json = JSON.parse(db_string)
      res.json(goods_info_json);
    });

    connection.end();
})


// about digital signature by mpurse
app.post('/verify', function(req, res) {
  var date = new Date();
  var a = date.getTime();
  var address = req.body.address
  var message = req.body.message
  var signature = req.body.signature

  var signed_time = message.split(':');
  var time_diff = a - parseInt(signed_time[1], 10)

  var is_varify = bitcoinMessage.verify(message, address, signature, messagePrefix)

  if(time_diff < 6000 && time_diff > 0 && is_varify) {
    var return_message = true
  } else {
    var return_message = false
  }

  res.send({
    message: return_message
  })
})


// about uploading goods_info
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './img')
  },
  
  filename: function (req, file, cb) {
    let connection = mysql.createConnection({
      host : 'localhost',
      user : 'raiu',
      password : 'raiu114514',
      database: 'mona_marche'
    });
    connection.connect();

    
    var d = new Date();
    var year  = d.getFullYear();
    var month = d.getMonth() + 1;
    var day   = d.getDate();
    var hour  = ( d.getHours()   < 10 ) ? '0' + d.getHours()   : d.getHours();
    var min   = ( d.getMinutes() < 10 ) ? '0' + d.getMinutes() : d.getMinutes();
    var sec   = ( d.getSeconds() < 10 ) ? '0' + d.getSeconds() : d.getSeconds();
    const imageName = `${req.body["address"]}_${year + '-' + month + '-' + day + '-' + hour + '-' + min + '-' + sec}.png`
    var SQL_VAR = "address, goods_name, discription, contact, price, currency, image_path, message, signature, alive"
    var VALUES = "'" + req.body["address"] + "', " + 
                 "'" + req.body["goods_name"] + "', " +
                 "'" + req.body["discription"] + "', " +
                 "'" + req.body["contact"] + "', " +
                     + req.body["price"] + ", " +
                 "'" + req.body["currency"] + "', " +
                 "'/img/" + imageName + "'," +
                 "'" + req.body["message"] + "', " +
                 "'" + req.body["signature"] + "', " +
                     + "1"

    let insert_sql = "INSERT INTO goods_list (" + SQL_VAR + ") VALUES (" + VALUES + ");" 
    connection.query(insert_sql, (err, rows, fields) => {
      if (err) throw err;    
    });
    
    connection.end();
    cb(null, imageName) 
  }
})

const upload = multer({
  storage: storage
}).single('file')

app.post('/image', (req, res) => {
  upload(req, res, (err) => {
      if (err) {
          res.json({
              status: "error",
              error: "fail to uplord image"
          })
      } else {
          res.json({
              status: "sucess",
              path: res.req.file.filename
          })
      }
  })
});


// about delete goods
app.post('/delete_goods', function(req, res) {
  var date = new Date();
  var a = date.getTime();
  var address = req.body.address
  var message = req.body.message
  var signature = req.body.signature
  var delete_id = req.body.delete_id

  var signed_time = message.split(':');
  var time_diff = a - parseInt(signed_time[1], 10)

  var is_varify = bitcoinMessage.verify(message, address, signature, messagePrefix)

  if(time_diff < 6000 && time_diff > 0 && is_varify) {
    let connection = mysql.createConnection({
      host : 'localhost',
      user : 'raiu',
      password : 'raiu114514',
      database: 'mona_marche'
    });
    connection.connect();

    const sql = "UPDATE goods_list SET alive = 0 WHERE id = " + delete_id;
    connection.query(sql, (err, rows, fields) => {
      if (err) throw err;  
      
      res.send({
        message: true
      })
    });
  } else {
    res.send({
      message: false
    })
  }
})


// about saving tx
app.post('/save_tx', function(req, res) {
  const from_address = req.body.from_address
  const to_address = req.body.to_address
  const tx_hash = req.body.tx_hash
  const price = req.body.price

  let connection = mysql.createConnection({
    host : 'localhost',
    user : 'raiu',
    password : 'raiu114514',
    database: 'mona_marche'
  });
  connection.connect();

  const values = "'" + from_address + "', " + "'" + to_address + "', " + price + ", " + "'" + tx_hash + "'"
  const sql = "INSERT INTO tx_list (from_address, to_address, price, tx_hash) VALUES (" + values + ");"
  connection.query(sql, (err, rows, fields) => {
    if (err) throw err;    
  });
  
  connection.end();
})


// get tx from me list
app.get('/tx_from_me_list', function(req, res) {
  let connection = mysql.createConnection({
    host : 'localhost',
    user : 'raiu',
    password : 'raiu114514',
    database: 'mona_marche',
    timezone: 'jst'
  });
  connection.connect();

  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;

  const sql = "SELECT price, tx_hash, timestamp FROM tx_list WHERE from_address='" + query["from_address"] + "';";
  connection.query(sql, (err, rows, fields) => {
    if (err) throw err;  
    
    var db_string = JSON.stringify(rows);
    var my_tx_list_json = JSON.parse(db_string)
    res.json(my_tx_list_json);
  });

  connection.end();
})


// get tx to me list
app.get('/tx_to_me_list', function(req, res) {
  let connection = mysql.createConnection({
    host : 'localhost',
    user : 'raiu',
    password : 'raiu114514',
    database: 'mona_marche',
    timezone: 'jst'
  });
  connection.connect();

  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;

  const sql = "SELECT price, tx_hash, timestamp FROM tx_list WHERE to_address='" + query["to_address"] + "';";
  connection.query(sql, (err, rows, fields) => {
    if (err) throw err;  
    
    var db_string = JSON.stringify(rows);
    var my_tx_list_json = JSON.parse(db_string)
    res.json(my_tx_list_json);
  });

  connection.end();
})


server.listen(3000);