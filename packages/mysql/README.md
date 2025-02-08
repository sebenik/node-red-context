# node-red-context-mysql

Node RED plugin to hold context in MySQL/MariaDB.

## Dependencies

MySQL server: [https://www.mysql.com](https://www.mysql.com) `or` MariaDB server: [https://mariadb.com](https://mariadb.com)

## Install

Run the following in you Node RED user directory (usually `~/.node-red`)

```bash
npm install @zigasebenik/node-red-context-mysql
```

## Configuration

Open Node RED `settings.js` file and look for `contextStorage`, then reference and configure installed plugin:

```js
contextStorage: {
  redis: {
    module: require('@zigasebenik/node-red-context-mysql'),
    config: {
      host: 'localhost',
      port: 3306,
      database:'nodered',
      user: 'user',
      password: 'password',
      tableName: 'nodered',
    }
  }
}
```

For more options look [here](https://github.com/sidorares/node-mysql2/blob/master/typings/mysql/lib/Connection.d.ts#L82-L329).

## Usage

Plugin provides async context storage, thus refer to [Node RED documentation](https://nodered.org/docs/user-guide/writing-functions#asynchronous-context-access) on how to use async context storage in a function node.

General Node RED context documentation can be found [here](https://nodered.org/docs/user-guide/context).
