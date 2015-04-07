WebDB.dbTable = class {

  constructor(database, tableName) {
    this.database = database;
    this.tableName = tableName;

    this.rows = [];

    // Retrieve all rows in the table
    let selectID = this.database._identifyTransaction();

    this.database._transaction({
      id: selectID,
      statement: `SELECT * from ${this.tableName}`
    });

    this.database._done(selectID, (status, transaction, result) => {
      if (status === "error")
        return console.error(`Could not retrieve rows for table ${this.tableName}`, result);

      let rows = result.rows;
      let rowCount = 0;
      while (rowCount < rows.length) {
        let row = rows.item(rowCount);

        this.rows.push(new WebDB.dbRow(this.database, row));

        rowCount = rowCount + 1;
      }
    });

    return this;
  };

  count() {
    return this.rows.length;
  };

  remove() {
    // This needs to remove the table form the DB!
    return delete this.database[this.tableName];
  }

  insert(rowName, configuration) {

  };

};
