"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var WebDB = (function () {
  var _class = function WebDB(configuration) {
    var _this = this;

    _classCallCheck(this, _class);

    var dbConfiguration = {
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
        this.databaseName = dbConfiguration.name = configuration;
        break;
      case "object":
        if (!configuration.name) {
          return console.error("WebDB instance requires `name` configuration");
        }this.databaseName = dbConfiguration.name = configuration.name;
        if (configuration.version) dbConfiguration.version = configuration.version;
        if (configuration.description) dbConfiguration.description = configuration.description;
        if (configuration.initialize) dbConfiguration.initialize = configuration.initialize;
        break;
    };

    this.database = openDatabase(dbConfiguration.name, dbConfiguration.version, dbConfiguration.description, 2 * 1024 * 1024, dbConfiguration.initialize);

    this.getTables();

    // How do I make this work????!?!?!
    setTimeout(function () {
      _this.trigger("ready");
    }, 0);

    return this;
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

        var transactionArgs = {
          id: this.identifyTransaction(),
          statement: this.sanitizeStatement("\n        SELECT tbl_name, sql\n        FROM sqlite_master\n        WHERE type='table'\n      ")
        };

        this.transaction(transactionArgs);

        this.on(transactionArgs.id, function (data) {
          if (data.status === "error") return console.error("Couldn't retrieve tables from database", data.result);

          var tables = data.result.rows;
          var tableCount = 0;
          while (tableCount < tables.length) {
            var table = tables.item(tableCount);
            var _name = table.tbl_name;

            if (_name !== "__WebKitDatabaseInfoTable__" && !_this[_name]) _this[_name] = new WebDB.Table(_this, _name);

            tableCount = tableCount + 1;
          };
        }, true);

        return this;
      }
    },
    createTable: {
      value: function createTable(name, configuration) {
        var _this = this;

        var createTable = function () {

          if (configuration.columns == null) return console.error("WebDB.createTable requires `configuration.columns`");

          var columns = [];

          if (!configuration.autoIndexID || configuration.autoIndexID && configuration.autoIndexID !== false) columns.push("id INTEGER PRIMARY KEY");

          Object.keys(configuration.columns).forEach(function (key) {
            columns.push("" + key + " " + configuration.columns[key].toUpperCase());
          });

          var transactionArgs = {
            id: _this.identifyTransaction(),
            statement: _this.sanitizeStatement("\n          CREATE TABLE IF NOT EXISTS\n          " + name + "\n          (" + columns.join(",") + ")\n        ")
          };

          _this.transaction(transactionArgs);

          _this.on(transactionArgs.id, function (data) {
            if (data.status === "error" && configuration.error != null) return configuration.error(data.result);

            if (status === "success") {
              _this.getTables();
              if (configuration.success != null) configuration.success(data.result);
              return _this[name];
            };
          }, true);
        };

        if (configuration.overwrite) {
          var transactionArgs = {
            id: this.identifyTransaction(),
            statement: this.sanitizeStatement("\n          DROP TABLE IF EXISTS " + name + "\n        ")
          };

          this.transaction(transactionArgs);

          this.on(transactionArgs.id, createTable, true);
        } else {
          createTable();
        };

        return this;
      }
    }
  });

  return _class;
})();

WebDB.prototype.events = {};

WebDB.prototype.transactions = {};

WebDB.prototype.transactionIdentifier = 0;

WebDB.prototype.identifyTransaction = function () {
  return this.transactionIdentifier = this.transactionIdentifier + 1;
};

WebDB.prototype.transaction = function (transactionArgs) {
  var _this = this;

  this.database.transaction(function (transaction) {
    var id = transactionArgs.id;
    var statement = transactionArgs.statement;

    transaction.executeSql(statement, [], function (transaction, result) {
      _this.trigger(id, {
        status: "success",
        transaction: transaction,
        result: result
      }, true, statement);
    }, function (transaction, result) {
      _this.trigger(id, {
        status: "error",
        transaction: transaction,
        result: result
      }, true, statement);
    });
  });

  return this;
};

WebDB.prototype.on = function (eventOrID, callback, isTransaction) {
  var eventSet = isTransaction ? this.transactions : this.events;

  eventSet[eventOrID] = callback;

  return this;
};

WebDB.prototype.trigger = function (eventOrID, data, isTransaction, statement) {
  var eventSet = isTransaction ? this.transactions : this.events;

  if (eventSet[eventOrID]) {
    eventSet[eventOrID].call(this, data);

    if (isTransaction && statement) this.transactions[eventOrID] = statement;
  };

  return this;
};

WebDB.prototype.sanitizeStatement = function (statement) {
  statement = statement.replace(/\n/g, " ") // Replace line breaks with spaces
  .replace(/\s{2,}/g, " ") // Replace multiple spaces with single space
  .replace(/^ | $/g, ""); // Remove first and last space in query
  return statement;
};

WebDB.Row = (function () {
  var _class2 = function (database, rowData) {
    var _this = this;

    _classCallCheck(this, _class2);

    this.database = database;

    Object.keys(rowData).forEach(function (dataItem) {
      _this[dataItem] = rowData[dataItem];
    });

    return this;
  };

  return _class2;
})();

WebDB.Table = (function () {
  var _class3 = function (database, tableName) {
    var _this = this;

    _classCallCheck(this, _class3);

    this.database = database;
    this.tableName = tableName;

    this.rows = [];

    // Retrieve all rows in the table
    var transactionArgs = {
      id: this.database.identifyTransaction(),
      statement: this.database.sanitizeStatement("\n        SELECT *\n        FROM " + this.tableName + "\n      ")
    };

    this.database.transaction(transactionArgs);

    this.database.on(transactionArgs.id, function (data) {
      if (data.status === "error") return console.error("Couldn't retrieve rows for table " + _this.tableName, data.result);

      _this.setupRows(data.result.rows);
    }, true);

    return this;
  };

  _createClass(_class3, {
    count: {
      value: function count() {
        return this.rows.length;
      }
    },
    get: {
      value: function get(index) {
        return this.rows[index];
      }
    },
    drop: {
      value: function drop() {
        var _this = this;

        var transactionArgs = {
          id: this.database.identifyTransaction(),
          statement: this.database.sanitizeStatement("\n        DROP TABLE " + this.tableName + "\n      ")
        };

        this.database.transaction(transactionArgs);

        this.database.on(transactionArgs.id, function (data) {
          if (data.status === "error") return console.error("Could not drop table " + _this.tableName, data.result);

          return delete _this.database[_this.tableName];
        }, true);
      }
    },
    insert: {

      /* `rows` can be an object, or an array of objects */

      value: function insert(rows) {
        var _this = this;

        var rowItems = [];

        if (Object.prototype.toString.call(rows) === "[object Array]") {
          rowItems = rows;
        } else if (typeof rows === "object") {
          rowItems.push(rows);
        };

        rowItems.forEach(function (rowItem) {
          var keys = [],
              values = [],
              statement = undefined;

          Object.keys(rowItem).forEach(function (key) {
            keys.push(key);
            values.push("\"" + rowItem[key] + "\"");
          });

          var transactionArgs = {
            id: _this.database.identifyTransaction(),
            statement: _this.database.sanitizeStatement("\n          INSERT INTO " + _this.tableName + "\n          (" + keys.join(",") + ") VALUES\n          (" + values.join(",") + ")\n        ")
          };

          _this.database.transaction(transactionArgs);

          _this.database.on(transactionArgs.id, function (data) {
            if (data.status === "error") return console.error("Could not insert row in to table " + _this.tableName, data.result);

            _this.setupRows(data.result.rows);
          }, true);
        });

        return this;
      }
    },
    remove: {
      value: function remove(query, justOne) {}
    }
  });

  return _class3;
})();

WebDB.Table.prototype.setupRows = function (rows) {
  var rowCount = 0;

  while (rowCount < rows.length) {
    var rowData = rows.item(rowCount);

    this.rows.push(new WebDB.Row(this.database, rowData));

    rowCount = rowCount + 1;
  };
};