/**
 *
 * parseTags
 *
 * Copied from:
 * https://github.com/graphile/graphile-engine/blob/a9746f1d444fa6a39ab18cd983776cd68792c83e/packages/graphile-build-pg/src/utils.js
 *
 */

const parseTags = str => {
  return str.split(/\r?\n/).reduce(
    (prev, curr) => {
      if (prev.text !== "") {
        return { ...prev, text: `${prev.text}\n${curr}` };
      }
      const match = curr.match(/^@[a-zA-Z][a-zA-Z0-9_]*($|\s)/);
      if (!match) {
        return { ...prev, text: curr };
      }
      const key = match[0].substr(1).trim();
      const value = match[0] === curr ? true : curr.replace(match[0], "");
      return {
        ...prev,
        tags: {
          ...prev.tags,
          [key]: !Object.prototype.hasOwnProperty.call(prev.tags, key)
            ? value
            : Array.isArray(prev.tags[key])
            ? [...prev.tags[key], value]
            : [prev.tags[key], value]
        }
      };
    },
    {
      tags: {},
      text: ""
    }
  );
};

module.exports = { parseTags };
