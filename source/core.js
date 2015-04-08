let WebDB = class {

  constructor(configuration) {
    var dbConfiguration = {
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
        this.databaseName = dbConfiguration.name = configuration;
        break;
      case "object":
        if (!configuration.name)
          return console.error("WebDB instance requires `name` configuration");
        this.databaseName = dbConfiguration.name = configuration.name;
        if (configuration.version)
          dbConfiguration.version = configuration.version;
        if (configuration.description)
          dbConfiguration.description = configuration.description;
        if (configuration.initialize)
          dbConfiguration.initialize = configuration.initialize;
        break;
    };

    this.database = openDatabase(dbConfiguration.name, dbConfiguration.version, dbConfiguration.description, 2 * 1024 * 1024, dbConfiguration.initialize);

    this.getTables();

    return this.ready = true;
  };

  getName() {
    return this.databaseName;
  };

  getTables() {
    let transactionArgs = {
      id: this.identifyTransaction(),
      statement: this.sanitizeStatement(`
        SELECT tbl_name, sql
        FROM sqlite_master
        WHERE type='table'
      `)
    };

    this.transaction(transactionArgs);

    this.done(transactionArgs.id, (status, transaction, result) => {
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

      let transactionArgs = {
        id: this.identifyTransaction(),
        statement: this.sanitizeStatement(`
          CREATE TABLE IF NOT EXISTS
          ${name}
          (${columns.join(",")})
        `)
      };

      this.transaction(transactionArgs);

      this.done(transactionArgs.id, (status, transaction, result) => {
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
      let transactionArgs = {
        id: this.identifyTransaction(),
        statement: this.sanitizeStatement(`
          DROP TABLE IF EXISTS ${name}
        `)
      };

      this.transaction(transactionArgs);

      this.done(transactionArgs.id, createTable);
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

WebDB.prototype.transaction = function(transactionArgs) {
  this.database.transaction((transaction) => {

    transaction.executeSql(transactionArgs.statement, [], (transaction, result) => {
      this.transactions[transactionArgs.id].apply(this, ["success", transaction, result]);
    }, (transaction, result) => {
      this.transactions[transactionArgs.id].apply(this, ["error", transaction, result]);
    });

  });

  return this;
};

WebDB.prototype.done = function(id, callback) {
  return this.transactions[id] = callback;
};

WebDB.prototype.sanitizeStatement = function(statement) {
  statement = statement
    .replace(/\n/g, " ")     // Replace line breaks with spaces
    .replace(/\s{2,}/g, " ") // Replace multiple spaces with single space
    .replace(/^ | $/g, "");  // Remove first and last space in query
  return statement;
};

