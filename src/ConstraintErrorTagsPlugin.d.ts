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
  constraint: null
): string | null;

export function parseErrors(
  errors: readonly GraphQLError[]
): GraphQLErrorExtended[];
