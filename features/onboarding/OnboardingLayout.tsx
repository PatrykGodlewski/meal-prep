import type { PropsWithChildren } from "react";
import { OnboardingProgress } from "./OnboardingProgress";
import { OnboardingRouteGuard } from "./OnboardingRouteGuard";

export function OnboardingLayout({ children }: PropsWithChildren) {
  return (
    <OnboardingRouteGuard>
      <div className="mx-auto flex w-full max-w-2xl flex-col px-4 pb-12 pt-4">
        <OnboardingProgress />
        {children}
      </div>
    </OnboardingRouteGuard>
  );
}
