/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as custom_mutation from "../custom/mutation.js";
import type * as custom_query from "../custom/query.js";
import type * as http from "../http.js";
import type * as ingredients_mutations from "../ingredients/mutations.js";
import type * as ingredients_queries from "../ingredients/queries.js";
import type * as ingredients_validators from "../ingredients/validators.js";
import type * as mealPlans from "../mealPlans.js";
import type * as meals_mutations from "../meals/mutations.js";
import type * as meals_queries from "../meals/queries.js";
import type * as meals_validators from "../meals/validators.js";
import type * as planAndList from "../planAndList.js";
import type * as seed from "../seed.js";
import type * as shoppingList from "../shoppingList.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  "custom/mutation": typeof custom_mutation;
  "custom/query": typeof custom_query;
  http: typeof http;
  "ingredients/mutations": typeof ingredients_mutations;
  "ingredients/queries": typeof ingredients_queries;
  "ingredients/validators": typeof ingredients_validators;
  mealPlans: typeof mealPlans;
  "meals/mutations": typeof meals_mutations;
  "meals/queries": typeof meals_queries;
  "meals/validators": typeof meals_validators;
  planAndList: typeof planAndList;
  seed: typeof seed;
  shoppingList: typeof shoppingList;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
