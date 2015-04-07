# WebDB

A library that tries to apply a Mongo DB approach to interacting with Web SQL Databases.

**Note:**: at this point I'm not sure if I want to finish this. It seems trivial trying to make Web DB work like Mongo.

### new WebDB

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

### .getName()
Returns the string name of the instance's open database. You could also use `this.databaseName`.

### .createTable()
Create a table with configuration:

If succesful, returns `.getTable()` of newly added table name

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
