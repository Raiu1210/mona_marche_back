const express = require('express')
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

server.listen(3000);