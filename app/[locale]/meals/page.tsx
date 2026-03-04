import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton for page level suspense
import { GenerateMealWithAI } from "@/features/ai/GenerateMealWithAI";
import PaginatedMealList from "./PaginatedMealList"; // Import the new component
import { SearchInput } from "./SearchInput";

const ListSkeleton = () => (
  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 6 }).map((_, index) => (
      <div
        key={index}
        className="flex h-full flex-col overflow-hidden rounded-lg bg-neutral-200 shadow-md dark:bg-neutral-700"
      >
        <Skeleton className="h-48 w-full" />
        <div className="flex grow flex-col p-4">
          <Skeleton className="mb-2 h-6 w-3/4" />
          <Skeleton className="mb-1 h-4 w-full" />
          <Skeleton className="mb-4 h-4 w-5/6" />
          <div className="mb-3 flex items-center text-sm">
            <Skeleton className="mr-1 h-4 w-4 rounded-full" />
            <Skeleton className="mr-4 h-4 w-12" />
            <Skeleton className="mr-1 h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="mt-auto flex items-center justify-between border-neutral-300 border-t pt-2 dark:border-neutral-600">
            <div className="flex items-center text-sm">
              <Skeleton className="mr-1 h-4 w-4 rounded-full" />
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
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-bold text-3xl">{t("meals")}</h1>
        <Link
          href="/meals/add"
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
        >
          {t("addMeal")}
        </Link>
      </div>

      <GenerateMealWithAI />

      <SearchInput />

      <Suspense fallback={<ListSkeleton />}>
        <PaginatedMealList />
      </Suspense>
    </div>
  );
}
