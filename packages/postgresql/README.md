# node-red-context-postgresql

Node RED plugin to hold context in PostgreSQL.

## Dependencies

PostgreSQL server: [https://www.postgresql.org](https://www.postgresql.org)

## Install

Run the following in you Node RED user directory (usually `~/.node-red`)

```bash
npm install @zigasebenik/node-red-context-postgresql
```

## Configuration

Open Node RED `settings.js` file and look for `contextStorage`, then reference and configure installed plugin:

```js
contextStorage: {
  postgresql: {
    module: require('@zigasebenik/node-red-context-postgresql'),
    config: {
      connectionString: 'postgres://localhost:5432/nodered',
      tableName: 'nodered'
    }
  }
}
```

For more PostgreSQL options look [here](https://node-postgres.com/apis/client#new-client).

## Usage

Plugin provides async context storage, thus refer to [Node RED documentation](https://nodered.org/docs/user-guide/writing-functions#asynchronous-context-access) on how to use async context storage in a function node.

General Node RED context documentation can be found [here](https://nodered.org/docs/user-guide/context).
