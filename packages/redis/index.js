const BaseContext = require('@zigasebenik/node-red-context-base');
const redisDriver = require('unstorage/drivers/redis')

class RedisContext extends BaseContext {
  async open() {
    try {
      this.options.base = '';
      this.options.keyPrefix ??= 'nr';
      this.storage = this.createStorage({
        driver: redisDriver(this.options),
      });
      return Promise.resolve();
    } catch(err) {
      throw new Error(err);
    }
  }

  getKeysScope(scope) {
    return this.options.keyPrefix
      ? `${this.options.keyPrefix}${scope}`
      : scope;
  }
}

module.exports = function(options) {
    return new RedisContext(options);
};
