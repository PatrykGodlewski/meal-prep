import { db } from "@/supabase";
import { authorize } from "./authorization";
import { profiles } from "@/supabase/schema";
import { eq } from "drizzle-orm";

export async function getProfile() {
  try {
    const user = await authorize();

    if (!user) {
      console.log("User not authenticated.");
      return null; // Or throw an error, depending on your needs
    }

    const profile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .limit(1); // Limit to one result

    if (!profile || profile.length === 0) {
      console.log("No profile found for user:", user.id);
      return null;
    }

    return profile[0]; // Return the first (and only) profile
  } catch (error) {
    console.error("Error fetching user profile:", error);
  }
}
