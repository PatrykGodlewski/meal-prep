"use client";

import { usePathname } from "@/i18n/navigation";
import { ConditionalAppShell } from "./ConditionalAppShell";
import { OnboardingGuard } from "./OnboardingGuard";

const AUTH_PAGES = ["/sign-in", "/forgot-password"];

/**
 * Wraps the app: OnboardingGuard + ConditionalAppShell for non-auth pages.
 * Auth pages render children only (no sidebar, no onboarding redirect).
 */
export function AppWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PAGES.some((p) => pathname?.startsWith(p));

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <OnboardingGuard>
      <ConditionalAppShell>{children}</ConditionalAppShell>
    </OnboardingGuard>
  );
}
