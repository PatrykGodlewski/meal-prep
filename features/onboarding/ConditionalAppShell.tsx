"use client";

import { AppHeader } from "@/components/app-header";
import { usePathname } from "@/i18n/navigation";

/**
 * Renders app shell with top header (no sidebar). Full-width content.
 */
export function ConditionalAppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isOnboarding = pathname?.startsWith("/onboarding") ?? false;

  if (isOnboarding) {
    return (
      <main className="flex min-h-screen flex-col">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {children}
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col">
      <AppHeader />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="flex min-h-0 flex-1 flex-col gap-4 py-6 md:gap-6 md:py-8">
          <div className="container min-w-0 flex-1 px-4 md:px-6">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
