import { api } from "@/convex/_generated/api";
import AddMealForm from "@/features/meal-editor/form-meal";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { preloadQuery } from "convex/nextjs";

export default async function Home() {
  const preloadedIngredients = await preloadQuery(
    api.ingredients.getIngredients,
    {},
    { token: await convexAuthNextjsToken() },
  );

  return (
    <div>
      <AddMealForm preloadedIngredients={preloadedIngredients} />
    </div>
  );
}
