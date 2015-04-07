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

    this.getTables();

    return this.ready = true;
  };

  _createClass(_class, {
    getName: {
      value: function getName() {
        return this.databaseName;
      }
    },
    getTables: {
      value: function getTables() {
        var _this = this;

        var id = this.identifyTransaction();

        this.transaction({
          id: id,
          statement: "SELECT tbl_name, sql from sqlite_master WHERE type='table'"
        });

        this.done(id, function (status, transaction, result) {
          if (status === "error") return console.error("Could not retrieve existing tables from database", result);

          var tables = result.rows;
          var tableCount = 0;
          while (tableCount < tables.length) {
            var table = tables.item(tableCount);
            var _name = table.tbl_name;

            if (_name !== "__WebKitDatabaseInfoTable__" && !_this[_name]) _this[_name] = new WebDB.dbTable(_this, _name);

            tableCount = tableCount + 1;
          };
        });

        return this;
      }
    },
    createTable: {
      value: function createTable(name, configuration) {
        var _this = this;

        var createTable = function () {

          if (configuration.columns == null) return console.error("WebDB.createTable requires `configuration.columns` configuration");

          var columns = [];
          Object.keys(configuration.columns).forEach(function (key) {
            columns.push("" + key + " " + configuration.columns[key].toUpperCase());
          });

          if (configuration.autoIndexID && configuration.autoIndexID !== false) columns.push("_id INTEGER PRIMARY KEY");

          var txConfig = {
            id: _this.identifyTransaction(),
            statement: "\n          CREATE TABLE IF NOT EXISTS\n          " + name + "\n          (" + columns.join(",") + ")\n        "
          };

          txConfig.statement = txConfig.statement.replace(/\n/g, " ") // Replace line breaks with spaces
          .replace(/\s{2,}/g, " ") // Replace multiple spaces with single space
          .replace(/^ | $/g, ""); // Remove first and last space in query

          _this.transaction(txConfig);

          _this.done(txConfig.id, function (status, transaction, result) {
            if (status === "error" && configuration.error != null) return configuration.error(result);

            if (status === "success") {
              _this.getTables();
              if (configuration.success != null) configuration.success(result);
              return _this[name];
            };
          });
        };

        if (configuration.overwrite) {
          var id = this.identifyTransaction();

          this.transaction({
            id: id,
            statement: "DROP TABLE IF EXISTS ${name}"
          });

          this.done(dropID, createTable);
        } else {
          createTable();
        };
      }
    }
  });

  return _class;
})();

WebDB.prototype.transactions = {};

WebDB.prototype.transactionIdentifier = 0;

WebDB.prototype.identifyTransaction = function () {
  return this.transactionIdentifier = this.transactionIdentifier + 1;
};

WebDB.prototype.transaction = function (txConfig) {
  var _this = this;

  this.database.transaction(function (transaction) {

    transaction.executeSql(txConfig.statement, [], function (transaction, result) {
      _this.transactions[txConfig.id].apply(_this, ["success", transaction, result]);
    }, function (transaction, result) {
      _this.transactions[txConfig.id].apply(_this, ["error", transaction, result]);
    });
  });

  return this;
};

WebDB.prototype.done = function (id, callback) {
  return this.transactions[id] = callback;
};

WebDB.dbRow = (function () {
  var _class2 = function (database, row) {
    _classCallCheck(this, _class2);

    this.database = database;

    return { row: "yes" };
  };

  return _class2;
})();

WebDB.dbTable = (function () {
  var _class3 = function (database, tableName) {
    var _this = this;

    _classCallCheck(this, _class3);

    this.database = database;
    this.tableName = tableName;

    this.rows = [];

    // Retrieve all rows in the table
    var selectID = this.database.identifyTransaction();

    this.database.transaction({
      id: selectID,
      statement: "SELECT * from " + this.tableName
    });

    this.database.done(selectID, function (status, transaction, result) {
      if (status === "error") return console.error("Could not retrieve rows for table " + _this.tableName, result);

      var rows = result.rows;
      var rowCount = 0;
      while (rowCount < rows.length) {
        var row = rows.item(rowCount);

        _this.rows.push(new WebDB.dbRow(_this.database, row));

        rowCount = rowCount + 1;
      };
    });

    return this;
  };

  _createClass(_class3, {
    count: {
      value: function count() {
        return this.rows.length;
      }
    },
    drop: {
      value: function drop() {
        var _this = this;

        var dropID = this.database.identifyTransaction();

        this.database.transaction({
          id: dropID,
          statement: "DROP TABLE " + this.tableName
        });

        this.database.done(dropID, function (status, transaction, result) {
          if (status === "error") return console.error("Could not drop table " + _this.tableName, result);

          return delete _this.database[_this.tableName];
        });
      }
    },
    insert: {

      /* rowName can also be an object with {rowName: configuration} */

      value: function insert(rowName, configuration) {
        var rowItems = {};

        if (typeof rowName === "string" && configuration != null) {
          rowItems[rowName] = configuration;
        } else if (typeof rowName === "object") {
          rowItems = rowName;
        };

        console.log(rowItems);
      }
    },
    remove: {
      value: function remove(query, justOne) {}
    }
  });

  return _class3;
})();