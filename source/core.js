let WebDB = class {

  constructor(configuration) {
    var dbcon = {
      name: undefined,
      version: "1.0",
      description: "",
      initialize: function() {
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
        if (!configuration.name)
          return console.error("WebDB instance requires `name` configuration");
        this.databaseName = dbcon.name = configuration.name;
        if (configuration.version)
          dbcon.version = configuration.version;
        if (configuration.description)
          dbcon.description = configuration.description;
        if (configuration.initialize)
          dbcon.initialize = configuration.initialize;
        break;
    };

    this.database = openDatabase(dbcon.name, dbcon.version, dbcon.description, 2 * 1024 * 1024, dbcon.initialize);

    this._transactions = {};
    this._transactionIdentifier = 0;

    this._getTables();

    return;
  };

  getName() {
    return this.databaseName;
  }

  _identifyTransaction() {
    return this._transactionIdentifier = this._transactionIdentifier + 1;
  };

  _transaction(txConfig) {
    this.database.transaction((transaction) => {

      transaction.executeSql(txConfig.statement, [], (transaction, result) => {
        this._transactions[txConfig.id].apply(this, ["success", transaction, result]);
      }, (transaction, result) => {
        this._transactions[txConfig.id].apply(this, ["error", transaction, result]);
      });

    });

    return this;
  };

  _done(id, callback) {
    return this._transactions[id] = callback;
  };

  _getTables() {
    let id = this._identifyTransaction();

    this._transaction({
      id: id,
      statement: `SELECT tbl_name, sql from sqlite_master WHERE type='table'`
    });

    this._done(id, (status, transaction, result) => {
      if (status === "error")
        return console.error("Could not retrieve existing tables from database", result);

      let tables = result.rows;
      let tableCount = 0;
      while (tableCount < tables.length) {
        let table = tables.item(tableCount);
        let name = table.tbl_name;

        if (name !== "__WebKitDatabaseInfoTable__" && !this[name])
          this[name] = new WebDB.dbTable(this, name);

        tableCount = tableCount + 1;
      }
    });

    return this;
  }

};
