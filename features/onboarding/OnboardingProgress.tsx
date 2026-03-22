"use client";

import { usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const STEPS = [
  { path: "step-1", label: "1" },
  { path: "step-2", label: "2" },
  { path: "step-3", label: "3" },
  { path: "step-4", label: "4" },
  { path: "step-5", label: "5" },
];

export function OnboardingProgress() {
  const pathname = usePathname();
  const currentIndex = STEPS.findIndex((s) =>
    pathname?.includes(`/onboarding/${s.path}`),
  );
  const activeIndex = currentIndex >= 0 ? currentIndex : 0;

  return (
    <div className="flex items-center justify-center gap-2 py-6">
      {STEPS.map((step, i) => (
        <div
          key={step.path}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full font-medium text-sm transition-colors",
            i < activeIndex && "bg-primary text-primary-foreground",
            i === activeIndex &&
              "border-2 border-primary bg-primary font-bold text-primary-foreground",
            i > activeIndex &&
              "border border-muted-foreground/30 bg-muted/50 text-muted-foreground",
          )}
        >
          {step.label}
        </div>
      ))}
    </div>
  );
}
