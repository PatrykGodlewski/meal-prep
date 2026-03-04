import type { PropsWithChildren } from "react";
import { OnboardingLayout as OnboardingLayoutComponent } from "@/features/onboarding";

export default function OnboardingLayout({ children }: PropsWithChildren) {
  return <OnboardingLayoutComponent>{children}</OnboardingLayoutComponent>;
}
