"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var WebDB = (function () {
  var _class = function WebDB(configuration) {
    _classCallCheck(this, _class);

    var dbcon = {
      name: undefined,
      version: "1.0",
      description: "",
      initialize: function initialize() {
        console.info("New Database Created");
      }
    };

    switch (typeof configuration) {
      case "undefined":
        return console.error("WebDB instance requires configuration");
      case "string":
        this.databaseName = dbcon.name = configuration;
        break;
      case "object":
        if (!configuration.name) {
          return console.error("WebDB instance requires `name` configuration");
        }this.databaseName = dbcon.name = configuration.name;
        if (configuration.version) dbcon.version = configuration.version;
        if (configuration.description) dbcon.description = configuration.description;
        if (configuration.initialize) dbcon.initialize = configuration.initialize;
        break;
    };

    this.database = openDatabase(dbcon.name, dbcon.version, dbcon.description, 2 * 1024 * 1024, dbcon.initialize);

    this._transactions = {};
    this._transactionIdentifier = 0;

    this._getTables();
  };

  _createClass(_class, {
    getName: {
      value: function getName() {
        return this.databaseName;
      }
    },
    _identifyTransaction: {
      value: function _identifyTransaction() {
        return this._transactionIdentifier = this._transactionIdentifier + 1;
      }
    },
    _transaction: {
      value: function _transaction(txConfig) {
        var _this = this;

        this.database.transaction(function (transaction) {

          transaction.executeSql(txConfig.statement, [], function (transaction, result) {
            _this._transactions[txConfig.id].apply(_this, ["success", transaction, result]);
          }, function (transaction, result) {
            _this._transactions[txConfig.id].apply(_this, ["error", transaction, result]);
          });
        });
      }
    },
    _done: {
      value: function _done(id, callback) {
        this._transactions[id] = callback;
      }
    },
    _getTables: {
      value: function _getTables() {
        var id = this._identifyTransaction();

        this._transaction({
          id: id,
          statement: "SELECT tbl_name, sql from sqlite_master WHERE type='table'"
        });

        this._done(id, function (status, transaction, result) {
          if (status == "fail") return console.error("Could not retrieve existing tables from database", result);

          var tables = result.rows;
          var tableCount = 0;
          while (tableCount < tables.length) {
            var table = tables.item(tableCount);
            var _name = table.tbl_name;
            if (_name !== "__WebKitDatabaseInfoTable__" && !this[_name]) this[_name] = this._getTable.bind({ tableName: _name, database: this });
            tableCount = tableCount + 1;
          }
        });
      }
    }
  });

  return _class;
})();

/**
 * Creates a new Table
 * *name          | String          | Name of table to creater
 * *configuration | Object          | Table configuration
 *    overwrite   | Boolean (false) | Should overwrite table if it exists
 *    autoIndexID | Boolean (true)  | Automatically create a primary key _id column
 *   *columns     | Object          | Key value pairs of column name and types
 *      Name of column | String : SQL qualified type value | String
 */

WebDB.prototype.createTable = function (name, configuration) {
  var _this = this;

  var createTable = function () {

    if (configuration.columns == null) return console.error("WebDB.createTable requires `configuration.columns` configuration");

    var columns = [];
    Object.keys(configuration.columns).forEach(function (key) {
      columns.push("" + key + " " + configuration.columns[key].toUpperCase());
    });

    if (configuration.autoIndexID && configuration.autoIndexID !== false) columns.push("_id INTEGER PRIMARY KEY");

    var txConfig = {
      id: _this._identifyTransaction(),
      statement: "\n        CREATE TABLE IF NOT EXISTS\n        " + name + "\n        (" + columns.join(",") + ")\n      "
    };

    txConfig.statement = txConfig.statement.replace(/\n/g, " ") // Replace line breaks with spaces
    .replace(/\s{2,}/g, " ") // Replace multiple spaces with single space
    .replace(/^ | $/g, ""); // Remove first and last space in query

    _this._transaction(txConfig);

    _this._done(txConfig.id, function (status, transaction, result) {
      if (status === "error" && configuration.error != null) return configuration.error(result);

      if (status === "success") {
        _this._getTables();
        if (configuration.success != null) configuration.success(result);
        return _this.getTable(name);
      }
    });
  };

  if (configuration.overwrite) {
    var id = this._identifyTransaction();

    this._transaction({
      id: id,
      statement: "DROP TABLE IF EXISTS ${name}"
    });

    this._done(dropID, createTable);
  } else {
    createTable();
  };
};

/**
 * Retrieves a table from the database
 */

WebDB.prototype._getTable = function () {

  var id = this.database._identifyTransaction();

  this.database._transaction({
    id: id,
    statement: "SELECT * FROM " + this.tableName
  });

  this.database._done(id, function (status, transaction, result) {
    if (status == "error") return console.error("Could not retrieve table " + this.tableNam + " from database", result);

    if (status == "success") return console.log("yay", result);
  });
};

WebDB.prototype.getTable = function (name) {
  return this._getTable.bind({ tableName: name, database: this }).call();
};