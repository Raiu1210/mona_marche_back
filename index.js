const express = require('express')
const multer = require('multer');
const bodyParser = require('body-parser')
const bitcoinMessage = require('bitcoinjs-message')
const cors = require('cors')


const app = express()
const messagePrefix = "\x19Monacoin Signed Message:\n"

var fs = require('fs');
var https = require('https');
app.use(bodyParser.json())
app.use(cors())

var options = {
  key:  fs.readFileSync('../../../ssl/localhost.key'),
  cert: fs.readFileSync('../../../ssl/localhost.crt')
};

var server = https.createServer(options,app);


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
    var d = new Date();
    var year  = d.getFullYear();
    var month = d.getMonth() + 1;
    var day   = d.getDate();
    var hour  = ( d.getHours()   < 10 ) ? '0' + d.getHours()   : d.getHours();
    var min   = ( d.getMinutes() < 10 ) ? '0' + d.getMinutes() : d.getMinutes();
    var sec   = ( d.getSeconds() < 10 ) ? '0' + d.getSeconds() : d.getSeconds();
    // print( year + '-' + month + '-' + day + ' ' + hour + ':' + min + ':' + sec );
      
    const imageName = `${req.body["address"]}_${year + '-' + month + '-' + day + '-' + hour + '-' + min + '-' + sec}.png`
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