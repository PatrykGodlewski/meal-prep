import { getAuthUserId } from "@convex-dev/auth/server";
import {
  customCtx,
  customMutation,
} from "convex-helpers/server/customFunctions";
import type { Id } from "../_generated/dataModel";
import { type MutationCtx, mutation } from "../_generated/server";

export const authMutation = customMutation(
  mutation,
  customCtx(async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");
    const user = { id: userId };
    return { ...ctx, user } satisfies AuthMutationCtx;
  }),
);


export type AuthMutationCtx = MutationCtx & { user: { id: Id<"users"> } };
