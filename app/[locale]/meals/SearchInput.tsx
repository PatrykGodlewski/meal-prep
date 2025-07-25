"use client";
import { useDebounceFn } from "ahooks";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
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
    <div className="mb-6 flex flex-col gap-4 sm:flex-row">
      <Input
        type="text"
        placeholder={t("searchMealsByName")}
        onChange={(e) => handleSearch.run(e.target.value)}
        defaultValue={searchParams.get(SEARCH_PARAM_KEY)?.toString()}
        className="grow rounded-md border border-neutral-300 bg-white px-4 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:focus:ring-blue-400"
      />
      <Select onValueChange={handleCategoryChange} value={currentCategory}>
        <SelectTrigger className="w-full border-neutral-300 bg-white sm:w-[180px] dark:border-neutral-600 dark:bg-neutral-800">
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
