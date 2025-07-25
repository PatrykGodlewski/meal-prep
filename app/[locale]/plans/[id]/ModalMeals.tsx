"use client";
import { useDebounceFn } from "ahooks";
import { Loader2 } from "lucide-react";
import { type ChangeEvent, type ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Id } from "@/convex/_generated/dataModel";
import type { MEAL_CATEGORIES } from "@/convex/schema";
import { usePaginatedMeals } from "@/hooks/use-paginated-meals";

interface ModalMealsProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onMealSelect: (mealId: Id<"meals">) => void;
  trigger?: ReactNode;
  filter?: (typeof MEAL_CATEGORIES)[number];
}

export function ModalMeals({
  isOpen,
  onOpenChange,
  onMealSelect,
  trigger,
  filter,
}: ModalMealsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [inputValue, setInputValue] = useState("");

  const {
    allMeals,
    status,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    loadMore,
  } = usePaginatedMeals({ clientSearch: searchTerm, categoryFilter: filter });

  const debouncedUpdateSearchQuery = useDebounceFn(
    (term: string) => {
      setSearchTerm(term);
    },
    { wait: 300 },
  );

  const handleSelectMeal = (mealId: Id<"meals">) => {
    setSearchTerm("");
    setInputValue("");
    onMealSelect(mealId);
    onOpenChange(false);
  };

  useEffect(() => {
    if (!allMeals.length) loadMore(20);
  }, [allMeals]);

  useEffect(() => {
    if (!isOpen) {
      setInputValue("");
      setSearchTerm("");
    }
  }, [isOpen]);

  const handleInputValue = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    debouncedUpdateSearchQuery.run(newValue);
  };

  const handleClearInput = () => {
    setInputValue("");
    setSearchTerm("");
  };

  return (
    <Dialog modal open={isOpen} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="flex max-h-[80vh] flex-col sm:max-w-[425px] md:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select a Meal</DialogTitle>
          <DialogDescription>
            Search for a meal and click on it to add it to your plan.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 border-b py-4 sm:flex-row sm:gap-2">
          <Input
            placeholder="Search meals by name..."
            value={inputValue}
            onChange={handleInputValue}
          />
          <Button
            className="w-full sm:w-auto sm:basis-1/4"
            onClick={handleClearInput}
          >
            Clear
          </Button>
        </div>
        <div className="grow space-y-2 overflow-y-auto">
          {isFetching && status !== "LoadingMore" && (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {!isFetching && allMeals.length === 0 && (
            <p className="py-4 text-center text-gray-500 dark:text-gray-400">
              No meals found matching your search.
            </p>
          )}

          {allMeals.map((meal) => (
            <div
              key={meal._id}
              className="flex cursor-pointer items-center justify-between rounded-md border p-3 hover:bg-accent hover:text-accent-foreground"
              onClick={() => handleSelectMeal(meal._id)}
              // biome-ignore lint/a11y/useSemanticElements: <explanation>
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleSelectMeal(meal._id);
                }
              }}
            >
              <div>
                <p className="font-medium">{meal.name}</p>
                <div className="flex gap-1">
                  {meal.categories?.map((cat, idx) => (
                    <p
                      key={idx}
                      className="text-muted-foreground text-sm capitalize"
                    >
                      {cat}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {hasNextPage && (
            <Button onClick={() => loadMore(20)} className="mt-2 w-full">
              Load More
            </Button>
          )}

          {isFetchingNextPage && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {!hasNextPage && allMeals.length > 0 && (
            <p className="py-4 text-center text-muted-foreground text-sm">
              No more meals to load.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
