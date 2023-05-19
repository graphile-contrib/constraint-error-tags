/**
 *
 * ConstraintErrorTagsPlugin
 *
 */

const { withPgClient, parseTags } = require("graphile-build-pg");

let constraintsWithErrorTags;

async function ConstraintErrorTagsPlugin(_, { pgConfig }) {
  await withPgClient(pgConfig, async (pgClient) => {
    const { rows } = await pgClient.query(`
    select
      cls.relname as "table",
      typ.typname as "type",
      con.conname as "constraint",
      dsc.description as "description"
    from pg_catalog.pg_constraint as con
      left join pg_catalog.pg_class as cls on cls.oid = con.conrelid
      left join pg_catalog.pg_type as typ on typ.oid = con.contypid
      -- we inner join pg_description because we want only constraints with descriptions
      inner join pg_catalog.pg_description as dsc on dsc.objoid = con.oid
    where con.contype in ('f', 'p', 'u', 'c')`);

    constraintsWithErrorTags = rows
      .map(({ description, ...rest }) => {
        const error = parseTags(description).tags.error;
        if (error) {
          if (typeof error !== "string") {
            throw new Error(
              `ConstraintErrorTagsPlugin: expected error smart tag on "${rest.constraint}" to be a string, but got: ${error}.`
            );
          }
          return {
            ...rest,
            error,
          };
        }
        return rest;
      })
      .filter(({ error }) => Boolean(error));
  });
}

function errorForTableConstraint(table, constraint) {
  const con = constraintsWithErrorTags.find(
    (con) => con.table === table && con.constraint === constraint
  );
  return (con && con.error) || null;
}

function errorForTypeConstraint(type, constraint) {
  const con = constraintsWithErrorTags.find(
    (con) => con.type === type && con.constraint === constraint
  );
  return (con && con.error) || null;
}

function handleErrors(errors) {
  return errors.map((err) => {
    const { originalError } = err;
    const { table, dataType, constraint } = originalError || {};
    if (constraint) {
      if (table) {
        var message = errorForTableConstraint(table, constraint);
      }
      if (dataType) {
        var message = errorForTypeConstraint(dataType, constraint);  
      }
      if (message) {
        return {
          ...err,
          message,
        };
      }
    }
    return err;
  });
}

module.exports = {
  ConstraintErrorTagsPlugin,
  errorForTableConstraint,
  errorForTypeConstraint,
  handleErrors,
};
