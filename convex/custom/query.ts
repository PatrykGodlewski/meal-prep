import { getAuthUserId } from "@convex-dev/auth/server";
import { customCtx, customQuery } from "convex-helpers/server/customFunctions";
import { query } from "../_generated/server";

export const authQuery = customQuery(
  query,
  customCtx(async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");
    const user = { id: userId };
    return { ...ctx, user };
  }),
);
