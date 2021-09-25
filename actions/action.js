var Promise = require('bluebird');
const fs = require('fs');
const csv = require('fast-csv');
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

Actions.prototype.validateEmail = function (email) {
    // console.log("validateEmail ",email);
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

Actions.prototype.register = async function (req) {
    var self = this;
    var tableName = self.conf.tables.customer;
    req = req.body;
    var response = {
        status: false,
        message: ''
    }
    // console.log("req.body",req);

    if (falseValues.includes(req.customerName)) {
        // console.log("nooo name");
        response['message'] = 'customer name is missing';
        return Promise.resolve(response);
    }

    if (falseValues.includes(req.email)) {
        // console.log("nooo name");
        response['message'] = 'email is missing';
        return Promise.resolve(response);
    }

    if (!self.validateEmail(req.email)) {
        // console.log("nooo name");
        response['message'] = 'invalid email format';
        return Promise.resolve(response);
    }

    if (falseValues.includes(req.password)) {
        // console.log("nooo password");
        response['message'] = 'password is missing';
        return Promise.resolve(response);
    }
    var encryptedPassword = await middleware.plainTextToEncryptHash(req.password);
    var criteria = {
        condition: `email = '${req.email}'`,
        requiredFields: ['email']
    };

    return new Promise(function (resolve, reject) {

        self.serviceInstance.getEntities(tableName, criteria)
            .then(function (loginResult) {
                // console.log("loginResult", loginResult);

                if (loginResult && loginResult.status) {
                    response['message'] = 'email already exist'
                    throw new Error('manual rejection');
                }
                let insertCriteria = {
                    customerName: req.customerName,
                    email: req.email,
                    roleId: 2,
                    password: encryptedPassword
                }
                return self.serviceInstance.createEntities(tableName, insertCriteria);

            })
            .then(function (finalResult) {
                response['status'] = true;
                response['message'] = 'account created...';
                response['data'] = {
                    roleId: 2,
                    customerName: req.customerName,
                    email: req.email
                };
                resolve(response);
            })
            .catch(function (err) {
                if (err.message == 'manual rejection') {
                    resolve(response)
                } else {
                    response['message'] = err;
                    reject(response);
                }

            })

    })

}

Actions.prototype.login = async function (req) {
    var self = this;
    var tableName = self.conf.tables.customer;
    req = req.body;
    var response = {
        status: false,
        message: ''
    }
    // console.log("req.body",req);

    if (falseValues.includes(req.email)) {
        // console.log("nooo name");
        response['message'] = 'email is missing';
        return Promise.resolve(response);
    }

    if (!self.validateEmail(req.email)) {
        // console.log("nooo name");
        response['message'] = 'invalid email format';
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
        condition: `email = '${req.email}' AND password = '${password}'`,
        requiredFields: ['customerId', 'customerName', 'email', 'roleId']
    };

    return new Promise(function (resolve, reject) {

        return self.serviceInstance.getEntities(tableName, criteria)
            .then(function (loginResult) {
                // console.log("loginResult", loginResult);
                if (loginResult && loginResult.status) {
                    var loginData = loginResult.data[0];
                    loginData['token'] = middleware.generateAccessToken(loginData);
                    loginResult['data'] = loginData;

                    // self.serviceInstance.createEntities(self.conf.tables.loginHis,{adminId:loginData['id'],name:loginData['name']})
                    loginResult['message'] = `Welcome, ${loginData['customerName']}`;
                    return loginResult;
                } else {
                    loginResult['message'] = "email or password is incorrect";
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

Actions.prototype.uploadProducts = async function (req,filePath) {
    var self = this;
    var tableName = self.conf.tables.product;
    var response = {
        status: false,
        message: ''
    };
    if(parseInt(req.user.roleId)!=1){
           response['message'] = 'You are not Authorized to Upload product ';
           return Promise.resolve(response);
    }

    let stream = fs.createReadStream(filePath);
    let csvData = [];
    let insertCriteria = {
        columns: ['productName', 'productDescription', 'price'],
        data: csvData
    };

    return new Promise(function (resolve, reject) {
        let csvStream = csv
            .parse()
            .on("data", function (data) {
                csvData.push(data);
            })
            .on("end", function () {
                // Remove Header ROW
                csvData.shift();
                self.serviceInstance.bulkUpload(tableName, insertCriteria)
                    .then(function (uploadResult) {
                        if (uploadResult && uploadResult.status) {
                            response['status'] = true;
                            response['message'] = `${uploadResult.data} products Uploaded successfully.`;
                            console.log(response['message']);
                            return response;
                        } else {
                            console.log("Failed to add products");
                            response['message'] = "Failed to Upload product";
                            return response;
                        }
                    }).then(function (finalResult) {
                        resolve(finalResult);
                    }).catch(function (err) {
                        console.log(new Date(), " Error at Upload products ", err);
                        response['message'] = err;
                        resolve(response);
                    })

                // delete file after saving to MySQL database
                // -> you can comment the statement to see the uploaded CSV file.
                fs.unlinkSync(filePath)
            });

        stream.pipe(csvStream);
    })

}

Actions.prototype.getProducts = function (request) {
    var self = this;
    var tableName = self.conf.tables.product;
    var response = {
        status: false,
        message: ''
    };
    console.log("\n" + new Date() + " Getting products ");
    return new Promise(function (resolve, reject) {

        var criteria = {
            condition: ``
        };

        self.serviceInstance.getEntities(tableName, criteria)
            .then(function (findResult) {
                if (findResult && findResult.status) {
                    console.log("\n Products Found");
                    findResult['message'] = `${findResult.data.length} Products found.`;
                } else {
                    console.log("\n No Products Found");
                    findResult['message'] = `No Products found.`
                }
                resolve(findResult)
            })
            .catch(function (err) {
                console.log(new Date(), " Error at Get Products ", err);
                response['message'] = err;
                resolve(response);
            })
    })
}

Actions.prototype.updateProduct = async function (request) {
    var self = this;
    var tableName = self.conf.tables.product;
    var req = request.body;
    var response = {
        status: false,
        message: ''
    };
    var updateCriteria = {
        condition: '',
        set: []
    };

    if (falseValues.includes(req.productId)) {
        response['message'] = 'productId is missing';
        return Promise.resolve(response);
    } else if (!parseInt(req.productId)) {
        response['message'] = 'Invalid product ID ';
        return Promise.resolve(response);
    }
    updateCriteria['condition'] = `productId = ${parseInt(req.productId)}`;
    
    if (req.hasOwnProperty('productName')) {
        if (falseValues.includes(req.productName)) {
            response['message'] = 'Product name is missing';
            return Promise.resolve(response);
        }
        updateCriteria['set'].push(`productName = '${req.productName}'`)
    }

    if (req.hasOwnProperty('price')) {
        if (falseValues.includes(req.price)) {
            response['message'] = 'price is missing';
            return Promise.resolve(response);
        } else if (parseFloat(req.price) <= 0) {
            response['message'] = 'Invalid price ';
            return Promise.resolve(response);
        }
        updateCriteria['set'].push(`price = '${req.price}'`)
    }

    if(!updateCriteria['set'].length){
        response['message'] = 'Nothing to Update...';
        return Promise.resolve(response);
    }
    updateCriteria['set'] = updateCriteria['set'].join(", ");

    return new Promise(function (resolve, reject) {

        var findCriteria = {
            condition: `productId = ${parseInt(req.productId)}`
        };

        self.serviceInstance.getEntities(tableName, findCriteria)
            .then(function (dbResult) {
                if (dbResult && !dbResult.status) {
                    console.log("\n Product Not Found ");
                    throw (`Product Not Found `);
                }
                console.log("\n Product found & Ready to Update ");
                return self.serviceInstance.updateEntities(tableName, updateCriteria)
            })
            .then(function (updateResult) {
                if (updateResult && updateResult.status) {
                    console.log("Product updated successfully");
                    updateResult['message'] = 'Product updated successfully';
                } else {
                    console.log("Failed to update Product..");
                    updateResult['message'] = 'Failed to update Product ';
                }

                return updateResult;
            })
            .then(function (finalResult) {
                resolve(finalResult);
            })
            .catch(function (err) {
                console.log(new Date(), " Error at Update Product ", err);
                response['message'] = err;
                resolve(response);
            })
    })

}

Actions.prototype.placeOrder = async function (request) {
    var self = this;
    var customerTableName = self.conf.tables.customer;
    var productTableName = self.conf.tables.product;
    var salesTableName = self.conf.tables.salesInvoice;
    var req = request.body;
    var response = {
        status: false,
        message: ''
    };

    if (falseValues.includes(req.customerId)) {
        // console.log("nooo password");
        response['message'] = 'customerId is missing';
        return Promise.resolve(response);
    } else if (!parseInt(req.customerId)) {
        response['message'] = 'Invalid customer ID ';
        return Promise.resolve(response);
    }

    if (falseValues.includes(req.productId)) {
        // console.log("nooo password");
        response['message'] = 'productId is missing';
        return Promise.resolve(response);
    } else if (!parseInt(req.productId)) {
        response['message'] = 'Invalid product ID ';
        return Promise.resolve(response);
    }
    
    return new Promise(function (resolve, reject) {
        let customerFindCriteria={
            condition:`customerId = ${parseInt(req.customerId)}`
        };

        self.serviceInstance.getEntities(customerTableName, customerFindCriteria)
        .then(function (findResult) {
            if (findResult && !findResult.status) {
                console.log("\n Customer Not Found ");
                throw (`Customer Not Found `);
            }   
            let findCriteria={
                condition:`productId = ${parseInt(req.productId)}`
            }
            return  self.serviceInstance.getEntities(productTableName, findCriteria)
        })
        .then(function (findResult) {
            if (findResult && !findResult.status) {
                console.log("\n Product Not Found ");
                throw (`Product Not Found `);
            }   
            let insertCriteria = {
                productId: parseInt(req.productId),
                customerId: parseInt(req.customerId),
                orderStateId: 1,
                price: parseFloat(findResult['data'][0].price).toFixed(2)
            };
            return  self.serviceInstance.createEntities(salesTableName, insertCriteria)
        })
        .then(function (entryResult) {

                if (entryResult && entryResult.status) {
                    console.log("new Order added Successfully..");

                    response['status'] = true;
                    response['orderId'] = entryResult.data;
                    response['message'] = 'Order added successfully.'
                    return response;
                } else {
                    console.log("Failed to add Order");
                    response['message'] = "Failed to Order";
                    return response;
                }
            })
            .then(function (finalResult) {
                resolve(finalResult);
            })
            .catch(function (err) {
                console.log(new Date(), " Error at add new Order ", err);
                response['message'] = err;
                resolve(response);
            })

    })

}

Actions.prototype.getMyOrder = function (request) {
    var self = this;
    var tableName = self.conf.tables.salesInvoiceView;
    var response = {
        status: false,
        message: ''
    };
    let customerId = request.customerId;

    console.log("\n" + new Date() + " Getting My Orders ");
    return new Promise(function (resolve, reject) {

        var findCriteria = {
            condition: `customerId = ${parseInt(customerId)}`
        };

        self.serviceInstance.getEntities(tableName, findCriteria)
            .then(function (findResult) {
                if (findResult && findResult.status) {
                    console.log("\n Orders Found");
                    findResult['message'] = `${findResult.data.length} Orders found.`;
                } else {
                    console.log("\n No Orders Found");
                    findResult['message'] = `No Orders found.`
                }
                resolve(findResult)
            })
            .catch(function (err) {
                console.log(new Date(), " Error at Get Orders ", err);
                response['message'] = err;
                resolve(response);
            })
    })
}

Actions.prototype.cancelOrder = async function (request) {
    var self = this;
    var tableName = self.conf.tables.salesInvoice;
    var req = request.body;
    var response = {
        status: false,
        message: ''
    };
    var updateCriteria = {};
    if (falseValues.includes(req.saleId)) {
        // console.log("nooo password");
        response['message'] = 'sale ID is missing';
        return Promise.resolve(response);
    } else if (!parseInt(req.saleId)) {
        response['message'] = 'Invalid sale ID ';
        return Promise.resolve(response);
    }


    return new Promise(function (resolve, reject) {

        var findCriteria = {
            condition: `saleId = ${parseInt(req.saleId)} AND customerId= ${parseInt(request.customerId)}`
        };

        console.log("\n Checking for Order");

        self.serviceInstance.getEntities(tableName, findCriteria)
            .then(function (dbResult) {

                if (dbResult && !dbResult.status) {
                    console.log("\n Order not Found ");
                    throw (`Order Not Found `);
                }

                if(parseInt(dbResult.data[0].orderStateId)!=1){
                    console.log("\n Can not Cancel Order");
                    throw (`Can not Cancel Order `);
                }


                let cancelStateId = 3;

                console.log("\n Product Ready to Cancel ");

                updateCriteria['condition'] = `saleId = ${parseInt(req.saleId)}`;
                updateCriteria['set'] = `orderStateId = ${cancelStateId} `;

                return self.serviceInstance.updateEntities(tableName, updateCriteria)
            })
            .then(function (updateResult) {
                if (updateResult && updateResult.status) {
                    console.log("Order Cancelled successfully");
                    updateResult['message'] = 'Order Cancelled successfully';
                } else {
                    console.log("Failed to Order Cancel Order..");
                    updateResult['message'] = 'Failed to Order Cancel Order ';
                }

                return updateResult;
            })
            .then(function (finalResult) {
                resolve(finalResult);
            })
            .catch(function (err) {
                console.log(new Date(), " Error at Cancel Order ", err);
                response['message'] = err;
                resolve(response);
            })
    })

}

Actions.prototype.getAllOrder = function (req) {
    var self = this;
    var tableName = self.conf.tables.salesInvoiceView;
    var response = {
        status: false,
        message: ''
    };

    if(parseInt(req.user.roleId)!=1){
        response['message'] = 'You are not Authorized to View All Orders ';
        return Promise.resolve(response);
 }
    console.log("\n" + new Date() + " Getting All Orders ");
    return new Promise(function (resolve, reject) {
        var findCriteria = {
            condition: `` //orderStateId = 1
        };

        self.serviceInstance.getEntities(tableName, findCriteria)
            .then(function (findResult) {
                if (findResult && findResult.status) {
                    console.log("\n Orders Found");
                    findResult['message'] = `${findResult.data.length} Orders found.`;
                } else {
                    console.log("\n No Orders Found");
                    findResult['message'] = `No Orders found.`
                }
                resolve(findResult)
            })
            .catch(function (err) {
                console.log(new Date(), " Error at Get Orders ", err);
                response['message'] = err;
                resolve(response);
            })
    })
}

Actions.prototype.orderDelivered = async function (request) {
    var self = this;
    var tableName = self.conf.tables.salesInvoice;
    var req = request.body;
    var response = {
        status: false,
        message: ''
    };
    var updateCriteria = {};

    if(parseInt(request.user.roleId)!=1){
        response['message'] = 'You are not Authorized to View Deliver Order';
        return Promise.resolve(response);
 }

    if (falseValues.includes(req.saleId)) {
        // console.log("nooo password");
        response['message'] = 'sale ID is missing';
        return Promise.resolve(response);
    } else if (!parseInt(req.saleId)) {
        response['message'] = 'Invalid sale ID ';
        return Promise.resolve(response);
    }

    return new Promise(function (resolve, reject) {

        var findCriteria = {
            condition: `saleId = ${parseInt(req.saleId)} `
        };

        console.log("\n Checking for Order");

        self.serviceInstance.getEntities(tableName, findCriteria)
            .then(function (dbResult) {

                if (dbResult && !dbResult.status) {
                    console.log("\n Order not Found ");
                    throw (`Order Not Found `);
                }

                if(parseInt(dbResult.data[0].orderStateId)!=1){
                    console.log("\n Can not Deliver Order");
                    throw (`Can not Deliver Order `);
                }

                let deliverStateId = 2;

                console.log("\n Product Ready to Delivered ");

                updateCriteria['condition'] = `saleId = ${parseInt(req.saleId)}`;
                updateCriteria['set'] = `orderStateId = '${deliverStateId}' `;

                return self.serviceInstance.updateEntities(tableName, updateCriteria)
            })
            .then(function (updateResult) {
                if (updateResult && updateResult.status) {
                    console.log("Order Delivered successfully");
                    updateResult['message'] = 'Order Delivered successfully';
                } else {
                    console.log("Failed to Order Deliver Order..");
                    updateResult['message'] = 'Failed to Deliver Order ';
                }

                return updateResult;
            })
            .then(function (finalResult) {
                resolve(finalResult);
            })
            .catch(function (err) {
                console.log(new Date(), " Error at Deliver Order ", err);
                response['message'] = err;
                resolve(response);
            })
    })

}
