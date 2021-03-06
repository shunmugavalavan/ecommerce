var Promise = require('bluebird');
var middleware = require('../middleware');

const multer = require('multer');
var path = require('path');
// Connecting Actions
var apiActions = require('../actions/action');

var Routes = function (app) {
    this.conf = app.conf;
    this.server = app.server;
    this.apiActionInstance = new apiActions(app);

};
module.exports = Routes;

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
	   cb(null, __basedir + '/uploads/')
	},
	filename: (req, file, cb) => {
	   cb(null, file.fieldname + "-" + Date.now() + "-" + file.originalname)
	}
});
const upload = multer({storage: storage});

Routes.prototype.init = function () {
    var self = this;
    var app = self.server;

    app.get('/',function (req,res) {
        res.send("server is Running...");
    });

    app.post('/register',function (req,res) {

        Promise.resolve()
        .then(function(){
            return self.apiActionInstance.register(req)
        })
        .then(function(finalResult){
           res.send(finalResult);
        })
        .catch(function(err){
            console.log("Error at /register ",err);
            res.send(err);
        })
    })

    app.post('/login',function (req,res) {
        Promise.resolve()
        .then(function(){
            return self.apiActionInstance.login(req)
        })
        .then(function(finalResult){
           res.send(finalResult);
        })
        .catch(function(err){
            console.log("Error at /login ",err);
            res.send(err);
        })
    })

    app.get('/getProducts',middleware.authenticateToken,function (req,res) {

        Promise.resolve()
        .then(function(){
            return self.apiActionInstance.getProducts(req)
        })
        .then(function(finalResult){
           res.send(finalResult);
        })
        .catch(function(err){
            console.log("Error at /getProducts ",err);
            res.send(err);
        })
    })

    app.post('/uploadProducts',middleware.authenticateToken,upload.single("productsFile"), function (req,res) {
        let filePath = __basedir + '/uploads/' + req.file.filename;
        Promise.resolve()
        .then(function(){
            return self.apiActionInstance.uploadProducts(req,filePath)
        })
        .then(function(finalResult){
           res.send(finalResult);
        })
        .catch(function(err){
            console.log("Error at /addProduct ",err);
            res.send(err);
        })
    })

    app.patch('/updateProduct',middleware.authenticateToken,function (req,res) {
        console.log("patch called....");
    Promise.resolve()
    .then(function(){
        return self.apiActionInstance.updateProduct(req)
    })
    .then(function(finalResult){
       res.send(finalResult);
    })
    .catch(function(err){
        console.log("Error at /updateProduct ",err);
        res.send(err);
    })
    })

    app.post('/placeOrder',middleware.authenticateToken,function (req,res) {

    Promise.resolve()
    .then(function(){
        return self.apiActionInstance.placeOrder(req)
    })
    .then(function(finalResult){
       res.send(finalResult);
    })
    .catch(function(err){
        console.log("Error at /placeOrder ",err);
        res.send(err);
    })
    })

    app.get('/getMyOrders',middleware.authenticateToken,function (req,res) {

    Promise.resolve()
    .then(function(){
        return self.apiActionInstance.getMyOrder(req)
    })
    .then(function(finalResult){
       res.send(finalResult);
    })
    .catch(function(err){
        console.log("Error at /getMyOrders ",err);
        res.send(err);
    })
    })

    app.get('/getAllOrders',middleware.authenticateToken,function (req,res) {

    Promise.resolve()
    .then(function(){
        return self.apiActionInstance.getAllOrder(req)
    })
    .then(function(finalResult){
       res.send(finalResult);
    })
    .catch(function(err){
        console.log("Error at /getAllOrders ",err);
        res.send(err);
    })
    })


    app.post('/cancelOrder',middleware.authenticateToken,function (req,res) {

        Promise.resolve()
        .then(function(){
            return self.apiActionInstance.cancelOrder(req)
        })
        .then(function(finalResult){
           res.send(finalResult);
        })
        .catch(function(err){
            console.log("Error at /cancelOrder ",err);
            res.send(err);
        })
    })

    app.post('/orderDelivered',middleware.authenticateToken,function (req,res) {

        Promise.resolve()
        .then(function(){
            return self.apiActionInstance.orderDelivered(req)
        })
        .then(function(finalResult){
           res.send(finalResult);
        })
        .catch(function(err){
            console.log("Error at /orderDelivered ",err);
            res.send(err);
        })
    })
}

Routes.prototype.newDBCreation = function () {
    var self = this;
    self.apiActionInstance.createDatabase()
    .then(function(result){
        return Promise.resolve(result);
    })
}

