"use client";

import { useMutation } from "convex/react";
import { format } from "date-fns";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { For } from "@/components/for-each";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { useDateLocale } from "@/hooks/use-date-locale";
import { usePaginatedIngredients } from "@/hooks/use-paginated-ingredients";

const IngredientCardSkeleton = () => (
  <div className="flex flex-wrap justify-between gap-8 rounded-lg bg-white p-4 shadow-sm transition-shadow dark:bg-neutral-900 dark:shadow-neutral-700">
    <div className="space-y-2">
      <Skeleton className="h-8 w-3/4" />
      <div className="space-y-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
    <div className="flex flex-1 flex-wrap gap-2">
      <Skeleton className="h-10 w-20" />
      <Skeleton className="h-10 w-24" />
    </div>
  </div>
);

export default function PaginatedIngredientList() {
  const {
    allIngredients,
    status,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    loadMoreRef,
  } = usePaginatedIngredients();
  const dateLocale = useDateLocale();
  const t = useTranslations("planList");
  const deleteIngredient = useMutation(
    api.ingredients.mutations.deleteIngredient,
  );

  if (status === "LoadingFirstPage") {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <IngredientCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <For
          each={allIngredients}
          empty={
            !isFetching ? (
              <p className="col-span-full py-10 text-center text-neutral-500 dark:text-neutral-400">
                {t("noIngredients")}
              </p>
            ) : null
          }
        >
          {(ingredient) => (
            <div
              key={ingredient._id}
              className="flex flex-wrap justify-between gap-8 rounded-lg bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:bg-neutral-900 dark:shadow-neutral-700"
            >
              <div className="space-y-2">
                <h2 className="font-semibold text-2xl">{ingredient.name}</h2>
                <div className="space-y-1">
                  <p className="text-neutral-500 text-xs dark:text-neutral-400">
                    {t("createdAt")}:{" "}
                    {format(ingredient.createdAt, "MMMM d, yyyy", {
                      locale: dateLocale,
                    })}
                  </p>
                  <p className="text-neutral-500 text-xs dark:text-neutral-400">
                    {t("lastUpdate")}:{" "}
                    {format(ingredient.updatedAt, "MMMM d, yyyy", {
                      locale: dateLocale,
                    })}
                  </p>
                  <p className="text-neutral-500 text-xs dark:text-neutral-400">
                    {t("id")}: {ingredient._id}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  className="flex-1"
                  variant="destructive"
                  onClick={() =>
                    deleteIngredient({ ingredientId: ingredient._id })
                  }
                >
                  {t("delete")}
                </Button>
                <Button className="flex-1" asChild variant="outline">
                  <Link href={`/ingredients/${ingredient._id}`}>
                    {t("viewIngredient")}
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </For>
        {isFetchingNextPage &&
          Array.from({ length: 3 }).map((_, index) => (
            <IngredientCardSkeleton key={`loading-${index}`} />
          ))}
      </div>

      <div data-loader-ref ref={loadMoreRef} className="h-10" />

      <div className="mt-6 mb-4 flex h-10 items-center justify-center">
        {!isFetchingNextPage && hasNextPage && (
          <span className="text-neutral-500 dark:text-neutral-400">
            Scroll down to load more...
          </span>
        )}
        {!hasNextPage && allIngredients.length > 0 && !isFetching && (
          <span className="text-neutral-500 dark:text-neutral-400">
            You&apos;ve reached the end.
          </span>
        )}
      </div>
    </div>
  );
}
