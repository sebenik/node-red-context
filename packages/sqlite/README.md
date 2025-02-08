# node-red-context-sqlite

Node RED plugin to hold context in sqlite database.

## Dependencies

SQLite: [https://www.sqlite.org](https://www.sqlite.org)

## Install

Run the following in you Node RED user directory (usually `~/.node-red`)

```bash
npm install @zigasebenik/node-red-context-sqlite
```

## Configuration

Open Node RED `settings.js` file and look for `contextStorage`, then reference and configure installed plugin:

```js
contextStorage: {
  sqlite: {
    module: require('@zigasebenik/node-red-context-sqlite'),
    config: {
      path: '/home/user/.node-red/context/db.sqlite3', // path to db file
      tableName: 'nodered'
    }
  }
}
```

## Usage

Plugin provides async context storage, thus refer to [Node RED documentation](https://nodered.org/docs/user-guide/writing-functions#asynchronous-context-access) on how to use async context storage in a function node.

General Node RED context documentation can be found [here](https://nodered.org/docs/user-guide/context).
