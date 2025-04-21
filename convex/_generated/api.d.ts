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
import type * as http from "../http.js";
import type * as ingredients from "../ingredients.js";
import type * as mealPlans from "../mealPlans.js";
import type * as meals from "../meals.js";
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
  http: typeof http;
  ingredients: typeof ingredients;
  mealPlans: typeof mealPlans;
  meals: typeof meals;
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
