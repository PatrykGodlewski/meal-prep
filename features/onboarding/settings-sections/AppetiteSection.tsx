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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { api } from "@/convex/_generated/api";
import { DEBOUNCE_MS } from "../constants";
import { type AppetiteValues, appetiteSchema } from "../schemas";

export function AppetiteSection({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: () => void;
}) {
  const t = useTranslations("onboarding.step5");
  const data = useQuery(api.onboarding.queries.getPreferences);
  const updateAppetite = useMutation(api.onboarding.mutations.updateAppetite);
  const [hasSynced, setHasSynced] = useState(false);

  const form = useForm<AppetiteValues>({
    resolver: zodResolver(appetiteSchema),
    defaultValues: { prefersMealPrep: undefined },
  });

  const { run: debouncedSave } = useDebounceFn(
    async (values: AppetiteValues) => {
      await updateAppetite({
        appetite: { prefersMealPrep: values.prefersMealPrep },
      });
    },
    { wait: DEBOUNCE_MS },
  );

  useEffect(() => {
    const a = data?.preferences?.appetite;
    if (!a || hasSynced) return;
    form.reset({ prefersMealPrep: a.prefersMealPrep });
    setHasSynced(true);
  }, [data?.preferences?.appetite, form, hasSynced]);

  const watched = form.watch();
  useEffect(() => {
    if (!hasSynced) return;
    if (watched.prefersMealPrep !== undefined) {
      void debouncedSave(watched);
    }
  }, [watched, debouncedSave, hasSynced]);

  const tOnboarding = useTranslations("onboarding");
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="flex w-full justify-between px-2">
          {tOnboarding("step5.title")}
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
              name="prefersMealPrep"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(v) =>
                        field.onChange(
                          v === "meal_prep"
                            ? true
                            : v === "variety"
                              ? false
                              : undefined,
                        )
                      }
                      value={
                        field.value === true
                          ? "meal_prep"
                          : field.value === false
                            ? "variety"
                            : ""
                      }
                      className="flex flex-col gap-4"
                    >
                      <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50">
                        <RadioGroupItem value="meal_prep" id="meal_prep" />
                        <FormLabel
                          htmlFor="meal_prep"
                          className="flex-1 cursor-pointer font-normal"
                        >
                          <div>{t("prefersMealPrepLabel")}</div>
                          <div className="text-muted-foreground text-sm">
                            {t("prefersMealPrepHelp")}
                          </div>
                        </FormLabel>
                      </div>
                      <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50">
                        <RadioGroupItem value="variety" id="variety" />
                        <FormLabel
                          htmlFor="variety"
                          className="flex-1 cursor-pointer font-normal"
                        >
                          <div>{t("prefersVarietyLabel")}</div>
                          <div className="text-muted-foreground text-sm">
                            {t("prefersVarietyHelp")}
                          </div>
                        </FormLabel>
                      </div>
                    </RadioGroup>
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
