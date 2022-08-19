/**
 *
 * ConstraintErrorTagsPlugin
 *
 */

import { Plugin, GraphQLErrorExtended } from "postgraphile";
import { GraphQLError } from "graphql";

export const ConstraintErrorTagsPlugin: Plugin;

export function errorForConstraint(
  table: string,
  constraint: string
): string | null;

export function handleErrors(
  errors: readonly GraphQLError[]
): GraphQLErrorExtended[];
