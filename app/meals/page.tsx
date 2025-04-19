import Image from "next/image";
import Link from "next/link";
import { Clock, Users, ChefHat, UtensilsCrossed } from "lucide-react";
import type { Meal } from "@/supabase/schema";
import { authorize } from "@/lib/authorization";
import { getMeals } from "../actions";
import { For } from "@/components/for-each";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MealsPage() {
  await authorize("/meals");
  const meals = await getMeals();

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Meals</h1>
        <Link
          href="/meals/add"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Add New Meal
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <For each={meals} empty={<p> Add your first meal </p>}>
          {(meal) => (
            <MealCard key={meal.id} meal={meal} author={meal.createdBy} />
          )}
        </For>
      </div>
    </div>
  );
}

type Props = {
  meal: Meal;
  author?: string | null;
};

function MealCard({ meal, author }: Props) {
  const totalTime = (meal.prepTimeMinutes || 0) + (meal.cookTimeMinutes || 0);

  return (
    <Link href={`/meals/${meal.id}`}>
      <div className="bg-neutral-200 dark:bg-neutral-700 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
        <div className="relative h-48 w-full bg-neutral-200">
          {meal.imageUrl ? (
            <Image
              src={meal.imageUrl}
              alt={meal.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-neutral-400">
              <UtensilsCrossed className="h-12 w-12 text-neutral-600" />
            </div>
          )}
          {meal.category && (
            <span className="absolute uppercase top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
              {meal.category}
            </span>
          )}
        </div>

        <div className="p-4 text-neutral-600 dark:text-neutral-300">
          <h2 className="text-2xl font-semibold mb-2 line-clamp-1">
            {meal.name}
          </h2>
          <p className=" text-sm mb-4 line-clamp-2">{meal.description}</p>

          <div className="flex items-center text-sm mb-3">
            <span className="flex items-center mr-4">
              <Clock className="h-4 w-4 mr-1" />
              {totalTime > 0 ? `${totalTime} min` : "N/A"}
            </span>

            {meal.servings && (
              <span className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {meal.servings} {meal.servings === 1 ? "serving" : "servings"}
              </span>
            )}
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center text-sm ">
              <ChefHat className="h-4 w-4 mr-1" />
              <span>By {author}</span>
            </div>

            <span className="text-xs ">
              {new Date(meal.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
