const conf = require('./conf');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
var reqMethod = {
  "POST" : "body",
  "GET" : "query"
};

exports.plainTextToEncryptHash = async function (plainText) {

  const hashedPassword = await new Promise((resolve, reject) => {
    bcrypt.hash(plainText.toString(), conf.bcrypt.salt, function (err, hash) {
      if (err) reject(err)
      resolve(hash)
    });
  })

  return hashedPassword;

}

exports.authenticateToken = function (req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (token == null) {
    return res.sendStatus(401);
  }

  jwt.verify(token, conf.jsonwebtoken.secret, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }
    req.customerId = user.customerId;
    req.user = user;
    next();
  })
}

exports.generateAccessToken = function (username) {
  return jwt.sign(username, conf.jsonwebtoken.secret, { expiresIn: conf.jsonwebtoken.expireIn });
}

exports.isValidIPFormat = function (ipAddress) {
  return isIp(ipAddress);
}

exports.getDate = function () {
  var date = new Date();
  var months = parseInt(date.getMonth() + 1) <= 9 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1;
  var dates = parseInt(date.getDate()) <= 9 ? '0' + date.getDate() : date.getDate();
  var hours = parseInt(date.getHours()) <= 9 ? '0' + date.getHours() : date.getHours();
  var minutes = parseInt(date.getMinutes()) <= 9 ? '0' + date.getMinutes() : date.getMinutes();
  var seconds = parseInt(date.getSeconds()) <= 9 ? '0' + date.getSeconds() : date.getSeconds();
  var result = `${date.getFullYear()}-${months}-${dates} ${hours}:${minutes}:${seconds}`;
  return result;
}

exports.traceReq = function(req, res, next){
  var output =
      "\n" +
      "=======================================================================================================\n"+
      "URL        : "+ req.url.split('?')[0]+"\n" +
      "Method     : "+req.method+"\n"+
      "SessionId  : "+(req.sessionId?req.sessionId:null)+"\n"+
      "Req Params : "+((req[reqMethod[req.method]] && JSON.stringify(req[reqMethod[req.method]]))|| null)+"\n" +
      "Req IP     : "+req.connection.remoteAddress+"\n" +
      "Date       : "+new Date()+"\n" +
      "=======================================================================================================\n";

  console.log(output);
  next();
};