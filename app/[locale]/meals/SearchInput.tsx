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
} from "@/hooks/use-paginated-meals";
import type { MealCategory } from "@/validators";
import { useDebounceFn } from "ahooks";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function SearchInput() {
  const t = useTranslations("searchInput");
  const tMeal = useTranslations("meal");

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

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    const filter = params.get(FILTER_PARAM_KEY) as MealCategory | null;
    if (filter && !MEAL_CATEGORIES.includes(filter)) {
      router.replace(pathname);
    }
  });

  const currentCategory =
    searchParams.get(FILTER_PARAM_KEY)?.toString() ?? "all";

  return (
    <div className="mb-6 flex flex-col sm:flex-row gap-4">
      <Input
        type="text"
        placeholder={t("searchMealsByName")}
        onChange={(e) => handleSearch.run(e.target.value)}
        defaultValue={searchParams.get(SEARCH_PARAM_KEY)?.toString()}
        className="flex-grow px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
      />
      <Select onValueChange={handleCategoryChange} value={currentCategory}>
        <SelectTrigger className="w-full sm:w-[180px] border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800">
          <SelectValue placeholder={t("filterByCategory")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={"all"}>{tMeal("all")}</SelectItem>
          {MEAL_CATEGORIES.map((category) => (
            <SelectItem key={category} value={category}>
              {tMeal(category)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
