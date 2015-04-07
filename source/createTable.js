/**
 * METHOD
 * Creates a new Table
 *
 * * name          | String          | Name of table to creater
 * * configuration | Object          | Table configuration
 *     overwrite   | Boolean (false) | Should overwrite table if it exists
 *     autoIndexID | Boolean (true)  | Automatically create a primary key _id column
 *   * columns     | Object          | Key value pairs of column name and types
 *      Name of column | String : SQL qualified type value | String
 */

WebDB.prototype.createTable = function(name, configuration) {

  let createTable = () => {

    if (configuration.columns == null)
      return console.error("WebDB.createTable requires `configuration.columns` configuration")

    let columns = [];
    Object.keys(configuration.columns).forEach((key) => {
      columns.push(`${key} ${configuration.columns[key].toUpperCase()}`);
    })

    if (configuration.autoIndexID && configuration.autoIndexID !== false)
      columns.push("_id INTEGER PRIMARY KEY");

    let txConfig = {
      id: this._identifyTransaction(),
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

    this._transaction(txConfig);

    this._done(txConfig.id, (status, transaction, result) => {
      if (status === "error" && configuration.error != null)
        return configuration.error(result);

      if (status === "success") {
        this._getTables();
        if (configuration.success != null)
          configuration.success(result);
        return this[name];
      }
    });

  };

  if (configuration.overwrite) {
    let id = this._identifyTransaction();

    this._transaction({
      id: id,
      statement: "DROP TABLE IF EXISTS ${name}"
    });

    this._done(dropID, createTable);
  } else {
    createTable();
  };

};
