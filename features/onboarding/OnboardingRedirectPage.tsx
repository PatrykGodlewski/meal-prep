"use client";

import { useQuery } from "convex/react";
import { useEffect } from "react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "@/i18n/navigation";

/**
 * Redirects to the appropriate onboarding step based on user progress.
 */
export function OnboardingRedirectPage() {
  const status = useQuery(api.onboarding.queries.getOnboardingStatus);
  const router = useRouter();

  useEffect(() => {
    if (status === undefined) return;
    const nextStep = status.step + 1;
    if (status.completed) {
      router.replace("/");
      return;
    }
    if (nextStep <= 5) {
      router.replace(`/onboarding/step-${nextStep}`);
    } else {
      router.replace("/onboarding/step-1");
    }
  }, [status?.step, status?.completed, router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <p className="text-muted-foreground">Loading...</p>
    </div>
  );
}
