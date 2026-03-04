"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useDebounceFn } from "ahooks";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { api } from "@/convex/_generated/api";
import { StepHeader } from "./components/StepHeader";
import { StepNavigation } from "./components/StepNavigation";
import { DEBOUNCE_MS } from "./constants";
import { appetiteSchema, type AppetiteValues } from "./schemas";

export function Step5Form() {
  const t = useTranslations("onboarding.step5");
  const tCommon = useTranslations("onboarding");
  const router = useRouter();
  const data = useQuery(api.onboarding.queries.getPreferencesForStep, {
    step: 5,
  });
  const saveStep5 = useMutation(api.onboarding.mutations.saveStep5);
  const [hasSynced, setHasSynced] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const form = useForm<AppetiteValues>({
    resolver: zodResolver(appetiteSchema),
    defaultValues: {
      prefersMealPrep: undefined,
    },
  });

  const { run: debouncedSave } = useDebounceFn(
    async (values: AppetiteValues) => {
      await saveStep5({
        appetite: {
          prefersMealPrep: values.prefersMealPrep,
        },
      });
    },
    { wait: DEBOUNCE_MS },
  );

  useEffect(() => {
    if (!data?.appetite || hasSynced) return;
    const a = data.appetite as { prefersMealPrep?: boolean };
    form.reset({
      prefersMealPrep: a.prefersMealPrep,
    });
    setHasSynced(true);
  }, [data?.appetite, form, hasSynced]);

  const watched = form.watch();
  useEffect(() => {
    if (!hasSynced) return;
    if (watched.prefersMealPrep === undefined) return;
    void debouncedSave(watched);
  }, [watched, debouncedSave, hasSynced]);

  const onSubmit = async (values: AppetiteValues) => {
    setIsCompleting(true);
    await saveStep5({
      appetite: {
        prefersMealPrep: values.prefersMealPrep,
      },
    });
    router.replace("/");
  };

  return (
    <div className="space-y-6">
      <StepHeader stepKey="step5" />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-6"
        >
          <FormField
            control={form.control}
            name="prefersMealPrep"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <RadioGroup
                    onValueChange={(v) =>
                      field.onChange(v === "meal_prep" ? true : v === "variety" ? false : undefined)
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

          <StepNavigation
            backHref="/onboarding/step-4"
            nextLabel={isCompleting ? tCommon("completing") : tCommon("next")}
            isSubmitting={isCompleting}
          />
        </form>
      </Form>
    </div>
  );
}
