function createError(code, message) {
  const e = new Error(message);
  e.code = code;
  return e;
}

function getObjectProperty(msg,expr) {
    let result = null;
    let msgPropParts = normalizePropertyExpression(expr, msg);
    msgPropParts.reduce(function(obj, key) {
        result = (typeof obj[key] !== "undefined" ? obj[key] : undefined);
        return result;
    }, msg);
    return result;
}

function getMessageProperty(msg,expr) {
    if (expr.indexOf('msg.')===0) {
        expr = expr.substring(4);
    }
    return getObjectProperty(msg,expr);
}

function normalizePropertyExpression(str, msg, toString) {
  const length = str.length;
  if (length === 0) {
    throw createError("INVALID_EXPR", "Invalid property expression: zero-length");
  }
  const parts = [];
  let start = 0;
  let inString = false;
  let inBox = false;
  let quoteChar;
  let v;
  for (let i = 0; i < length; i++) {
    const c = str[i];
    if (!inString) {
      if (c === "'" || c === '"') {
        if (i != start) {
          throw createError("INVALID_EXPR", "Invalid property expression: unexpected " + c + " at position " + i);
        }
        inString = true;
        quoteChar = c;
        start = i + 1;
      } else if (c === '.') {
        if (i === 0) {
          throw createError("INVALID_EXPR", "Invalid property expression: unexpected . at position 0");
        }
        if (start != i) {
          v = str.substring(start, i);
          if (/^\d+$/.test(v)) {
            parts.push(parseInt(v));
          } else {
            parts.push(v);
          }
        }
        if (i === length - 1) {
          throw createError("INVALID_EXPR", "Invalid property expression: unterminated expression");
        }
        // Next char is first char of an identifier: a-z 0-9 $ _
        if (!/[a-z0-9\$\_]/i.test(str[i + 1])) {
          throw createError("INVALID_EXPR", "Invalid property expression: unexpected " + str[i + 1] + " at position " + (i + 1));
        }
        start = i + 1;
      } else if (c === '[') {
        if (i === 0) {
          throw createError("INVALID_EXPR", "Invalid property expression: unexpected " + c + " at position " + i);
        }
        if (start != i) {
          parts.push(str.substring(start, i));
        }
        if (i === length - 1) {
          throw createError("INVALID_EXPR", "Invalid property expression: unterminated expression");
        }
        // Start of a new expression. If it starts with msg it is a nested expression
        // Need to scan ahead to find the closing bracket
        if (/^msg[.\[]/.test(str.substring(i + 1))) {
          let depth = 1;
          let inLocalString = false;
          let localStringQuote;
          for (let j = i + 1; j < length; j++) {
            if (/["']/.test(str[j])) {
              if (inLocalString) {
                if (str[j] === localStringQuote) {
                  inLocalString = false
                }
              } else {
                inLocalString = true;
                localStringQuote = str[j]
              }
            }
            if (str[j] === '[') {
              depth++;
            } else if (str[j] === ']') {
              depth--;
            }
            if (depth === 0) {
              try {
                if (msg) {
                  const crossRefProp = getMessageProperty(msg, str.substring(i + 1, j));
                  if (typeof crossRefProp === 'undefined') {
                    throw createError("INVALID_EXPR", "Invalid expression: undefined reference at position " + (i + 1) + " : " + str.substring(i + 1, j))
                  }
                  parts.push(crossRefProp)
                } else {
                  parts.push(normalizePropertyExpression(str.substring(i + 1, j), msg));
                }
                inBox = false;
                i = j;
                start = j + 1;
                break;
              } catch (err) {
                throw createError("INVALID_EXPR", "Invalid expression started at position " + (i + 1))
              }
            }
          }
          if (depth > 0) {
            throw createError("INVALID_EXPR", "Invalid property expression: unmatched '[' at position " + i);
          }
          continue;
        } else if (!/["'\d]/.test(str[i + 1])) {
          // Next char is either a quote or a number
          throw createError("INVALID_EXPR", "Invalid property expression: unexpected " + str[i + 1] + " at position " + (i + 1));
        }
        start = i + 1;
        inBox = true;
      } else if (c === ']') {
        if (!inBox) {
          throw createError("INVALID_EXPR", "Invalid property expression: unexpected " + c + " at position " + i);
        }
        if (start != i) {
          v = str.substring(start, i);
          if (/^\d+$/.test(v)) {
            parts.push(parseInt(v));
          } else {
            throw createError("INVALID_EXPR", "Invalid property expression: unexpected array expression at position " + start);
          }
        }
        start = i + 1;
        inBox = false;
      } else if (c === ' ') {
        throw createError("INVALID_EXPR", "Invalid property expression: unexpected ' ' at position " + i);
      }
    } else {
      if (c === quoteChar) {
        if (i - start === 0) {
          throw createError("INVALID_EXPR", "Invalid property expression: zero-length string at position " + start);
        }
        parts.push(str.substring(start, i));
        // If inBox, next char must be a ]. Otherwise it may be [ or .
        if (inBox && !/\]/.test(str[i + 1])) {
          throw createError("INVALID_EXPR", "Invalid property expression: unexpected array expression at position " + start);
        } else if (!inBox && i + 1 !== length && !/[\[\.]/.test(str[i + 1])) {
          throw createError("INVALID_EXPR", "Invalid property expression: unexpected " + str[i + 1] + " expression at position " + (i + 1));
        }
        start = i + 1;
        inString = false;
      }
    }

  }
  if (inBox || inString) {
    throw createError("INVALID_EXPR", "Invalid property expression: unterminated expression");
  }
  if (start < length) {
    parts.push(str.substring(start));
  }

  if (toString) {
    let result = parts.shift();
    while (parts.length > 0) {
      let p = parts.shift();
      if (typeof p === 'string') {
        if (/"/.test(p)) {
          p = "'" + p + "'";
        } else {
          p = '"' + p + '"';
        }
      }
      result = result + "[" + p + "]";
    }
    return result;
  }

  return parts;
}

function setObjectProperty(msg, prop, value, createMissing) {
  if (typeof createMissing === 'undefined') {
    createMissing = (typeof value !== 'undefined');
  }
  let msgPropParts = normalizePropertyExpression(prop, msg);
  const length = msgPropParts.length;
  let obj = msg;
  let key;
  for (let i = 0; i < length - 1; i++) {
    key = msgPropParts[i];
    if (typeof key === 'string' || (typeof key === 'number' && !Array.isArray(obj))) {
      if (hasOwnProperty.call(obj, key)) {
        if (length > 1 && ((typeof obj[key] !== "object" && typeof obj[key] !== "function") || obj[key] === null)) {
          // Break out early as we cannot create a property beneath
          // this type of value
          return false;
        }
        obj = obj[key];
      } else if (createMissing) {
        if (typeof msgPropParts[i + 1] === 'string') {
          obj[key] = {};
        } else {
          obj[key] = [];
        }
        obj = obj[key];
      } else {
        return false;
      }
    } else if (typeof key === 'number') {
      // obj is an array
      if (typeof obj[key] === 'undefined') {
        if (createMissing) {
          if (typeof msgPropParts[i + 1] === 'string') {
            obj[key] = {};
          } else {
            obj[key] = [];
          }
          obj = obj[key];
        } else {
          return false;
        }
      } else {
        obj = obj[key];
      }
    }
  }
  key = msgPropParts[length - 1];
  if (typeof value === "undefined") {
    if (typeof key === 'number' && Array.isArray(obj)) {
      obj.splice(key, 1);
    } else {
      delete obj[key]
    }
  } else {
    if (typeof obj === "object" && obj !== null) {
      obj[key] = value;
    } else {
      // Cannot set a property of a non-object/array
      return false;
    }
  }
  return true;
}

module.exports = {
  setObjectProperty,
  getObjectProperty,
  normalizePropertyExpression,
}