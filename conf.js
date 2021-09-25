
var conf = {
    bcrypt:{
        salt:'$2b$10$A4oIixtA7/QCvr.MxGLBYuOwi2cQYl6Hr/hLcQhxIK4GeYST28wL.', 
    },

    jsonwebtoken:{
        secret:'68fg4h654fg65hsdf16u4ehc4eb04b76478grd4cv1t6t3ydif4a4p65focnvopkop',
        expireIn:1800 //in seconds
   },

    server: {
        host: 'http://localhost',
        port: 3001
    },

    web:{
        url: 'http://localhost:4200',
    },

    db: {
        host: 'localhost',
        user: 'root',
        password: 'vps',
        database : 'mysql',
    },
    projectDatabase: 'ecommerce', 

    tables: {
        customer: 'customer',
        orderState:'order_state',
        product:'product',
        salesInvoice:'sales_invoice',
        salesInvoiceView:'sales_invoice_view',
    },
    query: {
        customer:{
            creation: `CREATE TABLE IF NOT EXISTS customer(
                customerId INT NOT NULL AUTO_INCREMENT,
                roleId INT NOT NULL DEFAULT 2,
                email VARCHAR(40) NOT NULL,
                customerName VARCHAR(40) NOT NULL,
                password VARCHAR(250) NOT NULL,
                createdTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updatedTime  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY ( customerId )
                );`,
            data:[
                {customerId:1,email:'admin@ecommerce.com',customerName:'admin',roleId:1,password:'$2b$10$A4oIixtA7/QCvr.MxGLBYuDMD65JclxFJQjwL9RDzqXKexNQUuy2a'} //password->admin
            ]
        },
         
        orderState:{
            creation: `CREATE TABLE IF NOT EXISTS order_state(
                orderStateId INT NOT NULL AUTO_INCREMENT,
                orderStateName VARCHAR(40) NOT NULL,
                PRIMARY KEY ( orderStateId )
                )`,
            data:[
                {orderStateId:1,orderStateName:'Order Placed'},
                {orderStateId:2,orderStateName:'Order Delivered'},
                {orderStateId:3,orderStateName:'Order Cancelled'},
            ]
         },
        product:{
            creation: `CREATE TABLE IF NOT EXISTS product(
                productId INT NOT NULL AUTO_INCREMENT,
                productName VARCHAR(100) NOT NULL,
                productDescription VARCHAR(256) NOT NULL,
                price DECIMAL NOT NULL,
                createdTime  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updatedTime  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY ( productId )
                );`,
            },
        salesInvoice:{
            creation:`CREATE TABLE IF NOT EXISTS sales_invoice(
                saleId BIGINT NOT NULL AUTO_INCREMENT,
                orderStateId INT NOT NULL,
                customerId INT NOT NULL,
                productId INT NOT NULL,
                price DECIMAL NOT NULL,
                createdTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, 
                updatedTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, 
                PRIMARY KEY ( saleId ),
                FOREIGN KEY(customerId) references customer(customerId),
                FOREIGN KEY(productId) REFERENCES product(productId),
                FOREIGN KEY(orderStateId) REFERENCES order_state(orderStateId)
                );`
        },
        salesInvoiceView:{
            creation:`
            CREATE OR REPLACE VIEW sales_invoice_view AS 
            SELECT sales_invoice.*, product.productName,customer.customerName, order_state.orderStateName 
            FROM sales_invoice
            INNER JOIN customer ON sales_invoice.customerId = customer.customerId
            
            INNER JOIN product ON sales_invoice.productId = product.productId            
            
            INNER JOIN order_state ON sales_invoice.orderStateId = order_state.orderStateId;
        `} 
                                        
    }
};


module.exports = conf;