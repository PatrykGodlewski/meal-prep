import { v } from "convex/values";
import { authQuery } from "../custom/query";
import { query } from "../_generated/server";

/**
 * Get display name for a user (name, or email, or fallback).
 * Used for showing meal author in UI.
 */
export const getUserDisplayName = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return null;
    return user.name ?? user.email ?? "Unknown";
  },
});

/**
 * Get current user's Convex user id (e.g. for passing to actions like meal planner).
 */
export const getCurrentUserId = authQuery({
  args: {},
  handler: async (ctx) => ctx.user.id,
});

/**
 * Get current user info for the sidebar/nav.
 */
export const getCurrentUser = authQuery({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.db.get(ctx.user.id);
    if (!user) return null;
    return {
      name: user.name ?? "User",
      email: user.email ?? "",
      image: user.image,
    };
  },
});
