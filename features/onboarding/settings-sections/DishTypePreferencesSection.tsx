"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useDebounceFn } from "ahooks";
import { useMutation, useQuery } from "convex/react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { DISH_TYPES } from "@/convex/schema";
import { api } from "@/convex/_generated/api";
import { DEBOUNCE_MS } from "../constants";
import { dishTypesSchema, type DishTypesValues } from "../schemas";

export function DishTypePreferencesSection({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: () => void;
}) {
  const t = useTranslations("onboarding");
  const tStep = useTranslations("onboarding.step3");
  const data = useQuery(api.onboarding.queries.getPreferences);
  const updateDishTypes = useMutation(
    api.onboarding.mutations.updateDishTypes,
  );
  const [hasSynced, setHasSynced] = useState(false);

  const form = useForm<DishTypesValues>({
    resolver: zodResolver(dishTypesSchema),
    defaultValues: { preferredTypes: [], avoidedTypes: [] },
  });

  const { run: debouncedSave } = useDebounceFn(
    async (values: DishTypesValues) => {
      await updateDishTypes({
        dishTypes: {
          preferredTypes: values.preferredTypes as (typeof DISH_TYPES)[number][],
          avoidedTypes: values.avoidedTypes as (typeof DISH_TYPES)[number][],
        },
      });
    },
    { wait: DEBOUNCE_MS },
  );

  useEffect(() => {
    const d = data?.preferences?.dishTypes;
    if (!d || hasSynced) return;
    form.reset({
      preferredTypes: d.preferredTypes ?? [],
      avoidedTypes: d.avoidedTypes ?? [],
    });
    setHasSynced(true);
  }, [data?.preferences?.dishTypes, form, hasSynced]);

  const watched = form.watch();
  useEffect(() => {
    if (!hasSynced) return;
    void debouncedSave(watched);
  }, [watched, debouncedSave, hasSynced]);

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="flex w-full justify-between px-2">
          {t("step3.title")}
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
              name="preferredTypes"
              render={() => (
                <FormItem>
                  <FormLabel>{tStep("preferredTypesLabel")}</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-4 rounded-md border p-4">
                      {DISH_TYPES.map((type) => (
                        <FormField
                          key={type}
                          control={form.control}
                          name="preferredTypes"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={
                                    type === "none"
                                      ? field.value?.length === 0 ||
                                        field.value?.includes("none")
                                      : field.value?.includes(type) &&
                                        !field.value?.includes("none")
                                  }
                                  onCheckedChange={(checked) => {
                                    if (type === "none") {
                                      field.onChange(checked ? ["none"] : []);
                                    } else {
                                      const current = field.value ?? [];
                                      field.onChange(
                                        checked
                                          ? [...current.filter((x) => x !== "none"), type]
                                          : current.filter((x) => x !== type),
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="cursor-pointer font-normal">
                                {tStep(`dishTypes.${type}`)}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
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
                  <FormLabel>{tStep("avoidedTypesLabel")}</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-4 rounded-md border p-4">
                      {DISH_TYPES.map((type) => (
                        <FormField
                          key={type}
                          control={form.control}
                          name="avoidedTypes"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={
                                    type === "none"
                                      ? field.value?.length === 0 ||
                                        field.value?.includes("none")
                                      : field.value?.includes(type) &&
                                        !field.value?.includes("none")
                                  }
                                  onCheckedChange={(checked) => {
                                    if (type === "none") {
                                      field.onChange(checked ? ["none"] : []);
                                    } else {
                                      const current = field.value ?? [];
                                      field.onChange(
                                        checked
                                          ? [...current.filter((x) => x !== "none"), type]
                                          : current.filter((x) => x !== type),
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="cursor-pointer font-normal">
                                {tStep(`dishTypes.${type}`)}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CollapsibleContent>
    </Collapsible>
  );
}
