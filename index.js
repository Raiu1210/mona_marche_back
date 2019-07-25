const express = require('express')
const multer = require('multer');
const bodyParser = require('body-parser')
const bitcoinMessage = require('bitcoinjs-message')
const cors = require('cors')
const mysql = require('mysql');

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



//index
app.get('/', (req, res) => res.sendFile('./index.html'));



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

  if(time_diff < 6000 && is_varify) {
    var return_message = true
  } else {
    var return_message = false
  }
  console.log(return_message)

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
                 "'./img/" + imageName + "'," +
                 "'" + req.body["message"] + "', " +
                 "'" + req.body["signature"] + "', " +
                     + "1"

    let insert_sql = "INSERT INTO goods_list (" + SQL_VAR + ") VALUES (" + VALUES + ");" 
    connection.query(insert_sql, (err, rows, fields) => {
      if (err) throw err;    
      console.log(rows);
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
          //アップロード失敗した場合
          res.json({
              status: "error",
              error: "fail to uplord image"
          })
      } else {
          //アップロード成功した場合
          res.json({
              status: "sucess",
              // ファイル名を返す
              path: res.req.file.filename
          })
      }
  })
});

server.listen(3000);