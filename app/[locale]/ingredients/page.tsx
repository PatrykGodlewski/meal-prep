import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { IngredientSearchInput } from "./IngredientSearchInput";
import PaginatedIngredientList from "./PaginatedIngredientList";

const ListSkeleton = () => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 6 }).map((_, index) => (
      <div
        key={index}
        className="flex flex-wrap justify-between gap-8 rounded-lg bg-white p-4 shadow-sm dark:bg-neutral-900"
      >
        <div className="space-y-2">
          <Skeleton className="h-8 w-3/4" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    ))}
  </div>
);

export default async function IngredientsPage() {
  const t = await getTranslations("ingredientList");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-bold text-3xl">{t("header")}</h1>
      </div>

      <IngredientSearchInput />

      <Suspense fallback={<ListSkeleton />}>
        <PaginatedIngredientList />
      </Suspense>
    </div>
  );
}
