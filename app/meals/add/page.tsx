import { getAllIngredients } from "@/app/actions";
import AddMealForm from "@/features/meal-editor/form-meal";

export default async function Home() {
  return (
    <div>
      <AddMealForm ingredientList={(await getAllIngredients()) ?? []} />
    </div>
  );
}
