import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { preloadQuery } from "convex/nextjs";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { api } from "@/convex/_generated/api";
import { PlanList } from "./PlanList";

export default async function MealPlansPage() {
  const preloadedPlans = await preloadQuery(
    api.plans.getMealPlans,
    {},
    { token: await convexAuthNextjsToken() },
  );

  if (!preloadedPlans) {
    // TODO: check if should be early returned
    return notFound();
  }

  const t = await getTranslations("planList");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t("header")}</h1>
      </div>
      <PlanList preloadedPlans={preloadedPlans} />
    </div>
  );
}
