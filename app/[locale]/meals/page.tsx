import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton for page level suspense
import PaginatedMealList from "./PaginatedMealList"; // Import the new component
import { SearchInput } from "./SearchInput";

const ListSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: 6 }).map((_, index) => (
      <div
        key={index}
        className="bg-neutral-200 dark:bg-neutral-700 rounded-lg overflow-hidden shadow-md h-full flex flex-col"
      >
        <Skeleton className="h-48 w-full" />
        <div className="p-4 flex flex-col grow">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-5/6 mb-4" />
          <div className="flex items-center text-sm mb-3">
            <Skeleton className="h-4 w-4 mr-1 rounded-full" />
            <Skeleton className="h-4 w-12 mr-4" />
            <Skeleton className="h-4 w-4 mr-1 rounded-full" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex justify-between items-center mt-auto pt-2 border-t border-neutral-300 dark:border-neutral-600">
            <div className="flex items-center text-sm">
              <Skeleton className="h-4 w-4 mr-1 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default async function MealsPage() {
  const t = await getTranslations("mealList");
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{t("meals")}</h1>
        <Link
          href="/meals/add"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          {t("addMeal")}
        </Link>
      </div>

      <SearchInput />

      <Suspense fallback={<ListSkeleton />}>
        <PaginatedMealList />
      </Suspense>
    </div>
  );
}
