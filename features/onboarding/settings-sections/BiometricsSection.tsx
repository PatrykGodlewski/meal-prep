"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useDebounceFn } from "ahooks";
import { useMutation, useQuery } from "convex/react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
import { api } from "@/convex/_generated/api";
import { ACTIVITY_LEVELS, PRIMARY_GOALS } from "@/convex/schema";
import { DEBOUNCE_MS } from "../constants";
import { type BiometricsValues, biometricsSchema } from "../schemas";

export function BiometricsSection({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: () => void;
}) {
  const t = useTranslations("onboarding.step1");
  const data = useQuery(api.onboarding.queries.getPreferences);
  const updateBiometrics = useMutation(
    api.onboarding.mutations.updateBiometrics,
  );
  const [hasSynced, setHasSynced] = useState(false);

  const form = useForm<BiometricsValues>({
    resolver: zodResolver(biometricsSchema),
    defaultValues: {
      age: 30,
      gender: "",
      heightCm: undefined,
      weightKg: undefined,
      activityLevel: undefined,
      primaryGoal: undefined,
    },
  });

  const { run: debouncedSave } = useDebounceFn(
    async (values: BiometricsValues) => {
      await updateBiometrics({
        biometrics: {
          age: values.age,
          gender: values.gender || undefined,
          heightCm: values.heightCm ?? undefined,
          weightKg: values.weightKg ?? undefined,
          activityLevel: values.activityLevel as
            | (typeof ACTIVITY_LEVELS)[number]
            | undefined,
          primaryGoal: values.primaryGoal as
            | (typeof PRIMARY_GOALS)[number]
            | undefined,
        },
      });
    },
    { wait: DEBOUNCE_MS },
  );

  useEffect(() => {
    const b = data?.preferences?.biometrics;
    if (!b || hasSynced) return;
    form.reset({
      age: b.age ?? 30,
      gender: b.gender ?? "",
      heightCm: b.heightCm,
      weightKg: b.weightKg,
      activityLevel: b.activityLevel,
      primaryGoal: b.primaryGoal,
    });
    setHasSynced(true);
  }, [data?.preferences?.biometrics, form, hasSynced]);

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
          {tOnboarding("step1.title")}
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
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("ageLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder={t("agePlaceholder")}
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.valueAsNumber ?? e.target.value)
                      }
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("genderLabel")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("genderPlaceholder")} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="heightCm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("heightLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder={t("heightPlaceholder")}
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
              name="weightKg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("weightLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder={t("weightPlaceholder")}
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
              name="activityLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("activityLevelLabel")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("activityLevelPlaceholder")}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ACTIVITY_LEVELS.map((l) => (
                        <SelectItem key={l} value={l}>
                          {t(`activityLevels.${l}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="primaryGoal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("primaryGoalLabel")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("primaryGoalPlaceholder")}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PRIMARY_GOALS.map((g) => (
                        <SelectItem key={g} value={g}>
                          {t(`primaryGoals.${g}`)}
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
