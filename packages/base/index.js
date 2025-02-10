const {
  setObjectProperty,
  getObjectProperty,
  normalizePropertyExpression } = require('./util');
const { createStorage } = require('unstorage');

class Q {
  constructor() { this._items = []; }
  enqueue(item) { this._items.push(item); }
  dequeue() { return this._items.shift(); }
  get size() { return this._items.length; }
}

class Queue extends Q {
  constructor() {
    super();
    this._pendingPromise = false;
  }

  enqueue(action) {
    return new Promise((resolve, reject) => {
      super.enqueue({ action, resolve, reject });
      this.dequeue();
    });
  }

  async dequeue() {
    if (this._pendingPromise) { return false };
    let item = super.dequeue();
    if (!item) { return false };

    try {
      this._pendingPromise = true;
      let payload = await item.action(this);
      this._pendingPromise = false;
      item.resolve(payload);
    } catch (error) {
      this._pendingPromise = false;
      item.reject(error);
    } finally {
      this.dequeue();
    }
    return true;
  }
}

class BaseContext {
  constructor(options = {}) {
    this.options = options;
    this.tableName = this.options.tableName || 'nodered';
    delete this.options.tableName;
    delete this.options.settings;
    this.storage = null;
    this.createStorage = createStorage;
    this.queue = new Queue();
  }

  #getKey(scope, key) {
    return `${scope}:${key}`;
  }

  getKeysScope(scope) {
    return scope;
  }

  async open() {
    throw new Error();
  }

  close() {
    return this.queue.enqueue(async () => {
      await this.storage.dispose();
      this.storage = null;
    });
  }

  set(scope, key, value, callback) {
    return this.queue.enqueue(async () => {
      if (!key) { throw new Error('Key is not defined'); }
      if (!callback || typeof callback !== 'function') { throw new Error('Callback is not a function'); }

      if (!Array.isArray(key)) { key = [key]; value = [value]; }
      else if (!Array.isArray(value)) { value = [value]; }

      if (key.length !== value.length) { throw new Error('Number of values don\'t match number of keys'); }

      const data = {};

      try {
        for (let i = 0; i < key.length; i++) {
          const keyParts = normalizePropertyExpression(key[i]);
          const pKey = keyParts[0];
          if (keyParts.length > 1) {
            const hasKey = await this.storage.has(this.#getKey(scope, pKey));
            if (hasKey) {
              data[pKey] = await this.storage.get(this.#getKey(scope, pKey));
            }
          }
          setObjectProperty(data, key[i], value[i], true);
          if (Object.hasOwn(data, pKey)) {
            await this.storage.set(this.#getKey(scope, pKey), data[pKey]);
          } else {
            await this.storage.remove(this.#getKey(scope, pKey));
          }
        };
        callback();
      } catch (err) {
        callback(err);
      }
    });
  }

  get(scope, key, callback) {
    return this.queue.enqueue(async () => {
      if (!key) { throw new Error('Key is not defined'); }
      if (!callback || typeof callback !== 'function') { throw new Error('Callback is not a function'); }

      if (!Array.isArray(key)) { key = [key]; }

      const values = [];

      try {
        for (const k of key) {
          const keyParts = normalizePropertyExpression(k);
          const pKey = keyParts[0];
          let pValue;
          const hasValue = await this.storage.has(this.#getKey(scope, pKey));
          if (hasValue) {
            pValue = await this.storage.get(this.#getKey(scope, pKey));
          }
          if (keyParts.length === 1) {
            values.push(pValue);
          } else {
            values.push(getObjectProperty({ [pKey]: pValue }, k));
          }
        }
      } catch (err) {
        callback(err);
      }

      return callback(null, ...values);
    });
  }

  keys(scope, callback) {
    return this.queue.enqueue(async () => {
      if (!callback || typeof callback !== 'function') { throw new Error('Callback is not a function'); }

      try {
        scope = this.getKeysScope(scope);
        const keys = await this.storage.keys(scope);
        const sKeys = keys.map((k) => k.replace(`${scope}:`, ''));
        callback(null, sKeys);
      } catch (err) {
        callback(err);
      }
    });
  }

  delete(scope) {
    return this.queue.enqueue(async () => {
      try {
        await this.keys(scope, async (err, keys) => {
          if (!err && keys) {
            for (const key of keys) {
              await this.storage.remove(this.#getKey(scope, key));
            }
          }
        });
      } catch (err) {
        console.error(err);
      }
    });
  }

  clean(activeNodes) {
    return this.queue.enqueue(async () => {
      try {
        let dbKeys = await this.storage.keys();
        dbKeys = dbKeys.filter((key) => !key.startsWith("global:"));
        activeNodes.forEach((activeNode) => {
          dbKeys = dbKeys.filter((key) => !key.startsWith(activeNode));
        });
        for (const key of dbKeys) {
          await this.storage.remove(key);
        }
      } catch (err) {
        console.error(err);
      }
    });
  }
}

module.exports = BaseContext;
