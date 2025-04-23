"use client";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MEAL_CATEGORIES } from "@/convex/schema";
import {
  FILTER_PARAM_KEY,
  SEARCH_PARAM_KEY,
  usePaginatedMeals,
} from "@/hooks/use-paginated-meals";
import { useDebounceFn } from "ahooks";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function SearchInput() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const handleSearch = useDebounceFn(
    (term: string) => {
      const params = new URLSearchParams(searchParams);
      if (term) {
        params.set(SEARCH_PARAM_KEY, term);
      } else {
        params.delete(SEARCH_PARAM_KEY);
      }
      router.replace(`${pathname}?${params.toString()}`);
    },
    { wait: 300 },
  );

  const handleCategoryChange = (category: string) => {
    const params = new URLSearchParams(searchParams);
    if (category && category !== "all") {
      params.set(FILTER_PARAM_KEY, category);
    } else {
      params.delete(FILTER_PARAM_KEY);
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const currentCategory =
    searchParams.get(FILTER_PARAM_KEY)?.toString() ?? "all";

  return (
    <div className="mb-6 flex flex-col sm:flex-row gap-4">
      <Input
        type="text"
        placeholder="Search meals by name..."
        onChange={(e) => handleSearch.run(e.target.value)}
        defaultValue={searchParams.get(SEARCH_PARAM_KEY)?.toString()} // Set initial value from URL
        className="flex-grow px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
      />
      <Select onValueChange={handleCategoryChange} value={currentCategory}>
        <SelectTrigger className="w-full sm:w-[180px] border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800">
          <SelectValue placeholder="Filter by category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={"all"}>{"ALL"}</SelectItem>
          {MEAL_CATEGORIES.map((category) => (
            <SelectItem key={category} value={category}>
              {category.toUpperCase()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
