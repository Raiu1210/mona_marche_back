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

  var is_varify = bitcoinMessage.verify(message, address, signature, messagePrefix)
  console.log(is_varify)

  res.send({
    message: is_varify
  })
})



// about uploading goods_info
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, './img')
  },
  
  filename: function (req, file, cb) {
      //　Math.random().toString(36).slice(-9)で乱数を生成
      const imageName = `${Math.random().toString(36).slice(-9)}_${Date.now()}.png`
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