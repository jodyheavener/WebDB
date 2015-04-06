/**
 * Retrieves a table from the database
 */

WebDB.prototype._getTable = function() {

  let id = this.database._identifyTransaction();

  this.database._transaction({
    id: id,
    statement: `SELECT * FROM ${this.tableName}`
  });

  this.database._done(id, function(status, transaction, result){
    if (status == "error")
      return console.error(`Could not retrieve table ${this.tableNam} from database`, result);

    if (status == "success")
      return console.log("yay", result);
  });

};

WebDB.prototype.getTable = function(name) {
  return this._getTable.bind({tableName: name, database: this}).call();
};
