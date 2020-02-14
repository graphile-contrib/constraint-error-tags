# @graphile-contrib/constraint-error-tags

A PostGraphile plugin for writing nicer error messages on constraints. Adding the `@error <message>` smart tag to constraints will replace generic Postgres constraint violation message.

## Installation:

```bash
npm install --save @graphile-contrib/constraint-error-tags
```

or

```bash
yarn add @graphile-contrib/constraint-error-tags
```

## Usage:

**Library:**

```js
const {
  ConstraintErrorTagsPlugin,
  parseErrors
} = require("@graphile-contrib/constraint-error-tags");

app.use(
  postgraphile(process.env.POSTGRES_ENDPOINT, process.env.POSTGRES_SCHEMA, {
    appendPlugins: [ConstraintErrorTagsPlugin],
    handleErrors: errors => parseErrors(errors)
  })
);
```

- `ConstraintErrorTagsPlugin` introspects all your constraints and extracts the ones with the `@error <message>` smart tag.
- `parseErrors` violating a constraint with the above mentioned signature will replace the generic error with the `<message>` from the `@error` smart tag.

## Example:

SQL schema:

```sql
create table public.user (
  id         serial primary key,
  first_name text not null,
  last_name  text not null,

  age int not null,
  constraint age_check check(age >= 18)
);

comment on constraint "age_check" on "public.user" is '@error The user has to be at least 18 years of age.';
```

GraphQL mutation:

```graphql
mutation {
  createUser(input: { firstName: "John", lastName: "Doe", age: 16 }) {
    clientMutationId
  }
}
```

Response:

GraphQL error with the message: `The user has to be at least 18 years of age.`
