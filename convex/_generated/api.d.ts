/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as PasswordResetProvider from "../PasswordResetProvider.js";
import type * as ai_action from "../ai/action.js";
import type * as ai_embeddings from "../ai/embeddings.js";
import type * as ai_mutations from "../ai/mutations.js";
import type * as ai_queries from "../ai/queries.js";
import type * as auth from "../auth.js";
import type * as custom_mutation from "../custom/mutation.js";
import type * as custom_query from "../custom/query.js";
import type * as files from "../files.js";
import type * as fridge from "../fridge.js";
import type * as http from "../http.js";
import type * as ingredients_mutations from "../ingredients/mutations.js";
import type * as ingredients_queries from "../ingredients/queries.js";
import type * as ingredients_validators from "../ingredients/validators.js";
import type * as mealPlanner from "../mealPlanner.js";
import type * as meals_helpers from "../meals/helpers.js";
import type * as meals_mutations from "../meals/mutations.js";
import type * as meals_queries from "../meals/queries.js";
import type * as meals_validators from "../meals/validators.js";
import type * as migrations from "../migrations.js";
import type * as model_mealPlanner from "../model/mealPlanner.js";
import type * as model_shoppingList from "../model/shoppingList.js";
import type * as onboarding_mutations from "../onboarding/mutations.js";
import type * as onboarding_queries from "../onboarding/queries.js";
import type * as planAndList from "../planAndList.js";
import type * as plans from "../plans.js";
import type * as shoppingList from "../shoppingList.js";
import type * as users_queries from "../users/queries.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  PasswordResetProvider: typeof PasswordResetProvider;
  "ai/action": typeof ai_action;
  "ai/embeddings": typeof ai_embeddings;
  "ai/mutations": typeof ai_mutations;
  "ai/queries": typeof ai_queries;
  auth: typeof auth;
  "custom/mutation": typeof custom_mutation;
  "custom/query": typeof custom_query;
  files: typeof files;
  fridge: typeof fridge;
  http: typeof http;
  "ingredients/mutations": typeof ingredients_mutations;
  "ingredients/queries": typeof ingredients_queries;
  "ingredients/validators": typeof ingredients_validators;
  mealPlanner: typeof mealPlanner;
  "meals/helpers": typeof meals_helpers;
  "meals/mutations": typeof meals_mutations;
  "meals/queries": typeof meals_queries;
  "meals/validators": typeof meals_validators;
  migrations: typeof migrations;
  "model/mealPlanner": typeof model_mealPlanner;
  "model/shoppingList": typeof model_shoppingList;
  "onboarding/mutations": typeof onboarding_mutations;
  "onboarding/queries": typeof onboarding_queries;
  planAndList: typeof planAndList;
  plans: typeof plans;
  shoppingList: typeof shoppingList;
  "users/queries": typeof users_queries;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {
  migrations: {
    lib: {
      cancel: FunctionReference<
        "mutation",
        "internal",
        { name: string },
        {
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }
      >;
      cancelAll: FunctionReference<
        "mutation",
        "internal",
        { sinceTs?: number },
        Array<{
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }>
      >;
      clearAll: FunctionReference<
        "mutation",
        "internal",
        { before?: number },
        null
      >;
      getStatus: FunctionReference<
        "query",
        "internal",
        { limit?: number; names?: Array<string> },
        Array<{
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }>
      >;
      migrate: FunctionReference<
        "mutation",
        "internal",
        {
          batchSize?: number;
          cursor?: string | null;
          dryRun: boolean;
          fnHandle: string;
          name: string;
          next?: Array<{ fnHandle: string; name: string }>;
        },
        {
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }
      >;
    };
  };
};
