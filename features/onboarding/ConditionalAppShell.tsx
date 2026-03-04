"use client";

import { usePathname } from "@/i18n/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

/**
 * Renders app shell with sidebar for main app, or full-width for onboarding.
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
    <main className="flex flex-col gap-8">
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div
            data-scroll-container
            className="flex min-h-0 flex-1 flex-col overflow-y-auto"
          >
            <div className="@container/main flex min-h-0 flex-1 flex-col gap-2">
              <div className="flex min-h-0 flex-1 flex-col gap-4 pt-4 md:gap-6 md:py-6">
                <div className="container min-w-0 flex-1">{children}</div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </main>
  );
}
