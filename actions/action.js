var Promise = require('bluebird');
var path = require('path');
var falseValues = ['', null, undefined, 'undefined', 'null'];
var apiServices = require('../services/service');
var middleware = require('../middleware');

var Actions = function (app) {
    this.conf = app.conf;
    this.server = app.server;
    this.serviceInstance = new apiServices(app);
};
module.exports = Actions;

Actions.prototype.createDatabase = function () {
    var self = this;
    var app = self.server;
    return Promise.resolve()
        .then(function () {
            self.serviceInstance.createDatabase()
        })
        .then(function (result) {
            return Promise.resolve(result);
        })
}

Actions.prototype.authenticate = async function (req) {
    var self = this;
    var tableName = self.conf.tables.login;
    req = req.body;
    var response = {
        status: false,
        message: ''
    }
    // console.log("req.body",req);

    if (falseValues.includes(req.name)) {
        // console.log("nooo name");
        response['message'] = 'user name is missing';
        return Promise.resolve(response);
    }

    if (falseValues.includes(req.password)) {
        // console.log("nooo password");
        response['message'] = 'password is missing';
        return Promise.resolve(response);
    }

    var password = await middleware.plainTextToEncryptHash(req.password);
    // console.log("password ",password);
    var criteria = {
        condition: `name = '${req.name}' AND password = '${password}'`,
        requiredFields: ['id', 'name']
    };

    return new Promise(function (resolve, reject) {

        self.serviceInstance.getEntities(tableName, criteria)
            .then(function (loginResult) {
                // console.log("loginResult",loginResult);
                if (loginResult && loginResult.status) {
                    var loginData = loginResult.data[0];
                    loginData['token'] = middleware.generateAccessToken(loginData);
                    loginResult['data'] = loginData;
                
                    self.serviceInstance.createEntities(self.conf.tables.loginHis,{adminId:loginData['id'],name:loginData['name']})
                    loginResult['message'] = `Welcome ${loginData['name']}`;
                    return loginResult;
                } else {
                    loginResult['message'] = "name or password is incorrect";
                    return loginResult;
                }
            })
            .then(function (finalResult) {
                resolve(finalResult);
            })
            .catch(function (err) {
                response['message'] = err;
                reject(response);
            })

    })

}

Actions.prototype.addNewEntry = async function (request) {
    var self = this;
    var tableName = self.conf.tables.allocSysIP;
    var req = request.body;
    var response = {
        status: false,
        message: ''
    };

    // console.log("req.body",req,request['user']);
    if (falseValues.includes(req.systemID)) {
        // console.log("nooo password");
        response['message'] = 'system ID is missing';
        return Promise.resolve(response);
    }
    req.systemID = req.systemID.toUpperCase().trim();

    if (falseValues.includes(req.systemIP)) {
        response['message'] = 'system IP is missing';
        return Promise.resolve(response);
    }

    if (!middleware.isValidIPFormat(req.systemIP)) {
        response['message'] = 'invalid IP is Address format';
        return Promise.resolve(response);
    }

 
    // if (req.hasOwnProperty('employeeId') && falseValues.includes(req.employeeId)) {
    //     // console.log("nooo name");
    //     response['message'] = 'employee ID is missing';
    //     return Promise.resolve(response);
    // }

    // if (falseValues.includes(req.employeeName)) {
    //     // console.log("nooo name");
    //     response['message'] = 'employee name is missing';
    //     return Promise.resolve(response);
    // }

    if (falseValues.includes(req.workLocationType)) {
        response['message'] = 'location type HOME/OFFICE is missing';
        return Promise.resolve(response);
    }

    var workLocation = req.workLocationType.toUpperCase().trim();
    if (workLocation!='HOME' && workLocation!="OFFICE") {

        response['message'] = 'location type should be HOME/OFFICE';
        return Promise.resolve(response);
    }

    var insertCriteria = {
        employeeId:!falseValues.includes(req.employeeId)?`${req.employeeId.toUpperCase().trim()}`:null,
        employeeName:!falseValues.includes(req.employeeName)?`${req.employeeName}`:null,
        systemID:`${req.systemID}`,
        systemIP:`${req.systemIP}`,
        isActive:parseInt(req.isActive)?1:0,
        workLocationType:`${workLocation}`,
        createdDate:middleware.getDate()
    };

  console.log("insertCriteria",insertCriteria);

    return new Promise(function (resolve, reject) {
        var findCriteria = {
            condition:`systemID = '${req.systemID}' OR systemIP = '${req.systemIP}'`
        };

        self.serviceInstance.getEntities(tableName, findCriteria)
        .then(function(findResult){
            if(findResult && findResult.status){
            //   console.log("req.systemID ==findResult['data'][0]['systemID']  ",req.systemID ==findResult['data'][0]['systemID'] )
               throw (req.systemID ==findResult['data'][0]['systemID'] ? `Entry Already Exist for System ID:  ${req.systemID}` :`Duplicate IP:  ${req.systemIP}`);
            }
                return self.serviceInstance.createEntities(tableName, insertCriteria)  
            
        })
            .then(function (entryResult) {
                console.log("entryResult",entryResult);
                if (entryResult && entryResult.status) {
                    
                    var entryHis = JSON.parse(JSON.stringify(insertCriteria));
                    entryHis['allocationEntryId'] = entryResult.data;
                    entryHis['adminId'] = request['user']['id'];
                    entryHis['action'] = "ADD";
                    self.serviceInstance.createEntities( self.conf.tables.allocSysIPHis,entryHis);

                    response['status'] = true;
                    response['message'] = 'Entry added successfully.'
                    return response;
                } else {
                    response['message'] = "Failed to add Entry";
                    return response;
                }
            })
            .then(function (finalResult) {
                resolve(finalResult);
            })
            .catch(function (err) {
                console.log(new Date()," Error at addNewEntry ",err);
                response['message'] = err;
                resolve(response);
            })

    })

}

Actions.prototype.updateExistEntry = async function (request) {
    var self = this;
    var tableName = self.conf.tables.allocSysIP;
    var req = request.body;
    var response = {
        status: false,
        message: ''
    };
    var updateCriteria = {
        condition : ``,
        set       : ``
    };
    var entryHisCriteria = {};

    if (falseValues.includes(req.allocationEntryId)) {
        response['message'] = 'Entry ID is missing';
        return Promise.resolve(response);
    }

    if (falseValues.includes(req.systemID)) {
        response['message'] = 'system ID is missing';
        return Promise.resolve(response);
    }
    req.systemID = req.systemID.toUpperCase().trim();

    if (falseValues.includes(req.systemIP)) {
        response['message'] = 'system IP is missing';
        return Promise.resolve(response);
    }

    return new Promise(function(resolve, reject) {

            var findCriteria = {
                condition:`allocationEntryId != ${req.allocationEntryId} AND ( systemID = '${req.systemID}' OR systemIP = '${req.systemIP}')`
            }
            
       self.serviceInstance.getEntities(tableName,findCriteria)
       .then(function(dbResult) {

        if(dbResult && dbResult.status){
            if(req.systemIP == dbResult.data[0]['systemIP']){
                throw (`Duplicate IP Entry`);
            }else{
                throw (`Duplicate system ID Entry `);
            }
        }else{
            var findCriteria1 = {
                condition:`allocationEntryId = ${req.allocationEntryId}`
            };
            return   self.serviceInstance.getEntities(tableName,findCriteria1)

        }

       })
        .then(function(dbResult) {
            console.log("dbResult ",dbResult);

            if(dbResult && !dbResult.status){
                throw (`No system found with ID  ${req.systemID}`);
            }
            entryHisCriteria['allocationEntryId'] = dbResult.data[0]['allocationEntryId'];

            updateCriteria['condition'] = `allocationEntryId = ${req.allocationEntryId}`;
            updateCriteria['set']       = `systemID = '${req.systemID}' `;

            entryHisCriteria['systemID'] = `${req.systemID}`;
            
           if (falseValues.includes(req.systemIP)) {
                throw('system IP is missing');
            }
    
            if (!middleware.isValidIPFormat(req.systemIP)) {
                throw('invalid IP is Address format');
            }
            
            if (falseValues.includes(req.workLocationType)) {
                throw('location type HOME/OFFICE is missing');
            }
            var workLocation = req.workLocationType.toUpperCase().trim();
            if (workLocation!='HOME' && workLocation!="OFFICE") {
                throw('location type should be HOME/OFFICE');
            }

            if (falseValues.includes(req.isActive)) {
                throw('is Active is missing');
            }
            
                updateCriteria['set']+= `,systemIP = '${req.systemIP}' `;
                entryHisCriteria['systemIP'] = `${req.systemIP}`;
                entryHisCriteria['adminId'] = request['user']['id'];
                
                if(!falseValues.includes(req.employeeId)){
                    updateCriteria['set']+=`,employeeId = '${req.employeeId.toUpperCase().trim()}'`;
                    entryHisCriteria['employeeId'] = `${req.employeeId.toUpperCase().trim()}`;
                }else{
                    updateCriteria['set']+= `,employeeId = ${null}`
                    entryHisCriteria['employeeId'] = null;
                }

                if(!falseValues.includes(req.employeeName)){
                    updateCriteria['set']+=`,employeeName = '${req.employeeName}'`;
                    entryHisCriteria['employeeName'] = `${req.employeeName}`;
                }else{
                    updateCriteria['set']+= `,employeeName = ${null}`
                    entryHisCriteria['employeeName'] = null;
                }


                updateCriteria['set']+= `,workLocationType = '${workLocation}' `;
                entryHisCriteria['workLocationType'] = `${workLocation}`;

                updateCriteria['set']+= `,isActive = ${Boolean(req.isActive)} `;
                entryHisCriteria['isActive'] = parseInt(req.isActive)?1:0;
                entryHisCriteria['action'] = 'EDIT';
                
                updateCriteria['set']+= `,updatedDate = '${middleware.getDate()}' `;

                return self.serviceInstance.updateEntities(tableName,updateCriteria)

        })
        .then(function(updateResult) {
            if(updateResult && updateResult.status){
                self.serviceInstance.createEntities(self.conf.tables.allocSysIPHis,entryHisCriteria);
                updateResult['message'] = 'Entry updated successfully';
            }else{
                updateResult['message'] = 'Failed to update Existing Entry';
            }

            return updateResult;
        })
        .then(function(finalResult) {
            resolve(finalResult);
        })
        .catch(function (err) {
            console.log(new Date()," Error at Update Entry ",err);
            response['message'] = err;
            resolve(response);
        })
    })

}

Actions.prototype.checkIsValidIP = async function (request) {
    var self = this;
    var tableName = self.conf.tables.allocSysIP;
    var req = request.body;
    var response = {
        status: false,
        message: ''
    };

    console.log("request.ip",request.ip);
    var systemIP =  request.ip.split(":").pop();
    systemIP = '192.168.0.2';
    console.log("req.ip.split", systemIP);
// return;
    return new Promise(function(resolve, reject) {

            var findCriteria = {
                condition:`systemIP = '${systemIP}'`
            }
            
       self.serviceInstance.getEntities(tableName,findCriteria)
        .then(function(dbResult) {
            console.log("dbResult ",dbResult);
           
            if(dbResult && dbResult.status){
                var entryHisCriteria = dbResult.data[0];
                if(dbResult.data[0]['isActive']){
                    response['status'] = true;
                    response['message'] = 'valid IP';
                    entryHisCriteria['action'] = 'KNOWN-IP,ACTIVE-STATE';
                }else{
                    response['status'] = false;
                    response['message'] = 'IP address is Deactivated.';
                    entryHisCriteria['action'] = 'KNOWN-IP,INACTIVE-STATE';
                }
                delete entryHisCriteria['createdDate'];
                delete entryHisCriteria['updatedDate'];

                entryHisCriteria['createdDate'] = middleware.getDate();
                // entryHisCriteria['adminId'] = null;
                
                
               
            }else{
                var entryHisCriteria = {
                    allocationEntryId:null,
                    employeeId:null,
                    employeeName:null,
                    adminId:null,
                    systemID:null,
                    systemIP:`${systemIP}`,
                    action:'UNKNOWN-IP',
                    workLocationType:null,
                    isActive:null,
                    createdDate:middleware.getDate()
                };
                response['status'] = false;
                response['message'] = 'invalid IP';
            }

            self.serviceInstance.createEntities(self.conf.tables.allocSysIPHis,entryHisCriteria);
            return response;
        })
        .then(function(finalResult) {
            resolve(finalResult);
        })
        .catch(function (err) {
            console.log(new Date()," Error at Update Entry ",err);
            response['message'] = err;
            resolve(response);
        })
    })

}
Actions.prototype.getEntry = function (request) {
    var self = this;
    var tableName = self.conf.tables.allocSysIP;
    var response = {
        status: false,
        message: ''
    };

    return new Promise(function(resolve, reject) {

        var criteria = {
            condition:``
        };
        
   self.serviceInstance.getEntities(tableName,criteria)
    .then(function(findResult) {
        if(findResult && findResult.status){
            findResult['message'] =`${findResult.data.length} Entry found.`;
        }else{
            findResult['message'] =`No Entry found.`
        }
        resolve(findResult)
    })
    .catch(function (err) {
        console.log(new Date()," Error at Get Entry ",err);
        response['message'] = err;
        resolve(response);
    })
})


}

Actions.prototype.deleteExistEntry = async function (request) {
    var self = this;
    var tableName = self.conf.tables.allocSysIP;
    var req = request.body;
    var response = {
        status: false,
        message: ''
    };
    var deleteCriteria = {};

    if(falseValues.includes(req.allocationEntryId) || !parseInt(req.allocationEntryId)){
        response['message'] = 'Entry ID is missing or Invalid Entry ID';
        return Promise.resolve(response);
    }

    return new Promise(function(resolve, reject) {

            var criteria = {
                condition:`allocationEntryId = ${parseInt(req.allocationEntryId)}`
            };
            
       self.serviceInstance.getEntities(tableName,criteria)
        .then(function(dbResult) {
           
            if(dbResult && !dbResult.status){
               throw('Entry not found'); 
            }
            console.log("dbResult",dbResult);
            deleteCriteria = dbResult['data'][0];
            delete deleteCriteria['createdDate'];
            delete deleteCriteria['updatedDate'];

            return self.serviceInstance.deleteEntities(tableName,criteria);
        })
        .then(function(deleteResult) {
            if(deleteResult && !deleteResult.status){
               throw('Failed to delete Entry'); 
            }

            response['status'] = true;
            response['message'] = 'Entry Deleted Successfully.';

            deleteCriteria['adminId'] = request['user']['id'];
            deleteCriteria['createdDate'] = middleware.getDate();
            deleteCriteria['action'] = 'DELETE';
            self.serviceInstance.createEntities(self.conf.tables.allocSysIPHis,deleteCriteria)
            return response;

        })
        .then(function(finalResult) {
            resolve(finalResult);
        })
        .catch(function (err) {
            console.log(new Date()," Error at Delete Entry ",err);
            response['message'] = err;
            resolve(response);
        })
    })

}