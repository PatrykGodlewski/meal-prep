"use client";
import { useDebounceFn } from "ahooks";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ChangeEvent, type ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [showAllMeals, setShowAllMeals] = useState(false);

  const t = useTranslations("modalMeals");

  const effectiveFilter = showAllMeals ? undefined : filter;

  const {
    allMeals,
    status,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    loadMoreRef,
  } = usePaginatedMeals({
    clientSearch: searchTerm,
    categoryFilter: effectiveFilter,
    enabled: isOpen,
  });

  const debouncedUpdateSearchQuery = useDebounceFn(
    (term: string) => {
      setSearchTerm(term);
    },
    { wait: 300 },
  );

  const handleSelectMeal = (mealId: Id<"meals">) => {
    setSearchTerm("");
    setInputValue("");
    setShowAllMeals(false);
    onMealSelect(mealId);
    onOpenChange(false);
  };

  useEffect(() => {
    if (!isOpen) {
      setInputValue("");
      setSearchTerm("");
      setShowAllMeals(false);
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
      <DialogContent className="!flex max-h-[80vh] flex-col overflow-y-auto sm:max-w-[425px] md:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 border-b py-4 sm:flex-row sm:gap-2">
          <Input
            placeholder={t("searchPlaceholder")}
            value={inputValue}
            onChange={handleInputValue}
          />
          <Button
            className="w-full sm:w-auto sm:basis-1/4"
            onClick={handleClearInput}
          >
            {t("clear")}
          </Button>
        </div>
        {filter && (
          <div className="flex items-center space-x-2 border-b pb-4">
            <Checkbox
              id="show-all-meals"
              checked={showAllMeals}
              onCheckedChange={(checked) => setShowAllMeals(checked === true)}
            />
            <label
              htmlFor="show-all-meals"
              className="cursor-pointer font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {t("showAllMeals")}
            </label>
          </div>
        )}
        <div
          data-scroll-container
          className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pb-4"
        >
          {isFetching && status !== "LoadingMore" && (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {!isFetching && allMeals.length === 0 && (
            <p className="py-4 text-center text-gray-500 dark:text-gray-400">
              {t("noMealsFound")}
            </p>
          )}

          {allMeals.map((meal) => (
            <button
              type="button"
              key={meal._id}
              className="flex w-full cursor-pointer items-center justify-between rounded-md border p-3 text-left hover:bg-accent hover:text-accent-foreground"
              onClick={() => handleSelectMeal(meal._id)}
            >
              <div>
                <p className="font-medium">{meal.name}</p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  {meal.categories?.map((cat, idx) => (
                    <span
                      key={idx}
                      className="text-muted-foreground text-sm capitalize"
                    >
                      {cat}
                    </span>
                  ))}
                  {meal.calories != null && (
                    <span className="text-muted-foreground text-sm">
                      • {meal.calories} kcal
                      {meal.servings && meal.servings > 1 ? ` / serving` : ""}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}

          <div ref={loadMoreRef} className="h-4 min-h-4" aria-hidden />

          {isFetchingNextPage && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {!hasNextPage && allMeals.length > 0 && (
            <p className="py-4 text-center text-muted-foreground text-sm">
              {t("noMoreMeals")}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
