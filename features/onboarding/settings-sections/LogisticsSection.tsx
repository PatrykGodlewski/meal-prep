"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useDebounceFn } from "ahooks";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
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
import { DEBOUNCE_MS } from "../constants";
import { logisticsSchema, type LogisticsValues } from "../schemas";

export function LogisticsSection({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: () => void;
}) {
  const t = useTranslations("onboarding.step4");
  const data = useQuery(api.onboarding.queries.getPreferences);
  const updateLogistics = useMutation(
    api.onboarding.mutations.updateLogistics,
  );
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
      await updateLogistics({
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
    const l = data?.preferences?.logistics;
    if (!l || hasSynced) return;
    form.reset({
      mealsPerDay: l.mealsPerDay,
      snacksPerDay: l.snacksPerDay,
      maxCookingTimeMins: l.maxCookingTimeMins,
      cookingSkillLevel: l.cookingSkillLevel,
      budgetTier: l.budgetTier,
    });
    setHasSynced(true);
  }, [data?.preferences?.logistics, form, hasSynced]);

  const watched = form.watch();
  useEffect(() => {
    if (!hasSynced) return;
    void debouncedSave(watched);
  }, [watched, debouncedSave, hasSynced]);

  const tOnboarding = useTranslations("onboarding");
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="flex w-full justify-between px-2">
          {tOnboarding("step4.title")}
          {open ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Form {...form}>
      <form className="space-y-4 pt-4">
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
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(
                      Number.isNaN(e.target.valueAsNumber)
                        ? undefined
                        : e.target.valueAsNumber,
                    )
                  }
                />
              </FormControl>
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
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(
                      Number.isNaN(e.target.valueAsNumber)
                        ? undefined
                        : e.target.valueAsNumber,
                    )
                  }
                />
              </FormControl>
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
                    <SelectValue
                      placeholder={t("maxCookingTimePlaceholder")}
                    />
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
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cookingSkillLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("cookingSkillLabel")}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("cookingSkillPlaceholder")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {COOKING_SKILLS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`cookingSkills.${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="budgetTier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("budgetLabel")}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("budgetPlaceholder")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {BUDGET_TIERS.map((b) => (
                    <SelectItem key={b} value={b}>
                      {t(`budgets.${b}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      </form>
    </Form>
      </CollapsibleContent>
    </Collapsible>
  );
}
