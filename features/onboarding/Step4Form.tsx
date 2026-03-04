"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useDebounceFn } from "ahooks";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BUDGET_TIERS,
  COOKING_SKILLS,
  MAX_COOKING_TIME_OPTIONS,
} from "@/convex/schema";
import { api } from "@/convex/_generated/api";
import { StepHeader } from "./components/StepHeader";
import { StepNavigation } from "./components/StepNavigation";
import { DEBOUNCE_MS } from "./constants";
import { logisticsSchema, type LogisticsValues } from "./schemas";

export function Step4Form() {
  const t = useTranslations("onboarding.step4");
  const router = useRouter();
  const data = useQuery(api.onboarding.queries.getPreferencesForStep, {
    step: 4,
  });
  const saveStep4 = useMutation(api.onboarding.mutations.saveStep4);
  const [hasSynced, setHasSynced] = useState(false);

  const form = useForm<LogisticsValues>({
    resolver: zodResolver(logisticsSchema),
    defaultValues: {
      mealsPerDay: undefined,
      snacksPerDay: undefined,
      maxCookingTimeMins: undefined,
      cookingSkillLevel: undefined,
      budgetTier: undefined,
    },
  });

  const { run: debouncedSave } = useDebounceFn(
    async (values: LogisticsValues) => {
      await saveStep4({
        logistics: {
          mealsPerDay: values.mealsPerDay,
          snacksPerDay: values.snacksPerDay,
          maxCookingTimeMins: values.maxCookingTimeMins as
            | (typeof MAX_COOKING_TIME_OPTIONS)[number]
            | undefined,
          cookingSkillLevel: values.cookingSkillLevel as
            | (typeof COOKING_SKILLS)[number]
            | undefined,
          budgetTier: values.budgetTier as
            | (typeof BUDGET_TIERS)[number]
            | undefined,
        },
      });
    },
    { wait: DEBOUNCE_MS },
  );

  useEffect(() => {
    if (!data?.logistics || hasSynced) return;
    const l = data.logistics as {
      mealsPerDay?: number;
      snacksPerDay?: number;
      maxCookingTimeMins?: number;
      cookingSkillLevel?: string;
      budgetTier?: string;
    };
    form.reset({
      mealsPerDay: l.mealsPerDay,
      snacksPerDay: l.snacksPerDay,
      maxCookingTimeMins: l.maxCookingTimeMins,
      cookingSkillLevel: l.cookingSkillLevel,
      budgetTier: l.budgetTier,
    });
    setHasSynced(true);
  }, [data?.logistics, form, hasSynced]);

  const watched = form.watch();
  useEffect(() => {
    if (!hasSynced) return;
    void debouncedSave(watched);
  }, [watched, debouncedSave, hasSynced]);

  const onSubmit = async (values: LogisticsValues) => {
    await saveStep4({
      logistics: {
        mealsPerDay: values.mealsPerDay,
        snacksPerDay: values.snacksPerDay,
        maxCookingTimeMins: values.maxCookingTimeMins as
          | (typeof MAX_COOKING_TIME_OPTIONS)[number]
          | undefined,
        cookingSkillLevel: values.cookingSkillLevel as
          | (typeof COOKING_SKILLS)[number]
          | undefined,
        budgetTier: values.budgetTier as
          | (typeof BUDGET_TIERS)[number]
          | undefined,
      },
    });
    router.push("/onboarding/step-5");
  };

  return (
    <div className="space-y-6">
      <StepHeader stepKey="step4" />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-6"
        >
          <FormField
            control={form.control}
            name="mealsPerDay"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("mealsPerDayLabel")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    placeholder={t("mealsPerDayPlaceholder")}
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const v = e.target.valueAsNumber;
                      field.onChange(Number.isNaN(v) ? undefined : v);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="snacksPerDay"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("snacksPerDayLabel")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    placeholder={t("snacksPerDayPlaceholder")}
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const v = e.target.valueAsNumber;
                      field.onChange(Number.isNaN(v) ? undefined : v);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maxCookingTimeMins"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("maxCookingTimeLabel")}</FormLabel>
                <Select
                  onValueChange={(v) =>
                    field.onChange(v ? Number(v) : undefined)
                  }
                  value={field.value?.toString() ?? ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("maxCookingTimePlaceholder")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {MAX_COOKING_TIME_OPTIONS.map((mins) => (
                      <SelectItem key={mins} value={String(mins)}>
                        {t(`cookingTimes.${mins}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cookingSkillLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("cookingSkillLabel")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("cookingSkillPlaceholder")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {COOKING_SKILLS.map((skill) => (
                      <SelectItem key={skill} value={skill}>
                        {t(`cookingSkills.${skill}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="budgetTier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("budgetLabel")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("budgetPlaceholder")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {BUDGET_TIERS.map((tier) => (
                      <SelectItem key={tier} value={tier}>
                        {t(`budgets.${tier}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <StepNavigation backHref="/onboarding/step-3" />
        </form>
      </Form>
    </div>
  );
}
