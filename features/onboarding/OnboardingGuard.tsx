"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useEffect } from "react";
import { api } from "@/convex/_generated/api";

/**
 * Redirects logged-in users who haven't completed onboarding to /onboarding.
 * Does not run for unauthenticated users (middleware redirects them to sign-in).
 */
export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useConvexAuth();
  const status = useQuery(
    api.onboarding.queries.getOnboardingStatus,
    isAuthenticated ? {} : "skip",
  );
  const pathname = usePathname();
  const router = useRouter();

  const isOnboardingPage = pathname?.startsWith("/onboarding") ?? false;

  useEffect(() => {
    if (!isAuthenticated) return;
    if (status === undefined) return;
    if (status.completed) return;
    if (isOnboardingPage) return;
    router.replace("/onboarding");
  }, [isAuthenticated, status?.completed, isOnboardingPage, router]);

  return <>{children}</>;
}
