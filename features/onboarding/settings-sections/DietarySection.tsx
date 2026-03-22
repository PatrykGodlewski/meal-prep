"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useDebounceFn } from "ahooks";
import { useMutation, useQuery } from "convex/react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
import { api } from "@/convex/_generated/api";
import { ALLERGIES, STRICT_DIETS } from "@/convex/schema";
import { DEBOUNCE_MS } from "../constants";
import { type DietaryValues, dietarySchema } from "../schemas";

export function DietarySection({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: () => void;
}) {
  const t = useTranslations("onboarding.step2");
  const data = useQuery(api.onboarding.queries.getPreferences);
  const updateDietary = useMutation(api.onboarding.mutations.updateDietary);
  const [hasSynced, setHasSynced] = useState(false);

  const form = useForm<DietaryValues>({
    resolver: zodResolver(dietarySchema),
    defaultValues: { strictDiets: [], allergies: [] },
  });

  const { run: debouncedSave } = useDebounceFn(
    async (values: DietaryValues) => {
      await updateDietary({
        dietary: {
          strictDiets: values.strictDiets as (typeof STRICT_DIETS)[number][],
          allergies: values.allergies as (typeof ALLERGIES)[number][],
        },
      });
    },
    { wait: DEBOUNCE_MS },
  );

  useEffect(() => {
    const d = data?.preferences?.dietary;
    if (!d || hasSynced) return;
    form.reset({
      strictDiets: d.strictDiets ?? [],
      allergies: d.allergies ?? [],
    });
    setHasSynced(true);
  }, [data?.preferences?.dietary, form, hasSynced]);

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
          {tOnboarding("step2.title")}
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
              name="strictDiets"
              render={() => (
                <FormItem>
                  <FormLabel>{t("strictDietsLabel")}</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-4 rounded-md border p-4">
                      {STRICT_DIETS.map((diet) => (
                        <FormField
                          key={diet}
                          control={form.control}
                          name="strictDiets"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={
                                    diet === "none"
                                      ? field.value?.length === 0 ||
                                        field.value?.includes("none")
                                      : field.value?.includes(diet) &&
                                        !field.value?.includes("none")
                                  }
                                  onCheckedChange={(checked) => {
                                    if (diet === "none") {
                                      field.onChange(checked ? ["none"] : []);
                                    } else {
                                      const current = field.value ?? [];
                                      field.onChange(
                                        checked
                                          ? [
                                              ...current.filter(
                                                (x) => x !== "none",
                                              ),
                                              diet,
                                            ]
                                          : current.filter((x) => x !== diet),
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="cursor-pointer font-normal">
                                {t(`diets.${diet}`)}
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
              name="allergies"
              render={() => (
                <FormItem>
                  <FormLabel>{t("allergiesLabel")}</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-4 rounded-md border p-4">
                      {ALLERGIES.map((a) => (
                        <FormField
                          key={a}
                          control={form.control}
                          name="allergies"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={
                                    a === "none"
                                      ? field.value?.length === 0 ||
                                        field.value?.includes("none")
                                      : field.value?.includes(a) &&
                                        !field.value?.includes("none")
                                  }
                                  onCheckedChange={(checked) => {
                                    if (a === "none") {
                                      field.onChange(checked ? ["none"] : []);
                                    } else {
                                      const current = field.value ?? [];
                                      field.onChange(
                                        checked
                                          ? [
                                              ...current.filter(
                                                (x) => x !== "none",
                                              ),
                                              a,
                                            ]
                                          : current.filter((x) => x !== a),
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="cursor-pointer font-normal">
                                {t(`allergies.${a}`)}
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
