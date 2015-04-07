# WebDB

A library that tries to apply a Mongo DB approach to interacting with Web SQL Databases.

**Note:**: at this point I'm not sure if I want to finish this. It seems trivial trying to make Web DB work like Mongo.

## WebDB(configuration)
Instantiate the WebDB class with either a configuration object, or just the string name of the database.

```javascript
// Full object configuration
var myDB = new WebDB({
  name: "MyCoolDatabase",
  version: 2.0,
  description: "This is such a cool database",
  initialize: function() {
    // This will be executed when the database is first created
  }
});

// Or simple string name configuration
var myDB = new WebDB("MyCoolDatabase");
```

### getName()
Returns the string name of the instance's open database. You could also use `this.databaseName`.

### getTables()
Retrieves all tables in the database and adds them to the instance as new `WebDB.Table` instances. Generally you won't need to call this as it is called when the `WebDB` class is instantiated, but it's here if you need it.

### createTable(name, configuration)
Create a table with configuration:

```javascript
myDB.createTable("someKindaTable", {
  overwrite: true, // default is false
  autoIndexID: false, // default is true
  columns: { // required
    name: "varchar",
    date: "TIMESTAMP",
    count: "integer",
    tags: "array"
  },
  error: function(result) {
    // Executed when the transaction fails
  },
  success: function(result) {
    // Executed when the transaction succeeds
  }
});
```

### Other
The follow methods and members are available, though they are meant to be internal.

* `transactions` – Object containing a history of database transactions
* `transactionIdentifier` – Number used in conjuction with `transactions` and `done()` to identifying the current transaction
* `identifyTransaction()` – Increments `transactionIdentifier` and returns the current ID number
* `transaction(txConfig)` – Performs a single database transaction with parameters
* `done(id, callback)` - Assigns a function to the `transactions` object by ID number

## WebDB.Table(database, tableName)
Instantiate the WebDB.Table class by Table Name with a copy of the WebDB instance. Table must exist in the database.

This class is typically created and handled by the WebDB class, but for reference it can be created like so:

```javascript```
// this is a copy of the WebDB instance
this[name] = new WebDB.Table(this, name);
```

### count()
Returns the number of rows that exist within the table

### drop()
Drops (deletes) the current table from the database, as well as the current WebDB instance object

### insert(rowName, configuration)
Inserts a new row in to the table.

_Not complete_

### remove(query, justOne)
Removes a row from the table.

_Not complete_

## WebDB.Row(database, rowQuery)
Instantiate the WebDB.Row class by Row Query with a copy of the WebDB instance. Table must exist in the database.

This class is typically created and handled by the WebDB class.

_Not complete_
