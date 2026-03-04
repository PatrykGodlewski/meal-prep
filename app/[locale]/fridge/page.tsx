import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import FridgeList from "./FridgeList";
import FridgeAddBar from "./FridgeAddBar";

const FridgeSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <div className="flex-1 space-y-1">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
    </div>
    <div className="space-y-4">
      <Skeleton className="h-6 w-24" />
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg border bg-card p-4"
          >
            <Skeleton className="h-5 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-9 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default async function FridgePage() {
  const t = await getTranslations("fridge");

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6 sm:py-8">
      <header className="mb-8">
        <h1 className="font-bold text-2xl tracking-tight sm:text-3xl">
          {t("header")}
        </h1>
        <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
          {t("description")}
        </p>
      </header>

      <FridgeAddBar />

      <Suspense fallback={<FridgeSkeleton />}>
        <FridgeList />
      </Suspense>
    </div>
  );
}
