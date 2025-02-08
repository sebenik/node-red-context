const BaseContext = require('@zigasebenik/node-red-context-base');
const { createDatabase } = require('db0');
const dbDriver = require('unstorage/drivers/db0');
const postgresql = require('db0/connectors/postgresql');

class PostgreSQLContext extends BaseContext {
  async open() {
    try {
      this.storage = this.createStorage({
        driver: dbDriver({
          database: createDatabase(
            postgresql(this.options)
          ),
          tableName: this.tableName,
        }),
      });
      return Promise.resolve();
    } catch(err) {
      throw new Error(err);
    }
  }
}

module.exports = function(options) {
    return new PostgreSQLContext(options);
};
