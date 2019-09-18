#@sap/hana-client
This is a Node.js driver written for [SAP HANA](http://go.sap.com/product/technology-platform/hana.html).

##Install
```
npm install @sap/hana-client
```
####Prerequisites

This driver communicates with the native HANA libraries, and thus requires
platform-specific native binaries. Native compilation is managed by
[`node-gyp`](https://github.com/TooTallNate/node-gyp/). Please see that project
for additional prerequisites including Python 2.7, and C/C++ tool chain.

The official hosted version includes precompiled libraries for Linux, Windows and Mac OS X.

The @sap/hana-client driver supports node.js 4.x, 6.x, 8.x and 10.x.

##Getting Started
```js
var hana = require('@sap/hana-client');

var conn = hana.createConnection();

var conn_params = {
  serverNode  : 'myserver:30015',
  uid         : 'system',
  pwd         : 'manager'
};

conn.connect(conn_params, function(err) {
  if (err) throw err;
  conn.exec('SELECT Name, Description FROM Products WHERE id = ?', [301], function (err, result) {
    if (err) throw err;

    console.log('Name: ', result[0].Name, ', Description: ', result[0].Description);
    // output --> Name: Tee Shirt, Description: V-neck
    conn.disconnect();
  })
});
```

##Establish a database connection
###Connecting
A database connection object is created by calling `createConnection`.  The
connection is established by calling the connection object's `connect` method,
and passing in an object representing connection parameters.

#####Example: Connecting over TCP/IP
```js
conn.connect({
  host    : 'myserver',
  port    : '30015',
  uid     : 'system',
  pwd     : 'manager'
});
```

###Disconnecting

```js
conn.disconnect(function(err) {
  if (err) throw err;
  console.log('Disconnected');
});
```
##Direct Statement Execution
Direct statement execution is the simplest way to execute SQL statements. The
inputs are the SQL command to be executed, and an optional array of positional
arguments. The result is returned using callbacks. The type of returned result
depends on the kind of statement.

####DDL Statement

In the case of a successful DDL Statement nothing is returned.

```js
conn.exec('CREATE TABLE Test (id INTEGER PRIMARY KEY, msg VARCHAR(128))', function (err, result) {
  if (err) throw err;
  console.log('Table Test created!');
});
```

####DML Statement

In the case of a DML Statement the number of `affectedRows` is returned.

```js
conn.exec("INSERT INTO Test VALUES(1, 'Hello')", function (err, affectedRows) {
  if (err) throw err;
  console.log('Number of affected rows:', affectedRows);
});
```

####Query

The `exec` function is a convenient way to completely retrieve the result of a
query. In this case all selected rows are fetched and returned in the callback.

```js
conn.exec("SELECT * FROM Test WHERE id < 5", function (err, rows) {
  if (err) throw err;
  console.log('Rows:', rows);
});
```

Values in the query can be substitued with JavaScript variables by using `?`
placeholders in the query, and passing an array of positional arguments.

```js
conn.exec("SELECT * FROM Test WHERE id BETWEEN ? AND ?", [5, 8], function (err, rows) {
  if (err) throw err;
  console.log('Rows:', rows);
});
```

##Prepared Statement Execution
####Prepare a Statement
The connection returns a `statement` object which can be executed multiple times.
```js
conn.prepare('SELECT * FROM Test WHERE id = ?', function (err, stmt){
  if (err) throw err;
  // do something with the statement
});
```

####Execute a Statement
The execution of a prepared statement is similar to the direct statement execution.
The first parameter of `exec` function is an array with positional parameters.
```js
stmt.exec([16], function(err, rows) {
  if (err) throw err;
  console.log("Rows: ", rows);
});
```

####Execute a Batch Statement
The execution of a prepared batch statement is similar to the direct statement execution.
The first parameter of `execBatch` function is an array with positional parameters.
```js
var stmt=conn.prepare("INSERT INTO Customers(ID, NAME) VALUES(?, ?)");
stmt.execBatch([[1, 'Company 1'], [2, 'Company 2']], function(err, rows) {
  if (err) throw err;
  console.log("Rows: ", rows);
});
```

####Execute a Query
The execution of a prepared query is similar to the direct statement execution.
The first parameter of `execQuery` function is an array with positional parameters.
```js
var stmt=conn.prepare("SELECT * FROM Customers WHERE ID >= ? AND ID < ?");
stmt.execQuery([100, 200], function(err, rs) {
  if (err) throw err;
    var rows = [];
    while (rs.next()) {
	rows.push(rs.getValues());
    }
  console.log("Rows: ", rows);
});
```

####Drop Statement
```js
stmt.drop(function(err) {
  if (err) throw err;
});
```

##Transaction Handling
__Transactions are automatically commited.__ Setting autocommit to false implicitly
starts a new transaction that must be explicitly committed, or rolled back.

####Commit a Transaction

```js
conn.setAutoCommit(false);
// Execute some statements
conn.commit(function(err) {
  if (err) throw err;
  console.log('Transaction commited.');
});
```

####Rollback a Transaction
```js
conn.setAutoCommit(false);
// Execute some statements
conn.rollback(function(err) {
  if (err) throw err;
  console.log('Transaction rolled back.');
});
```

##Resources
+ [SAP HANA Documentation](http://help.sap.com/hana)
+ [SAP HANA Forum](http://saphanatutorial.com/forum/)
+ [SAP HANA Community](https://go.sap.com/community/topic/hana.html)