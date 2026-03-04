"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useDebounceFn } from "ahooks";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ALLERGIES, STRICT_DIETS } from "@/convex/schema";
import { api } from "@/convex/_generated/api";
import { StepHeader } from "./components/StepHeader";
import { StepNavigation } from "./components/StepNavigation";
import { DEBOUNCE_MS } from "./constants";
import { dietarySchema, type DietaryValues } from "./schemas";

export function Step2Form() {
  const t = useTranslations("onboarding.step2");
  const router = useRouter();
  const data = useQuery(api.onboarding.queries.getPreferencesForStep, {
    step: 2,
  });
  const saveStep2 = useMutation(api.onboarding.mutations.saveStep2);
  const [hasSynced, setHasSynced] = useState(false);

  const form = useForm<DietaryValues>({
    resolver: zodResolver(dietarySchema),
    defaultValues: {
      strictDiets: [],
      allergies: [],
    },
  });

  const { run: debouncedSave } = useDebounceFn(
    async (values: DietaryValues) => {
      await saveStep2({
        dietary: {
          strictDiets: values.strictDiets as (typeof STRICT_DIETS)[number][],
          allergies: values.allergies as (typeof ALLERGIES)[number][],
        },
      });
    },
    { wait: DEBOUNCE_MS },
  );

  useEffect(() => {
    if (!data?.dietary || hasSynced) return;
    const d = data.dietary as { strictDiets?: string[]; allergies?: string[] };
    form.reset({
      strictDiets: d.strictDiets ?? [],
      allergies: d.allergies ?? [],
    });
    setHasSynced(true);
  }, [data?.dietary, form, hasSynced]);

  const watched = form.watch();
  useEffect(() => {
    if (!hasSynced) return;
    void debouncedSave(watched);
  }, [watched, debouncedSave, hasSynced]);

  const onSubmit = async (values: DietaryValues) => {
    await saveStep2({
      dietary: {
        strictDiets: values.strictDiets as (typeof STRICT_DIETS)[number][],
        allergies: values.allergies as (typeof ALLERGIES)[number][],
      },
    });
    router.push("/onboarding/step-3");
  };

  return (
    <div className="space-y-6">
      <StepHeader stepKey="step2" />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-6"
        >
          <FormField
            control={form.control}
            name="strictDiets"
            render={() => (
              <FormItem>
                <FormLabel>{t("strictDietsLabel")}</FormLabel>
                <FormControl>
                  <div className="flex flex-wrap gap-4 rounded-md border p-4">
                    {STRICT_DIETS.filter((d) => d !== "none").map((diet) => (
                      <FormField
                        key={diet}
                        control={form.control}
                        name="strictDiets"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={
                                  field.value?.includes(diet) &&
                                  !field.value?.includes("none")
                                }
                                onCheckedChange={(checked) => {
                                  const current = field.value ?? [];
                                  const next = checked
                                    ? [...current.filter((x) => x !== "none"), diet]
                                    : current.filter((x) => x !== diet);
                                  field.onChange(next);
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              {t(`diets.${diet}`)}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                    <FormField
                      control={form.control}
                      name="strictDiets"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={
                                field.value?.includes("none") ||
                                (field.value?.length === 0)
                              }
                              onCheckedChange={(checked) => {
                                field.onChange(checked ? ["none"] : []);
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            {t("diets.none")}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="allergies"
            render={() => (
              <FormItem>
                <FormLabel>{t("allergiesLabel")}</FormLabel>
                <FormControl>
                  <div className="flex flex-wrap gap-4 rounded-md border p-4">
                    {ALLERGIES.filter((a) => a !== "none").map((allergy) => (
                      <FormField
                        key={allergy}
                        control={form.control}
                        name="allergies"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={
                                  field.value?.includes(allergy) &&
                                  !field.value?.includes("none")
                                }
                                onCheckedChange={(checked) => {
                                  const current = field.value ?? [];
                                  const next = checked
                                    ? [...current.filter((x) => x !== "none"), allergy]
                                    : current.filter((x) => x !== allergy);
                                  field.onChange(next);
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              {t(`allergies.${allergy}`)}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                    <FormField
                      control={form.control}
                      name="allergies"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={
                                field.value?.includes("none") ||
                                (field.value?.length === 0)
                              }
                              onCheckedChange={(checked) => {
                                field.onChange(checked ? ["none"] : []);
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            {t("allergies.none")}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <StepNavigation backHref="/onboarding/step-1" />
        </form>
      </Form>
    </div>
  );
}
