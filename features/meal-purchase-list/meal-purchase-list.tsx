import IngredientList from "./ingredient-todo-list.client";

export default async function ShoppingListPage() {
  const ingredients = await fetchIngredients();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Shopping List</h1>
      <IngredientList ingredients={ingredients} />
    </div>
  );
}
