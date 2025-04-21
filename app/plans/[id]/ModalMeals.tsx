"use client";
import { useState, useEffect, type ReactNode } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { usePaginatedMeals } from "@/hooks/use-paginated-meals"; // Assuming this path is correct
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react"; // Or your preferred loading spinner
import { useDebounceCallback } from "usehooks-ts";

interface ModalMealsProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onMealSelect: (mealId: Id<"meals">) => void;
  trigger?: ReactNode; // Optional trigger element
  filter?: (meal: Doc<"meals">) => boolean; // Add the filter prop
}

export function ModalMeals({
  isOpen,
  onOpenChange,
  onMealSelect,
  trigger,
  filter,
}: ModalMealsProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const {
    allMeals,
    status,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    loadMore,
  } = usePaginatedMeals({ clientSearch: searchTerm });

  const debouncedUpdateSearchQuery = useDebounceCallback((term: string) => {
    setSearchTerm(term);
  }, 300);

  const handleSelectMeal = (mealId: Id<"meals">) => {
    setSearchTerm(""); // Clear search term on selection
    onMealSelect(mealId);
    onOpenChange(false); // Close modal on selection
  };

  const filteredMeals = filter ? allMeals.filter(filter) : allMeals;

  return (
    <Dialog modal open={isOpen} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px] md:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select a Meal</DialogTitle>
          <DialogDescription>
            Search for a meal and click on it to add it to your plan.
          </DialogDescription>
        </DialogHeader>
        <div className="p-4 border-b">
          <Input
            placeholder="Search meals by name..."
            value={searchTerm}
            onChange={(e) => debouncedUpdateSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex-grow overflow-y-auto p-4 space-y-2">
          {isFetching && status !== "LoadingMore" && (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {!isFetching && allMeals.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">
              No meals found matching your search.
            </p>
          )}

          {filteredMeals.map((meal) => (
            <div
              key={meal._id}
              className="p-3 border rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer flex justify-between items-center"
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
                <p className="text-sm text-muted-foreground capitalize">
                  {meal.category}
                </p>
              </div>
              {/* Optional: Add a select button if preferred over clicking the whole item */}
              {/* <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleSelectMeal(meal._id); }}>Select</Button> */}
            </div>
          ))}

          {/* Load More Trigger */}
          {hasNextPage && (
            <Button onClick={() => loadMore(20)} className="w-full mt-2">
              Load More
            </Button>
          )}

          {isFetchingNextPage && (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {!hasNextPage && allMeals.length > 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">
              No more meals to load.
            </p>
          )}
        </div>
        {/* Footer is optional, Close button can be in header or handled by overlay click */}
        {/* <DialogFooter>
          <DialogClose asChild>
             <Button type="button" variant="secondary">
               Cancel
             </Button>
           </DialogClose>
         </DialogFooter> */}
      </DialogContent>
    </Dialog>
  );
}
