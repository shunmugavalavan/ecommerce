
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
        brand:'brand',
        supplier:'supplier',
        product:'product',
        productView:'product_view',
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
                addess VARCHAR(250) NULL,
                createdTime VARCHAR(40) DEFAULT now(),
                updatedTime VARCHAR(40),
                PRIMARY KEY ( customerId )
                );`,
            data:[
                {customerId:1,email:'admin@ecommerce.com',customerName:'admin',roleId:1,password:'$2b$10$A4oIixtA7/QCvr.MxGLBYuDMD65JclxFJQjwL9RDzqXKexNQUuy2a'} //password->admin
            ]
        },
        orderState:{
            creation: `CREATE TABLE IF NOT EXISTS order_state(
                orderStateId INT NOT NULL AUTO_INCREMENT,
                stateName VARCHAR(40) NOT NULL,
                PRIMARY KEY ( orderStateId )
                )`,
            data:[
                {orderStateId:1,stateName:'placed'},
                {orderStateId:2,stateName:'delivered'},
                {orderStateId:3,stateName:'cancelled'},
            ]
         },
        brand:{
            creation: `CREATE TABLE IF NOT EXISTS brand(
                brandId INT NOT NULL AUTO_INCREMENT,
                brandName VARCHAR(50) NOT NULL,
                createdTime VARCHAR(40) DEFAULT now(),
                updatedTime VARCHAR(40) DEFAULT now(),
                PRIMARY KEY ( brandId )
                );`,
            data:[
                    {brandId:1,brandName:'samsung'},
                    {brandId:2,brandName:'oneplus'}
                ]  
        },

        supplier:{
            creation: `CREATE TABLE IF NOT EXISTS supplier(
                supplierId INT NOT NULL AUTO_INCREMENT,
                supplierName VARCHAR(50) NOT NULL,
                createdTime VARCHAR(40) DEFAULT now(),
                updatedTime VARCHAR(40) DEFAULT now(),
                PRIMARY KEY ( supplierId )
                );`,
             data:[
                {supplierId:1,supplierName:'Appario Retail'},
                {supplierId:2,supplierName:'MEDIMOPS'}
             ]  
            },

        product:{
            creation: `CREATE TABLE IF NOT EXISTS product(
                productId INT NOT NULL AUTO_INCREMENT,
                brandId INT NOT NULL,
                supplierId INT NOT NULL,
                productName VARCHAR(100) NOT NULL,
                price DECIMAL(6,2) NOT NULL,
                createdTime VARCHAR(40) DEFAULT now(),
                updatedTime VARCHAR(40) DEFAULT now(),
                PRIMARY KEY ( productId )
                );`,
            },
        productView:{
            creation: `CREATE VIEW  IF NOT EXISTS product_view AS 
            SELECT product.*,brand.brandName,supplier.supplierName
            
            FROM product
            
            INNER JOIN brand ON product.brandId = brand.brandId
            
            INNER JOIN supplier ON product.supplierId = supplier.supplierId;`,
                },      

        salesInvoice:{
            creation:`CREATE TABLE IF NOT EXISTS sales_invoice(
                saleId BIGINT NOT NULL AUTO_INCREMENT,
                orderStateId INT NOT NULL,
                customerId INT NOT NULL,
                productId INT NOT NULL,
                brandId INT NOT NULL,
                supplierId INT NOT NULL,
                price DECIMAL(6,2) NOT NULL,
                createdTime VARCHAR(40) DEFAULT now(), 
                PRIMARY KEY ( saleId ),
                FOREIGN KEY(customerId) references customer(customerId),
                FOREIGN KEY(productId) REFERENCES product(productId),
                FOREIGN KEY(brandId) references brand(brandId),
                FOREIGN KEY(supplierId) REFERENCES supplier(supplierId),
                FOREIGN KEY(orderStateId) REFERENCES order_state(orderStateId)
                );`
        },
        salesInvoiceView:{
            creation:`
            CREATE VIEW  IF NOT EXISTS sales_invoice_view AS 
            SELECT sales_invoice.*, product.productName,customer.customerName, order_state.stateName,brand.brandName,supplier.supplierName
            FROM sales_invoice
            INNER JOIN customer ON sales_invoice.customerId = customer.customerId
            
            INNER JOIN product ON sales_invoice.productId = product.productId
            
            INNER JOIN brand ON sales_invoice.brandId = brand.brandId
            
            INNER JOIN supplier ON sales_invoice.supplierId = supplier.supplierId
            
            INNER JOIN order_state ON sales_invoice.orderStateId = order_state.orderStateId;
        `} 
                                        
    }
};


module.exports = conf;