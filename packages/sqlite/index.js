const BaseContext = require('@zigasebenik/node-red-context-base');
const { createDatabase } = require('db0');
const dbDriver = require('unstorage/drivers/db0');
const sqlite = require('db0/connectors/better-sqlite3');

class RedisContext extends BaseContext {
  async open() {
    try {
      this.storage = this.createStorage({
        driver: dbDriver({
          database: createDatabase(
            sqlite(this.options)
          ),
          tableName: this.tableName,
        }),
      });
      return Promise.resolve();
    } catch (err) {
      throw new Error(err);
    }
  }
}

module.exports = function (options) {
  return new RedisContext(options);
};
