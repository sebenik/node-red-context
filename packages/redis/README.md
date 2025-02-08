# node-red-context-redis

Node RED plugin to hold context in Redis.

## Dependencies

Redis server: [https://redis.io](https://redis.io)

## Install

Run the following in you Node RED user directory (usually `~/.node-red`)

```bash
npm install @zigasebenik/node-red-context-redis
```

## Configuration

Open Node RED `settings.js` file and look for `contextStorage`, then reference and configure installed plugin:

```js
contextStorage: {
  redis: {
    module: require('@zigasebenik/node-red-context-redis'),
    config: {
      host: 'localhost',
      port: 6379,
      password: 'REDIS_PASSWORD',
      keyPrefix: 'nr',
    }
  }
}
```

For more Redis options look [here](https://github.com/redis/ioredis/blob/v4/API.md#new-redisport-host-options).

## Usage

Plugin provides async context storage, thus refer to [Node RED documentation](https://nodered.org/docs/user-guide/writing-functions#asynchronous-context-access) on how to use async context storage in a function node.

General Node RED context documentation can be found [here](https://nodered.org/docs/user-guide/context).
