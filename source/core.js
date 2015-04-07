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

    this.getTables();

    return this.ready = true;
  };

  getName() {
    return this.databaseName;
  }

  getTables() {
    let id = this.identifyTransaction();

    this.transaction({
      id: id,
      statement: `SELECT tbl_name, sql from sqlite_master WHERE type='table'`
    });

    this.done(id, (status, transaction, result) => {
      if (status === "error")
        return console.error("Could not retrieve existing tables from database", result);

      let tables = result.rows;
      let tableCount = 0;
      while (tableCount < tables.length) {
        let table = tables.item(tableCount);
        let name = table.tbl_name;

        if (name !== "__WebKitDatabaseInfoTable__" && !this[name])
          this[name] = new WebDB.Table(this, name);

        tableCount = tableCount + 1;
      };
    });

    return this;
  };

  createTable(name, configuration) {
    let createTable = () => {

      if (configuration.columns == null)
        return console.error("WebDB.createTable requires `configuration.columns` configuration")

      let columns = [];
      Object.keys(configuration.columns).forEach((key) => {
        columns.push(`${key} ${configuration.columns[key].toUpperCase()}`);
      });

      if (configuration.autoIndexID && configuration.autoIndexID !== false)
        columns.push("_id INTEGER PRIMARY KEY");

      let txConfig = {
        id: this.identifyTransaction(),
        statement: `
          CREATE TABLE IF NOT EXISTS
          ${name}
          (${columns.join(",")})
        `
      };

      txConfig.statement = txConfig.statement
        .replace(/\n/g, " ")     // Replace line breaks with spaces
        .replace(/\s{2,}/g, " ") // Replace multiple spaces with single space
        .replace(/^ | $/g, "");  // Remove first and last space in query

      this.transaction(txConfig);

      this.done(txConfig.id, (status, transaction, result) => {
        if (status === "error" && configuration.error != null)
          return configuration.error(result);

        if (status === "success") {
          this.getTables();
          if (configuration.success != null)
            configuration.success(result);
          return this[name];
        };
      });

    };

    if (configuration.overwrite) {
      let id = this.identifyTransaction();

      this.transaction({
        id: id,
        statement: "DROP TABLE IF EXISTS ${name}"
      });

      this.done(dropID, createTable);
    } else {
      createTable();
    };
  };

};

WebDB.prototype.transactions = {};

WebDB.prototype.transactionIdentifier = 0;

WebDB.prototype.identifyTransaction = function() {
  return this.transactionIdentifier = this.transactionIdentifier + 1;
};

WebDB.prototype.transaction = function(txConfig) {
  this.database.transaction((transaction) => {

    transaction.executeSql(txConfig.statement, [], (transaction, result) => {
      this.transactions[txConfig.id].apply(this, ["success", transaction, result]);
    }, (transaction, result) => {
      this.transactions[txConfig.id].apply(this, ["error", transaction, result]);
    });

  });

  return this;
};

WebDB.prototype.done = function(id, callback) {
  return this.transactions[id] = callback;
};
