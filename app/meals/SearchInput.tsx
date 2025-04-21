"use client";
import { Input } from "@/components/ui/input";
import { SEARCH_PARAM_KEY } from "@/hooks/use-paginated-meals";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebounceCallback } from "usehooks-ts";

export function SearchInput() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const handleSearch = useDebounceCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set(SEARCH_PARAM_KEY, term);
    } else {
      params.delete(SEARCH_PARAM_KEY);
    }
    router.replace(`${pathname}?${params.toString()}`);
  }, 500);

  return (
    <div className="mb-6">
      <Input
        type="text"
        placeholder="Search meals by name..."
        onChange={(e) => handleSearch(e.target.value)}
        defaultValue={searchParams.get(SEARCH_PARAM_KEY)?.toString()} // Set initial value from URL
        className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
      />
    </div>
  );
}
