import { getAllIngredients } from "@/app/actions";
import AddMealForm from "@/features/meal-editor/form-meal";
import { authorize } from "@/lib/authorization";

export default async function Home() {
  await authorize("/meals/add");
  return (
    <div>
      <AddMealForm ingredientList={(await getAllIngredients()) ?? []} />
    </div>
  );
}
