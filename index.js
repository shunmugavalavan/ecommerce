var express = require('express'),
     mysql = require('mysql'),
     path = require('path'),
     bodyParser = require('body-parser'),
     cors = require('cors')
     Promise = require('bluebird');

var conf = require('./conf');
var Routes = require('./routes/route');
var middleware = require('./middleware');

var server = express();
var app = {};
var MODULE = "";
app.conf = conf;
server.use(cors());

global.__basedir = __dirname;

// server.use(express.static('EcommerceUI'))

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
    // job.start();
    app.db = connection;
    app.db = Promise.promisifyAll(app.db);
} catch (err) {
    console.log(`\n Error in Running Server \n ${err}`);
}

//Running Server
try {
    var port = conf.server.port;
    var host = conf.server.host;
    server.use(express.static(path.resolve('views')));
    server.set('trust proxy', true);
    server.use(express.urlencoded({extended: true}));
    server.use(express.json());
    server.use(middleware.traceReq);
   
    server.listen(port, function () {
        console.log("\n=======================================================================================")
        console.log(`\n ${new Date()} Ecommerce Server \n Running at  : ${host}:${port}`);
        console.log("=======================================================================================\n")
    });
    app.server = server;

} catch (err) {
    console.log(`\n ${new Date()} Error in Running Server \n ${err}`);
    process.exit();
}

// Connecting Routes

var routesInst = new Routes(app);
routesInst.init(app);

/*******************************************************************************************
 * Global Exception Handler
 ******************************************************************************************/
process.on('uncaughtException', function (err) {
    console.log(`\n ${new Date()} Exception handled @ [' ${MODULE}'] uncaughtException ${err.stack}`);
});
process.on('unhandledException', function (err) {
    console.log(`\n ${new Date()} Unhandled Exception handled @ ['${ MODULE}'] uncaughtException' ${ err.stack}`);
});
process.on('typeError', function (err) {
    console.log(`\n ${new Date()} Type Error handled @ ['${MODULE}'] uncaughtException' ${err.stack}`);
});
