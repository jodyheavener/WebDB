# WebDB

A library that tries to apply a Mongo DB approach to interacting with Web SQL Databases.

**Note:** at this point I'm not sure if I want to finish this. It seems trivial trying to make Web DB work like Mongo, and the Web SQL spec is dead... so.. we'll see.

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
The following methods and members are available, though they are meant to be internal.

* `events` - Object to assign events and their callback
* `transactions` – Similar to `events`, but containing a history of database transactions
* `transactionIdentifier` – Number used in conjuction with `transactions` and `on()` to identifying the current transaction
* `identifyTransaction()` – Increments `transactionIdentifier` and returns the current ID number
* `transaction(txConfig)` – Performs a single database transaction with parameters
* `on(eventOrID, callback, isTransaction)` - Registers a function with an event name in the `events` object. If `isTransaction` is true, registers the function to the `transactions` object with a transaction ID number
* `trigger(eventOrID, data, isTransaction, statement) - Triggers an event or transaction completion by event name or ID number. if `isTransaction` and `statement` is set, will set the value in the transaction object as the SQL statement.
* `sanitizeStatement(statement)` – Sanitizes a database statement; useful for when creating statements using ES6 template strings

Eventually `on()` and `trigger()` are going to be designed for public usage.

## WebDB.Table(database, tableName)
Instantiate the WebDB.Table class by Table Name with a copy of the WebDB instance. Table must exist in the database.

This class is typically created and handled by the WebDB class, but for reference it can be created like so:

```javascript```
// this is a copy of the WebDB instance
this[name] = new WebDB.Table(this, name);
```

### count()
Returns the number of rows that exist within the table

### get(index)
Retrieves a row by index value

### drop()
Drops (deletes) the current table from the database, as well as the current WebDB instance object

### insert(rows)
Inserts a new row in to the table.

`rows` can be either an object or an array of objects containing `column: value`s.

```javascript
myDB.myTestTable.insert({
  name: "this name",
  count: 3
});

// or
myDB.myTestTable.insert([
  {
    name: "this name",
    count: 3
  }, {
    name: "that name",
    count: 10
  }
]);
```

### remove(query, justOne)
Removes a row from the table.

_Not complete_

### Other
The following methods and members are available, though they are meant to be internal.

* `setupRows(rows)` – Takes a set of rows and instantiates new `WebDB.Row`s with them. Called when constructing the WebDB.Table instance and when inserting new rows.

## WebDB.Row(database, rowQuery)
Instantiate the WebDB.Row class by Row Query with a copy of the WebDB instance. Table must exist in the database.

This class is typically created and handled by the WebDB class.

_Not complete_
