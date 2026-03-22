import { v } from "convex/values";
import { query } from "./_generated/server";
import { authMutation } from "./custom/mutation";

export const generateUploadUrl = authMutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/** Returns the public URL for a stored file. Use after uploading to get the imageUrl for meal.imageUrl. */
export const getFileUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
