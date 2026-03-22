"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { type PropsWithChildren, useEffect } from "react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "@/i18n/navigation";

/**
 * Protects onboarding routes:
 * - Not logged in → redirect to sign-in
 * - Already completed onboarding → redirect to /
 */
export function OnboardingRouteGuard({ children }: PropsWithChildren) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const status = useQuery(
    api.onboarding.queries.getOnboardingStatus,
    isAuthenticated ? {} : "skip",
  );
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/sign-in");
      return;
    }
    if (status === undefined) return;
    if (status.completed) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, status?.completed, router]);

  const isBlocked =
    isLoading || !isAuthenticated || status === undefined || status.completed;

  if (isBlocked) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return <>{children}</>;
}
