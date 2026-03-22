"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useDebounceFn } from "ahooks";
import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
import { api } from "@/convex/_generated/api";
import { ACTIVITY_LEVELS, PRIMARY_GOALS } from "@/convex/schema";
import { useRouter } from "@/i18n/navigation";
import { StepHeader } from "./components/StepHeader";
import { StepNavigation } from "./components/StepNavigation";
import { DEBOUNCE_MS } from "./constants";
import { type BiometricsValues, biometricsSchema } from "./schemas";

export function Step1Form() {
  const t = useTranslations("onboarding.step1");
  const router = useRouter();
  const data = useQuery(api.onboarding.queries.getPreferencesForStep, {
    step: 1,
  });
  const saveStep1 = useMutation(api.onboarding.mutations.saveStep1);
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
      await saveStep1({
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
    if (!data?.biometrics || hasSynced) return;
    const b = data.biometrics as {
      age?: number;
      gender?: string;
      heightCm?: number;
      weightKg?: number;
      activityLevel?: string;
      primaryGoal?: string;
    };
    form.reset({
      age: b.age ?? 30,
      gender: b.gender ?? "",
      heightCm: b.heightCm,
      weightKg: b.weightKg,
      activityLevel: b.activityLevel,
      primaryGoal: b.primaryGoal,
    });
    setHasSynced(true);
  }, [data?.biometrics, form, hasSynced]);

  const watched = form.watch();
  useEffect(() => {
    if (!hasSynced) return;
    void debouncedSave(watched);
  }, [watched, debouncedSave, hasSynced]);

  const onSubmit = async (values: BiometricsValues) => {
    await saveStep1({
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
    router.push("/onboarding/step-2");
  };

  return (
    <div className="space-y-6">
      <StepHeader stepKey="step1" />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-6"
        >
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
                <FormMessage />
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
                <FormMessage />
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
            name="weightKg"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("weightLabel")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder={t("weightPlaceholder")}
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
                    {ACTIVITY_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {t(`activityLevels.${level}`)}
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
                      <SelectValue placeholder={t("primaryGoalPlaceholder")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PRIMARY_GOALS.map((goal) => (
                      <SelectItem key={goal} value={goal}>
                        {t(`primaryGoals.${goal}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <StepNavigation backHref="/onboarding" />
        </form>
      </Form>
    </div>
  );
}
