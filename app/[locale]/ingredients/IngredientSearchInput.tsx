"use client";

import { useDebounceFn } from "ahooks";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { SEARCH_PARAM_KEY } from "@/hooks/use-paginated-ingredients";

export function IngredientSearchInput() {
  const t = useTranslations("searchInput");
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

  return (
    <div className="mb-6">
      <Input
        type="text"
        placeholder={t("searchIngredientsByName")}
        onChange={(e) => handleSearch.run(e.target.value)}
        defaultValue={searchParams.get(SEARCH_PARAM_KEY)?.toString()}
        className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:focus:ring-blue-400 sm:max-w-sm"
      />
    </div>
  );
}
