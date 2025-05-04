"use client";
import { observable } from "@legendapp/state";
import { use$, useWhenReady } from "@legendapp/state/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { addDays, subDays, isToday } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { getMonday, getSaturday } from "./utils";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { DateRange } from "react-day-picker";
import { FunctionReturnType, FunctionType } from "convex/server";

type Store = {
  currentWeek: Date;
  shoppingListDate: DateRange | undefined;
  selectedPlanId: string | undefined;
};

const today = new Date();
const mealPlannerState$ = observable<Store>({
  currentWeek: getMonday(today),
  shoppingListDate: {
    from: getMonday(today),
    to: getSaturday(today),
  },
  selectedPlanId: undefined,
});

const setCurrentWeek = (date: Date) => {
  mealPlannerState$.currentWeek.set(getMonday(date));
};

const handleNavigatePrevious = () => {
  const currentMonday = getMonday(mealPlannerState$.currentWeek.get());
  const previousWeekStart = subDays(currentMonday, 7);
  mealPlannerState$.currentWeek.set(previousWeekStart);
};

const handleNavigateNext = () => {
  const currentMonday = getMonday(mealPlannerState$.currentWeek.get());
  const nextWeekStart = addDays(currentMonday, 7);
  mealPlannerState$.currentWeek.set(nextWeekStart);
};

export const useMealPlanner = () => {
  const currentWeek = use$(mealPlannerState$.currentWeek);
  const selectedPlanId = use$(mealPlannerState$.selectedPlanId);

  const t = useTranslations("mealPlanner");
  const { toast } = useToast();

  const {
    data: mealPlanData,
    isLoading: isMealPlanLoading,
    error: mealPlanError,
  } = useQuery(
    convexQuery(api.mealPlans.getWeeklyMealPlan, {
      weekStart: currentWeek.getTime(),
    }),
  );

  const {
    data: shoppingListData,
    isLoading: isShoppingListLoading,
    error: shoppingListError,
  } = useQuery(
    convexQuery(api.shoppingList.getShoppingList, {
      startDate: use$(mealPlannerState$.shoppingListDate)?.from?.getTime(),
      endDate: use$(mealPlannerState$.shoppingListDate)?.to?.getTime(),
    }),
  );

  const { mutate: generatePlanAndShoppingListMutate, isPending: isGenerating } =
    useMutation({
      mutationFn: useConvexMutation(
        api.planAndList.generatePlanAndShoppingList,
      ),
      onSuccess: () => {
        toast({
          title: t("toast.successTitle"),
          description: t("generatePlanSuccessDescription"),
        });
      },
      onError: (error) => {
        console.error("Error generating meal plan:", error);
        toast({
          title: t("toast.errorTitle"),
          description:
            error instanceof Error
              ? error.message
              : t("generatePlanErrorUnknown"),
          variant: "destructive",
        });
      },
    });

  const handleGenerateMealPlan = () => {
    const weekStart = mealPlannerState$.currentWeek.get().getTime();
    generatePlanAndShoppingListMutate({ weekStart });
  };

  const { mutate: lockPlanMutate, isPending: isLocking } = useMutation({
    mutationFn: useConvexMutation(api.mealPlans.lockMealPlan),
    onSuccess: (
      data: FunctionReturnType<typeof api.mealPlans.lockMealPlan>,
    ) => {
      toast({
        title: t("toast.successTitle"),
        description: data.locked
          ? t("lockPlanSuccessDescription")
          : t("unlockPlanSuccessDescription"),
      });
    },
    onError: (error) => {
      console.error("Error locking meal plan:", error);
      toast({
        title: t("toast.errorTitle"),
        description:
          error instanceof Error ? error.message : t("lockPlanErrorFallback"),
        variant: "destructive",
      });
    },
  });

  const lockMealPlan = (mealPlanId: Id<"mealPlans">) => {
    lockPlanMutate({ mealPlanId });
  };

  const isBusy = isMealPlanLoading || isShoppingListLoading;

  useWhenReady(mealPlanData, (mealPlans) =>
    mealPlannerState$.selectedPlanId.set(
      mealPlans?.find((plan) => isToday(plan.date))?._id ??
        mealPlans?.find((plan) => plan.date === currentWeek.getTime())?._id,
    ),
  );

  return {
    mealPlannerState$,
    selectedPlanId,
    currentWeek,

    setCurrentWeek,
    handleNavigatePrevious,
    handleNavigateNext,
    handleGenerateMealPlan,
    isGenerating,
    lockMealPlan,
    isLocking,
    isBusy,

    mealPlanData,
    isMealPlanLoading,
    mealPlanError,

    shoppingListData,
    isShoppingListLoading,
    shoppingListError,
  };
};
