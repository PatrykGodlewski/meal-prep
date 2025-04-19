import Link from "next/link";
import { authorize } from "@/lib/authorization";
import PaginatedMealList from "./PaginatedMealList"; // Import the new component
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton for page level suspense
import { SearchInput } from "./SearchInput";

// Keep dynamic for authorization check, but data fetching moves client-side
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Skeleton for the header part while authorization is checked
const HeaderSkeleton = () => (
  <div className="flex justify-between items-center mb-8">
    <Skeleton className="h-9 w-32" />
    <Skeleton className="h-10 w-36" />
  </div>
);

// Skeleton for the initial list loading state
const ListSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: 6 }).map((_, index) => (
      <div
        key={index}
        className="bg-neutral-200 dark:bg-neutral-700 rounded-lg overflow-hidden shadow-md h-full flex flex-col"
      >
        <Skeleton className="h-48 w-full" />
        <div className="p-4 flex flex-col flex-grow">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-5/6 mb-4" />
          <div className="flex items-center text-sm mb-3">
            <Skeleton className="h-4 w-4 mr-1 rounded-full" />
            <Skeleton className="h-4 w-12 mr-4" />
            <Skeleton className="h-4 w-4 mr-1 rounded-full" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex justify-between items-center mt-auto pt-2 border-t border-neutral-300 dark:border-neutral-600">
            <div className="flex items-center text-sm">
              <Skeleton className="h-4 w-4 mr-1 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

interface PageProps {
  searchParams: Promise<{ q: string }>;
}

export default async function MealsPage({ searchParams }: PageProps) {
  // Authorization still happens server-side on page load
  await authorize("/meals");
  // TODO: for initial data to be passed
  // const search = (await searchParams).q;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Meals</h1>
        <Link
          href="/meals/add"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Add New Meal
        </Link>
      </div>

      <SearchInput />

      <Suspense fallback={<ListSkeleton />}>
        <PaginatedMealList />
      </Suspense>
    </div>
  );
}
