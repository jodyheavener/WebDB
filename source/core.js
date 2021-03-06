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

    this.database = openDatabase(
      dbConfiguration.name,
      dbConfiguration.version,
      dbConfiguration.description,
      2 * 1024 * 1024,
      dbConfiguration.initialize
    );

    this.getTables();

    // How do I make this work????!?!?!
    setTimeout(() => { this.trigger("ready"); }, 0);

    return this;
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

    this.on(transactionArgs.id, (data) => {
      if (data.status === "error")
        return console.error("Couldn't retrieve tables from database", data.result);

      let tables = data.result.rows;
      let tableCount = 0;
      while (tableCount < tables.length) {
        let table = tables.item(tableCount);
        let name = table.tbl_name;

        if (name !== "__WebKitDatabaseInfoTable__" && !this[name])
          this[name] = new WebDB.Table(this, name);

        tableCount = tableCount + 1;
      };
    }, true);

    return this;
  };

  createTable(name, configuration) {
    let createTable = () => {

      if (configuration.columns == null)
        return console.error("WebDB.createTable requires `configuration.columns`")

      let columns = [];

      if (!configuration.autoIndexID ||
         (configuration.autoIndexID && configuration.autoIndexID !== false))
        columns.push("id INTEGER PRIMARY KEY");

      Object.keys(configuration.columns).forEach((key) => {
        columns.push(`${key} ${configuration.columns[key].toUpperCase()}`);
      });

      let transactionArgs = {
        id: this.identifyTransaction(),
        statement: this.sanitizeStatement(`
          CREATE TABLE IF NOT EXISTS
          ${name}
          (${columns.join(",")})
        `)
      };

      this.transaction(transactionArgs);

      this.on(transactionArgs.id, (data) => {
        if (data.status === "error" && configuration.error != null)
          return configuration.error(data.result);

        if (status === "success") {
          this.getTables();
          if (configuration.success != null)
            configuration.success(data.result);
          return this[name];
        };
      }, true);

    };

    if (configuration.overwrite) {
      let transactionArgs = {
        id: this.identifyTransaction(),
        statement: this.sanitizeStatement(`
          DROP TABLE IF EXISTS ${name}
        `)
      };

      this.transaction(transactionArgs);

      this.on(transactionArgs.id, createTable, true);
    } else {
      createTable();
    };

    return this;
  };

};

WebDB.prototype.events = {};

WebDB.prototype.transactions = {};

WebDB.prototype.transactionIdentifier = 0;

WebDB.prototype.identifyTransaction = function() {
  return this.transactionIdentifier = this.transactionIdentifier + 1;
};

WebDB.prototype.transaction = function(transactionArgs) {
  this.database.transaction((transaction) => {
    let id = transactionArgs.id;
    let statement = transactionArgs.statement;

    transaction.executeSql(statement, [], (transaction, result) => {
      this.trigger(id, {
        status: "success",
        transaction: transaction,
        result: result
      }, true, statement);
    }, (transaction, result) => {
      this.trigger(id, {
        status: "error",
        transaction: transaction,
        result: result
      }, true, statement);
    });
  });

  return this;
};

WebDB.prototype.on = function(eventOrID, callback, isTransaction) {
  let eventSet = isTransaction ? this.transactions : this.events;

  eventSet[eventOrID] = callback;

  return this;
};

WebDB.prototype.trigger = function(eventOrID, data, isTransaction, statement) {
  let eventSet = isTransaction ? this.transactions : this.events;

  if (eventSet[eventOrID]) {
    eventSet[eventOrID].call(this, data);

    if (isTransaction && statement)
      this.transactions[eventOrID] = statement;
  };

  return this;
};

WebDB.prototype.sanitizeStatement = function(statement) {
  statement = statement
    .replace(/\n/g, " ")     // Replace line breaks with spaces
    .replace(/\s{2,}/g, " ") // Replace multiple spaces with single space
    .replace(/^ | $/g, "");  // Remove first and last space in query
  return statement;
};

