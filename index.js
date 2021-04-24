var Promise = require('bluebird');
var express = require('express'); //
var conf = require('./conf');
var mysql = require('mysql');
var Routes = require('./routes/route');
var middleware = require('./middleware');
var server = express();
var app = {};
var MODULE = "";
app.conf = conf;
var path = require('path');
var bodyParser = require('body-parser'); 
var cors = require('cors')
server.use(cors());

//Connecting DB
try {
    var connection = mysql.createConnection(conf.db);
    connection.connect(function (err) {
        if (err) {
            console.error(`\nError Connecting Database: ${err.stack}`);
            return;
        }
        console.log(`\n Database Connected as id :${connection.threadId}`);
        routesInst.newDBCreation();
    });
    app.db = connection;
    app.db = Promise.promisifyAll(app.db);
} catch (err) {
    console.log(`\n Error in Running Server \n ${err}`);
}


function convertCase(str) {
    var lower = String(str).replace(/_/gi, " ").toLowerCase();
    return lower.replace(/(^| )(\w)/g, function(x) {
      return x.toUpperCase();
    });
  }

//Running Server
try {
    var port = conf.server.port;
    var host = conf.server.host;
    server.use(express.static(path.resolve('views')));
    server.set('trust proxy', true);
    server.use(bodyParser.json());
    server.use(middleware.traceReq);
   
    server.listen(port, function () {
        var date = new Date();
        console.log("\n=======================================================================================")
        console.log(`\n Project Name: ${convertCase(conf.projectDatabase)} \n Running at  : ${host}:${port}\n Started Time: ${date}`);
        console.log("=======================================================================================\n")
    });
    app.server = server;

} catch (err) {
    console.log(`\n Error in Running Server \n ${err}`);
    process.exit();
}

// Connecting Routes

var routesInst = new Routes(app);
routesInst.init(app);

/*******************************************************************************************
 * Global Exception Handler
 ******************************************************************************************/
process.on('uncaughtException', function (err) {
    console.log(`\n Exception handled @ [' ${MODULE}'] uncaughtException ${err.stack}`);
});
process.on('unhandledException', function (err) {
    console.log(`\n Unhandled Exception handled @ ['${ MODULE}'] uncaughtException' ${ err.stack}`);
});
process.on('typeError', function (err) {
    console.log(`\n Type Error handled @ ['${MODULE}'] uncaughtException' ${err.stack}`);
});
