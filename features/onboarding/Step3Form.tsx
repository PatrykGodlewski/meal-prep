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
} from "@/components/ui/form";
import { DISH_TYPES } from "@/convex/schema";
import { api } from "@/convex/_generated/api";
import { StepHeader } from "./components/StepHeader";
import { StepNavigation } from "./components/StepNavigation";
import { DEBOUNCE_MS } from "./constants";
import { dishTypesSchema, type DishTypesValues } from "./schemas";

export function Step3Form() {
  const t = useTranslations("onboarding.step3");
  const tCommon = useTranslations("onboarding");
  const router = useRouter();
  const data = useQuery(api.onboarding.queries.getPreferencesForStep, {
    step: 3,
  });
  const saveStep3 = useMutation(api.onboarding.mutations.saveStep3);
  const [hasSynced, setHasSynced] = useState(false);

  const form = useForm<DishTypesValues>({
    resolver: zodResolver(dishTypesSchema),
    defaultValues: {
      preferredTypes: [],
      avoidedTypes: [],
    },
  });

  const { run: debouncedSave } = useDebounceFn(
    async (values: DishTypesValues) => {
      await saveStep3({
        dishTypes: {
          preferredTypes: values.preferredTypes as (typeof DISH_TYPES)[number][],
          avoidedTypes: values.avoidedTypes as (typeof DISH_TYPES)[number][],
        },
      });
    },
    { wait: DEBOUNCE_MS },
  );

  useEffect(() => {
    if (!data?.dishTypes || hasSynced) return;
    const d = data.dishTypes as { preferredTypes?: string[]; avoidedTypes?: string[] };
    form.reset({
      preferredTypes: d.preferredTypes ?? [],
      avoidedTypes: d.avoidedTypes ?? [],
    });
    setHasSynced(true);
  }, [data?.dishTypes, form, hasSynced]);

  const watched = form.watch();
  useEffect(() => {
    if (!hasSynced) return;
    void debouncedSave(watched);
  }, [watched, debouncedSave, hasSynced]);

  const onSubmit = async (values: DishTypesValues) => {
    await saveStep3({
      dishTypes: {
        preferredTypes: values.preferredTypes as (typeof DISH_TYPES)[number][],
        avoidedTypes: values.avoidedTypes as (typeof DISH_TYPES)[number][],
      },
    });
    router.push("/onboarding/step-4");
  };

  return (
    <div className="space-y-6">
      <StepHeader stepKey="step3" />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-6"
        >
          <FormField
            control={form.control}
            name="preferredTypes"
            render={() => (
              <FormItem>
                <FormLabel>{t("preferredTypesLabel")}</FormLabel>
                <FormControl>
                  <div className="flex flex-wrap gap-4 rounded-md border p-4">
                    {DISH_TYPES.filter((d) => d !== "none").map((type) => (
                      <FormField
                        key={type}
                        control={form.control}
                        name="preferredTypes"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={
                                  field.value?.includes(type) &&
                                  !field.value?.includes("none")
                                }
                                onCheckedChange={(checked) => {
                                  const current = field.value ?? [];
                                  const next = checked
                                    ? [...current.filter((x) => x !== "none"), type]
                                    : current.filter((x) => x !== type);
                                  field.onChange(next);
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              {t(`dishTypes.${type}`)}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                    <FormField
                      control={form.control}
                      name="preferredTypes"
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
                            {t("dishTypes.none")}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="avoidedTypes"
            render={() => (
              <FormItem>
                <FormLabel>{t("avoidedTypesLabel")}</FormLabel>
                <FormControl>
                  <div className="flex flex-wrap gap-4 rounded-md border p-4">
                    {DISH_TYPES.filter((d) => d !== "none").map((type) => (
                      <FormField
                        key={type}
                        control={form.control}
                        name="avoidedTypes"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={
                                  field.value?.includes(type) &&
                                  !field.value?.includes("none")
                                }
                                onCheckedChange={(checked) => {
                                  const current = field.value ?? [];
                                  const next = checked
                                    ? [...current.filter((x) => x !== "none"), type]
                                    : current.filter((x) => x !== type);
                                  field.onChange(next);
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              {t(`dishTypes.${type}`)}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                    <FormField
                      control={form.control}
                      name="avoidedTypes"
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
                            {t("dishTypes.none")}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </FormControl>
              </FormItem>
            )}
          />

          <StepNavigation backHref="/onboarding/step-2" />
        </form>
      </Form>
    </div>
  );
}
