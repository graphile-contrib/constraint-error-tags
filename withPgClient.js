/**
 *
 * withPgClient
 *
 * Copied from:
 * https://github.com/graphile/graphile-engine/blob/a9746f1d444fa6a39ab18cd983776cd68792c83e/packages/graphile-build-pg/src/withPgClient.js
 *
 */

const { Client, Pool } = require("pg");

function constructorName(obj) {
  return obj && typeof obj.constructor === "function" && obj.constructor.name;
}

// Some duck-typing

function quacksLikePgClient(pgConfig) {
  // A diagnosis of exclusion
  if (!pgConfig || typeof pgConfig !== "object") return false;
  if (constructorName(pgConfig) !== "Client") return false;
  if (typeof pgConfig.connect !== "function") return false;
  if (typeof pgConfig.end !== "function") return false;
  if (typeof pgConfig.escapeLiteral !== "function") return false;
  if (typeof pgConfig.escapeIdentifier !== "function") return false;
  return true;
}

function quacksLikePgPool(pgConfig) {
  // A diagnosis of exclusion
  if (!pgConfig || typeof pgConfig !== "object") return false;
  if (
    constructorName(pgConfig) !== "Pool" &&
    constructorName(pgConfig) !== "BoundPool"
  ) {
    return false;
  }
  if (!pgConfig.Client) return false;
  if (!pgConfig.options) return false;
  if (typeof pgConfig.connect !== "function") return false;
  if (typeof pgConfig.end !== "function") return false;
  if (typeof pgConfig.query !== "function") return false;
  return true;
}

const getPgClientAndReleaserFromConfig = async pgConfig => {
  let releasePgClient = () => {};
  let pgClient;
  if (pgConfig instanceof Client || quacksLikePgClient(pgConfig)) {
    pgClient = pgConfig;
    if (!pgClient.release) {
      throw new Error(
        "We only support PG clients from a PG pool (because otherwise the `await` call can hang indefinitely if an error occurs and there's no error handler)"
      );
    }
  } else if (pgConfig instanceof Pool || quacksLikePgPool(pgConfig)) {
    const pgPool = pgConfig;
    pgClient = await pgPool.connect();

    // .release does not exist on Client?
    releasePgClient = () => pgClient.release();
  } else if (pgConfig === undefined || typeof pgConfig === "string") {
    pgClient = new Client(pgConfig);
    pgClient.on("error", e => {
      // eslint-disable-next-line no-console
      console.error("pgClient error occurred: %s", e);
    });
    releasePgClient = () =>
      new Promise((resolve, reject) =>
        pgClient.end(err => (err ? reject(err) : resolve()))
      );
    await new Promise((resolve, reject) =>
      pgClient.connect(err => (err ? reject(err) : resolve()))
    );
  } else {
    throw new Error(
      "You must provide either a Pool or Client instance or a PostgreSQL connection string."
    );
  }
  return { pgClient, releasePgClient };
};

const withPgClient = async (pgConfig, fn) => {
  if (!fn) {
    throw new Error("Nothing to do!");
  }
  const { pgClient, releasePgClient } = await getPgClientAndReleaserFromConfig(
    pgConfig
  );
  const errorHandler = e => {
    // eslint-disable-next-line no-console
    console.error("withPgClient client error:", e.message);
  };
  pgClient.on("error", errorHandler);
  try {
    return await fn(pgClient);
  } finally {
    pgClient.removeListener("error", errorHandler);
    try {
      await releasePgClient();
    } catch (e) {
      // Failed to release, assuming success
    }
  }
};

module.exports = { withPgClient };
