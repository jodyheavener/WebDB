WebDB.Row = class {

  constructor(database, rowData) {
    this.database = database;

    Object.keys(rowData).forEach((dataItem) => {
      this[dataItem] = rowData[dataItem];
    });

    return this;
  };

};
