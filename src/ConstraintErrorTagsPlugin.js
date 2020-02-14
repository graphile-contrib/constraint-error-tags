/**
 *
 * ConstraintErrorTagsPlugin
 *
 */

const { withPgClient } = require("../withPgClient");
const { parseTags } = require("../parseTags");

let constraintsWithErrorTags;

async function ConstraintErrorTagsPlugin(_, { pgConfig }) {
  await withPgClient(pgConfig, async pgClient => {
    const { rows } = await pgClient.query(`
    select
      cls.relname as "table",
      con.conname as "constraint",
      dsc.description as "description"
    from pg_catalog.pg_constraint as con
      inner join pg_catalog.pg_class as cls on cls.oid = con.conrelid
      -- we inner join pg_description because we want only constraints with descriptions
      inner join pg_catalog.pg_description as dsc on dsc.objoid = con.oid
    where con.contype in ('f', 'p', 'u', 'c')`);

    constraintsWithErrorTags = rows
      .map(({ description, ...rest }) => {
        const error = parseTags(description).tags.error;
        if (typeof error !== "string") {
          throw new Error(
            `ConstraintErrorTagsPlugin: expected error smart tag on "${rest.constraint}" to be a string, but got: ${error}.`
          );
        }
        return {
          ...rest,
          error
        };
      })
      .filter(({ error }) => Boolean(error));
  });
}

function errorForConstraint(table, constraint) {
  const con = constraintsWithErrorTags.find(
    con => con.table === table && con.constraint === constraint
  );
  return (con && con.error) || null;
}

function parseErrors(errors) {
  return errors.map(err => {
    const { originalError } = err;
    const { table, constraint } = originalError || {};
    if (table && constraint) {
      const message = errorForConstraint(table, constraint);
      if (message) {
        return {
          ...err,
          message
        };
      }
    }
    return err;
  });
}

module.exports = {
  ConstraintErrorTagsPlugin,
  errorForConstraint,
  parseErrors
};
