var Promise = require('bluebird');
var Services = function(app) {
   this.app = app;
   this.db = app.db;
   this.conf = app.conf;
};
module.exports = Services;

Services.prototype.createDatabase = function () {
    var self = this;
    var conf = self.conf;
    var db = self.db;
    return new Promise(function (resolve, reject) {
        db.queryAsync(`SHOW DATABASES LIKE '${conf.projectDatabase}'`)
            .then(function (results) {
                if (results && (results).toString() && (results).toString().length) {
                    console.log(`\n DB Already Exist : ${conf.projectDatabase}`);
                    return results;
                    // throw new Error("DB EXISTS");
                } else {
                    console.log(`\n Creating New Database  : ${conf.projectDatabase}`);
                    return db.queryAsync(`CREATE DATABASE ${conf.projectDatabase}`)
                }
            })
            .then(function () {
                return db.changeUserAsync({ database: conf.projectDatabase });
            })
            .then(function (results) {
                if (results && (results).toString() && (results).toString().length) {
                    var tableNames = Object.keys(conf["tables"])
                  //   console.log("tableNames ",tableNames);
                    Promise.mapSeries(tableNames, function(tableName, index, arrayLength) {
                    
                        var creationQuery = conf.query[tableName]['creation'];
                        // console.log(`\ncreating table ${tableName}  ${conf.query[tableName]}`);
                        return db.queryAsync(creationQuery).then(function(tableResult) {
                           // console.log(`\ntable ${tableName} created...`);
                           let DataArr = conf.query[tableName]['data']
                           if(DataArr && Array.isArray(DataArr) && DataArr.length){

                              return self.checkCount(conf["tables"][tableName])
                              .then(function(countRes){
                                 if(countRes.status){
                                    return countRes;
                                 }
                                 return Promise.mapSeries(DataArr, function(curData, index, arrayLength) {
                                    // console.log("curData",curData)
                                    var insertQuery = `INSERT INTO ${conf["tables"][tableName]}  SET ?`;
                                    var criteria =curData;
                                    return self.db.queryAsync(insertQuery, criteria)
                                 })
                              })
                           
                           }else{
                              // console.log("nothing to insert");
                              return tableResult;
                           }
                           
                            
                        });
                    }).then(function(result) {
                        console.log("\n All tables created Done!");
                        return result;
                    });
     
                } else {
                    return results
                }
            })
            .then(function (results) {
                resolve(results);
            })
           .catch(function(err){
            console.log('***************************************************************************************');
            console.warn(new Date() + ` [ERROR] - [DB]  => FAILED TO CREATE DATABASE : ${err}`);
            console.log('***************************************************************************************');
            reject(err);
            process.exit();
            });
        })
    }

Services.prototype.getEntities = function(table, criteria, about) {
   console.log("getEntities",table,criteria)
   var self = this;
   var response = {
      status: false,
      data:[]
   };
   var columns    = '*',
       condition  = '',
       sortOrder  = '',
       pagination = '';

   if(!table || !(Object.keys(criteria).length > 0)) {
      return Promise.resolve(response);
   }

   if(criteria && criteria.requiredFields && criteria.requiredFields.join(',')) {
      columns = criteria.requiredFields.join(',');
   }
   if(criteria && criteria.condition) {
      condition = ` WHERE ${criteria.condition} `;
   }
   if(criteria && criteria.sortOrder) {
      sortOrder = ` ${criteria.sortOrder} `;
   }
   if(criteria && criteria.pagination) {
      pagination = ` limit ${criteria.pagination.limit} offset ${criteria.pagination.offset}`;
   }

   var query = `SELECT ${columns} FROM ${table} ${condition} ${sortOrder} ${pagination}`;
   console.log("find query: ",query);
   console.log('\n--------------------------------------------------------------------------------------------------');
   console.log(new Date() + `    FINDING ${about ? about : ''} DATA at table : ${table} \nQuery : ${query}`);
   console.log('----------------------------------------------------------------------------------------------------\n');

   return new Promise(function(resolve, reject) {
      self.db.queryAsync(query)
          .then(function(result) {
            if(result && result.length) {
                console.log(new Date() + ` [INFO] - [DB]  DATA FOUND  AT : ${table} || COUNT : ${result.length}`);
                response.status = true;
                response.data = JSON.parse(JSON.stringify(result));
                resolve(response);
             }
             else {
                console.warn(new Date() + ` [NOTE] - [DB]  NO DATA FOUND AT : ${table} || CRITERIA : ${query}`);
                response.message = "no Data";
                resolve(response);
             }
          })
          .catch(function(err) {
             console.log('***************************************************************************************');
             console.warn(new Date() + ` [ERROR] - [DB]  => FAILED TO FIND DATA AT : ${table}\n CRITERIA IS: ${query}\n ERROR IS: ${err}`);
             console.log('***************************************************************************************');
             reject(err.message);
          });
   });
};

Services.prototype.updateEntities = function(table, criteria, about) {
   var self = this;
   var response = {
      status: false
   };

   var query = `UPDATE ${table} SET ${criteria.set} WHERE ${criteria.condition}`;
   console.log('\n--------------------------------------------------------------------------------------------------');
   console.log(new Date() + `    UPDATING ${about ? about : ''} DATA at table : ${table} \nQuery : ${query}`);
   console.log('----------------------------------------------------------------------------------------------------\n');

   return new Promise(function(resolve, reject) {
      self.db.queryAsync(query)
          .then(function(result) {
             // console.log("update Result --> ",result);
             if(result && result.changedRows && parseInt(result.changedRows) > 0) {
                console.log(new Date() + ` [INFO] - [DB]  DATA SUCCESSFULLY UPDATED AT : ${table}`);
                response.status = true;
                response.data = result;
                resolve(response);
             }
             else {
                console.warn(new Date() + ` [NOTE] - [DB]  NO DATA UPDATED AT : ${table}\n CRITERIA IS: ${JSON.stringify(criteria)}`);
                response.message = "Failed to Update..";
                resolve(response);
             }
          })
          .catch(function(err) {
             console.log('***************************************************************************************');
             console.warn(new Date() + ` [ERROR] - [DB]  => FAILED TO UPDATE DATA AT : ${table}\n CRITERIA IS: ${JSON.stringify(criteria)}\n ERROR IS: ${err}`);
             console.log('***************************************************************************************');
             reject(err.message);
          });
   });
};

Services.prototype.createEntities = function(table, criteria, about) {
   var self = this;
   var response = {
      status: false
   };

   var query = `INSERT INTO ${table}  SET ?`;
   console.log('\n--------------------------------------------------------------------------------------------------');
   console.log(new Date() + `    INSERTING ${about ? about : ''} DATA at table : ${table} \nFields : ${JSON.stringify(criteria)}`);
   console.log('----------------------------------------------------------------------------------------------------\n');

   return new Promise(function(resolve, reject) {
      self.db.queryAsync(query, criteria)
          .then(function(result) {
             if(result && result.affectedRows > 0) {
                console.log(new Date() + `  [INFO] - [DB]  DATA SUCCESSFULLY INSERTED AT : ${table} || InsertId: ${result.insertId}`);
                response.status = true;
                response.data = result.insertId;
                resolve(response);
             }
             else {
                console.warn(new Date() + `  [NOTE] - [DB]  NO DATA INSERTED AT : : ${table} || CRITERIA : ${query}`);
                response.message = "Failed to Insert Data";
                resolve(response);
             }
          })
          .catch(function(err) {
             console.log('***************************************************************************************');
             console.warn(new Date() + ` [ERROR] - [DB]  => => FAILED TO INSERT AT : ${table}\n CRITERIA IS: ${JSON.stringify(criteria)}\n ERROR IS: ${err}`);
             console.log('***************************************************************************************');
             reject(err.message);
          });
   });
};

Services.prototype.deleteEntities = function(table, criteria, about) {
   var self = this;
   var response = {
      status: false
   };
   var query = `DELETE FROM ${table} WHERE ${criteria.condition}`;
   console.log('\n--------------------------------------------------------------------------------------------------');
   console.log(new Date() + `    DELETING ${about ? about : ''} DATA \ntable    : ${table} \nQuery : ${query}`);
   console.log('----------------------------------------------------------------------------------------------------\n');

   return new Promise(function(resolve, reject) {
      self.db.queryAsync(query)
          .then(function(result) {
             // console.log("delete rec --> ",result);
             if(result && result.affectedRows && parseInt(result.affectedRows) > 0) {
                console.log(new Date() + ` [INFO] - [DB]  DATA SUCCESSFULLY DELETED AT : ${table} || deleted Rec(s): ${result.affectedRows} `);
                response.status = true;
                response.data = result;
                resolve(response);
             }
             else {
                console.warn(new Date() + ` [NOTE] - [DB]  NO DATA DELETED AT : ${table}\n CRITERIA IS: ${query} `);
                resolve(response);
             }
          })
          .catch(function(err) {
             console.log('***************************************************************************************');
             console.warn(new Date() + ` [ERROR] - [DB]  => FAILED TO UPDATE DATA AT : ${table}\n CRITERIA IS: ${query}\n ERROR IS: ${err}`);
             console.log('***************************************************************************************');
             reject(err.message);
          });
   });
};

Services.prototype.checkCount = function(table, criteria, about) {
   var self = this;
   var response = {
      status: false
   };

   var query = `SELECT count(*) as count FROM ${table}`;

   if(criteria && criteria.condition) {
      query += ` WHERE ${criteria.condition}`;
   }

   // console.log('\n--------------------------------------------------------------------------------------------------');
   // console.log(new Date() + `    CHECKING ${about ? about : ''} COUNT at table : ${table} \nQuery : ${query}`);
   // console.log('----------------------------------------------------------------------------------------------------\n');

   return new Promise(function(resolve, reject) {
      self.db.queryAsync(query)
          .then(function(result) {
             // console.log(" COUNT result --> ",result[0]['count']);
             // console.log(" COUNT JSON result --> ",JSON.stringify(result[0]));
             if(result && result[0] && (result[0]['count']) > 0) {
                console.log(new Date() + ` [INFO] - [DB]  DATA FOUND  AT : ${table} || COUNT : ${result[0]['count']}`);
                response.status = true;
                response.data = result[0]['count'];
                resolve(response);
             }
             else {
                console.warn(new Date() + ` [NOTE] - [DB]  NO DATA FOUND AT : ${table} || count: ${(result[0]['count'])} || CRITERIA : ${query}`);
                resolve(response);
             }
          })
          .catch(function(err) {
             console.log('***************************************************************************************');
             console.warn(new Date() + ` [ERROR] - [DB]  => FAILED TO FIND DATA AT : ${table}\n CRITERIA IS: ${JSON.stringify(criteria)}\n ERROR IS: ${err}`);
             console.log('***************************************************************************************');
             reject(err.message);
          });
   });
};

Services.prototype.customQuery = function(query, about) {
   var self = this;
   var response = {
      status: false
   };
   console.log('\n--------------------------------------------------------------------------------------------------');
   console.log(new Date() + `    CUSTOM QUERY OPERATION \nQuery : ${query}`);
   console.log('----------------------------------------------------------------------------------------------------\n');

   return new Promise(function(resolve, reject) {
      self.db.queryAsync(query)
          .then(function(result) {
             console.log('CUSTOM QUERY res --> ', result);
             if(result && result.length) {
                console.log(new Date() + ` [INFO] - [DB]  CUSTOM QUERY SUCCESS `);
                response.status = true;
                response.data = JSON.parse(JSON.stringify(result));
                resolve(response);
             }
             else {
                console.warn(new Date() + ` [NOTE] - [DB]  CUSTOM QUERY FAILED \n CRITERIA IS: ${query} `);
                resolve(response);
             }
          })
          .catch(function(err) {
             console.log('***************************************************************************************');
             console.warn(new Date() + ` [ERROR] - [DB]  => FAILED TO EXECUTE QUERY : ${query}\n ERROR IS: ${err}`);
             console.log('***************************************************************************************');
             reject(err.message);
          });
   });
};
