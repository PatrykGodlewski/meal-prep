import { db } from "@/supabase";
import { authorize, getUser } from "./authorization";
import { profiles } from "@/supabase/schema";
import { eq } from "drizzle-orm";

export async function getProfile() {
  try {
    const user = await getUser();

    if (!user) {
      console.log("User not authenticated.");
      return null;
    }

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, user.id),
    });

    if (!profile) {
      console.log("No profile found for user:", user.id);
      return null;
    }

    return profile;
  } catch (error) {
    console.error("Error fetching user profile:", error);
  }
}
