import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { GenerateMealWithAI } from "@/features/ai/GenerateMealWithAI";
import AddMealForm from "@/features/meal-editor/form-meal";

export default async function AddMealPage() {
  const preloadedIngredients = await preloadQuery(
    api.ingredients.queries.getIngredients,
    {},
    { token: await convexAuthNextjsToken() },
  );

  return (
    <div>
      <GenerateMealWithAI />
      <AddMealForm preloadedIngredients={preloadedIngredients} />
    </div>
  );
}
