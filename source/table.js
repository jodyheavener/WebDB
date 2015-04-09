WebDB.Table = class {

  constructor(database, tableName) {
    this.database = database;
    this.tableName = tableName;

    this.rows = [];

    // Retrieve all rows in the table
    let transactionArgs = {
      id: this.database.identifyTransaction(),
      statement: this.database.sanitizeStatement(`
        SELECT *
        FROM ${this.tableName}
      `)
    };

    this.database.transaction(transactionArgs);

    this.database.on(transactionArgs.id, (data) => {
      if (data.status === "error")
        return console.error(`Couldn't retrieve rows for table ${this.tableName}`, data.result);

      this.setupRows(data.result.rows);
    }, true);

    return this;
  };

  count() {
    return this.rows.length;
  };

  get(index) {
    return this.rows[index];
  };

  drop() {
    let transactionArgs = {
      id: this.database.identifyTransaction(),
      statement: this.database.sanitizeStatement(`
        DROP TABLE ${this.tableName}
      `)
    };

    this.database.transaction(transactionArgs);

    this.database.on(transactionArgs.id, (data) => {
      if (data.status === "error")
        return console.error(`Could not drop table ${this.tableName}`, data.result);

      return delete this.database[this.tableName];
    }, true);
  };

  /* `rows` can be an object, or an array of objects */
  insert(rows) {
    let rowItems = [];

    if (Object.prototype.toString.call(rows) === "[object Array]") {
      rowItems = rows;
    } else if (typeof rows === "object") {
      rowItems.push(rows);
    };

    rowItems.forEach((rowItem) => {
      let keys = [],
          values = [],
          statement;

      Object.keys(rowItem).forEach(key => {
        keys.push(key);
        values.push("\"" + rowItem[key] + "\"");
      });

      let transactionArgs = {
        id: this.database.identifyTransaction(),
        statement: this.database.sanitizeStatement(`
          INSERT INTO ${this.tableName}
          (${keys.join(",")}) VALUES
          (${values.join(",")})
        `)
      };

      this.database.transaction(transactionArgs);

      this.database.on(transactionArgs.id, (data) => {
        if (data.status === "error")
          return console.error(`Could not insert row in to table ${this.tableName}`, data.result);

        this.setupRows(data.result.rows);
      }, true);
    });

    return this;
  };

  remove(query, justOne) {

  };

};

WebDB.Table.prototype.setupRows = function(rows) {
  let rowCount = 0;

  while (rowCount < rows.length) {
    let rowData = rows.item(rowCount);

    this.rows.push(new WebDB.Row(this.database, rowData));

    rowCount = rowCount + 1;
  };
};
