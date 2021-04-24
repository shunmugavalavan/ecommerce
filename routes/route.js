var Promise = require('bluebird');
var middleware = require('../middleware');
var path = require('path');
// Connecting Actions
var apiActions = require('../actions/action');

var Routes = function (app) {
    this.conf = app.conf;
    this.server = app.server;
    this.apiActionInstance = new apiActions(app);

};
module.exports = Routes;

Routes.prototype.init = function () {
    var self = this;
    var app = self.server;
    app.get('/',function (req,res) {
        res.send("Hungarian tool Running...");
    });

    app.post('/login',function (req,res) {

        Promise.resolve()
        .then(function(){
            return self.apiActionInstance.authenticate(req)
        })
        .then(function(finalResult){
           res.send(finalResult);
        })
        .catch(function(err){
            console.log("Error at /login ",err);
            res.send(err);
        })
    })

    app.post('/addEntry',middleware.authenticateToken,function (req,res) {

        Promise.resolve()
        .then(function(){
            return self.apiActionInstance.addNewEntry(req)
        })
        .then(function(finalResult){
           res.send(finalResult);
        })
        .catch(function(err){
            console.log("Error at /addEntry ",err);
            res.send(err);
        })
    })

    app.get('/getEntry',middleware.authenticateToken,function (req,res) {

        Promise.resolve()
        .then(function(){
            return self.apiActionInstance.getEntry(req)
        })
        .then(function(finalResult){
           res.send(finalResult);
        })
        .catch(function(err){
            console.log("Error at /getEntry ",err);
            res.send(err);
        })
    })

    app.post('/updateEntry',middleware.authenticateToken,function (req,res) {

        Promise.resolve()
        .then(function(){
            return self.apiActionInstance.updateExistEntry(req)
        })
        .then(function(finalResult){
           res.send(finalResult);
        })
        .catch(function(err){
            console.log("Error at /addEntry ",err);
            res.send(err);
        })
    })

    app.post('/deleteEntry',middleware.authenticateToken,function (req,res) {

        Promise.resolve()
        .then(function(){
            return self.apiActionInstance.deleteExistEntry(req)
        })
        .then(function(finalResult){
           res.send(finalResult);
        })
        .catch(function(err){
            console.log("Error at /addEntry ",err);
            res.send(err);
        })
    })

    app.get('/checkIsValidIP',function (req,res) {

        Promise.resolve()
        .then(function(){
            return self.apiActionInstance.checkIsValidIP(req)
        })
        .then(function(finalResult){
           res.send(finalResult);
        })
        .catch(function(err){
            console.log("Error at /checkIsValidIP ",err);
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