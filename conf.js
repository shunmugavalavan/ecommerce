// pass in text :  systemadmin@627853
const pass = '$2b$10$A4oIixtA7/QCvr.MxGLBYuqSbYz74JZ2P7WR69hFDmOHoAD8.U/Ey';
var conf = {

    bcrypt:{
        salt:'$2b$10$A4oIixtA7/QCvr.MxGLBYuOwi2cQYl6Hr/hLcQhxIK4GeYST28wL.', 
    },

    jsonwebtoken:{
        secret:'68fg4h654fg65hsdf16u4ehc4eb04b76478grd4cv1t6t3ydif4a4p65focnvopkop',
        expireIn:1800
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
    projectDatabase: 'hungarian_tool_administration', 

    tables: {
        login: 'admin_user',
        // adminInsertQuery:'admin_ins_query',
        loginHis: 'admin_user_login_history',
        allocSysIP: 'allocated_system_ip',
        allocSysIPHis: 'allocated_system_ip_history'
    },

    query: {
        login: `CREATE TABLE IF NOT EXISTS admin_user(
                id INT NOT NULL AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                password VARCHAR(250) NOT NULL,
                createdDate VARCHAR(40),
                updatedDate VARCHAR(40),
                PRIMARY KEY ( id )
                );
            `,
        adminInsertQuery:` INSERT INTO admin_user
                (name,password,createdDate,updatedDate) 
                 VALUES('tooladmin','${pass}',NOW(),NOW())`,

        loginHis: `CREATE TABLE IF NOT EXISTS admin_user_login_history(
                historyId INT NOT NULL AUTO_INCREMENT,
                adminId INT NOT NULL,
                name VARCHAR(100) NOT NULL,
                createdDate VARCHAR(40) DEFAULT now(),
                PRIMARY KEY ( historyId )
                );
            `,

        allocSysIP: `CREATE TABLE IF NOT EXISTS allocated_system_ip(
                allocationEntryId INT NOT NULL AUTO_INCREMENT,
                employeeId VARCHAR(30) DEFAULT NULL,
                employeeName VARCHAR(40) DEFAULT NULL,
                systemID VARCHAR(20) NOT NULL,
                systemIP VARCHAR(60) NOT NULL,
                workLocationType VARCHAR(20) DEFAULT NULL,
                isActive BOOLEAN,
                createdDate VARCHAR(40) DEFAULT now(),
                updatedDate VARCHAR(40) DEFAULT now(),
                PRIMARY KEY ( allocationEntryId )
                );
                `,
        allocSysIPHis: `CREATE TABLE IF NOT EXISTS allocated_system_ip_history(
                allocationEntryHisId BIGINT NOT NULL AUTO_INCREMENT,
                allocationEntryId INT DEFAULT NULL,
                employeeId VARCHAR(30) DEFAULT NULL,
                employeeName VARCHAR(60) DEFAULT NULL,
                systemID VARCHAR(20) DEFAULT NULL,
                systemIP VARCHAR(40) DEFAULT NULL,
                workLocationType VARCHAR(20) DEFAULT NULL,
                adminId INT DEFAULT NULL,
                isActive BOOLEAN,
                action VARCHAR(30),
                createdDate VARCHAR(40) DEFAULT now(), 
                PRIMARY KEY ( allocationEntryHisId )
                );
                    `
                                        
    }
};
module.exports = conf;