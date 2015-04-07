WebDB.Table = class {

  constructor(database, tableName) {
    this.database = database;
    this.tableName = tableName;

    this.rows = [];

    // Retrieve all rows in the table
    let selectID = this.database.identifyTransaction();

    this.database.transaction({
      id: selectID,
      statement: `SELECT * from ${this.tableName}`
    });

    this.database.done(selectID, (status, transaction, result) => {
      if (status === "error")
        return console.error(`Could not retrieve rows for table ${this.tableName}`, result);

      let rows = result.rows;
      let rowCount = 0;
      while (rowCount < rows.length) {
        let row = rows.item(rowCount);

        this.rows.push(new WebDB.Row(this.database, row));

        rowCount = rowCount + 1;
      };
    });

    return this;
  };

  count() {
    return this.rows.length;
  };

  drop() {
    let dropID = this.database.identifyTransaction();

    this.database.transaction({
      id: dropID,
      statement: `DROP TABLE ${this.tableName}`
    });

    this.database.done(dropID, (status, transaction, result) => {
      if (status === "error")
        return console.error(`Could not drop table ${this.tableName}`, result);

      return delete this.database[this.tableName];
    });
  }

  /* rowName can also be an object with {rowName: configuration} */
  insert(rowName, configuration) {
    let rowItems = {};

    if (typeof rowName === "string" && configuration != null) {
      rowItems[rowName] = configuration;
    } else if (typeof rowName === "object") {
      rowItems = rowName;
    };

    console.log(rowItems);
  };

  remove(query, justOne) {

  };

};
