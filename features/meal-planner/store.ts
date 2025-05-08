"use client";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { batch, observable, syncState } from "@legendapp/state";
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";
import { use$, useWhenReady } from "@legendapp/state/react";
import { syncObservable } from "@legendapp/state/sync";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { FunctionReturnType } from "convex/server";
import { addDays, isToday, subDays } from "date-fns";
import { useTranslations } from "next-intl";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { getMonday, getSaturday } from "./utils";

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

syncObservable(mealPlannerState$, {
  persist: {
    name: "persistKey",
    plugin: ObservablePersistLocalStorage,
  },
});

const setCurrentWeek = (date: Date) => {
  mealPlannerState$.currentWeek.set(getMonday(date));
};

const handleNavigatePrevious = () => {
  const currentMonday = getMonday(mealPlannerState$.currentWeek.get());
  const previousWeekStart = subDays(currentMonday, 7);
  batch(() => {
    mealPlannerState$.selectedPlanId.set(undefined);
    mealPlannerState$.currentWeek.set(previousWeekStart);
    mealPlannerState$.shoppingListDate.set({
      from: previousWeekStart,
      to: addDays(previousWeekStart, 6),
    });
  });
};

const handleNavigateNext = () => {
  const currentMonday = getMonday(mealPlannerState$.currentWeek.get());
  const nextWeekStart = addDays(currentMonday, 7);
  batch(() => {
    mealPlannerState$.selectedPlanId.set(undefined);
    mealPlannerState$.currentWeek.set(nextWeekStart);
    mealPlannerState$.shoppingListDate.set({
      from: nextWeekStart,
      to: addDays(nextWeekStart, 6),
    });
  });
};

const handleNavigateToday = () => {
  const today = new Date();
  const currentMonday = getMonday(today);
  const currentSaturday = getSaturday(today);

  batch(() => {
    mealPlannerState$.selectedPlanId.set(undefined);
    mealPlannerState$.currentWeek.set(currentMonday);
    mealPlannerState$.shoppingListDate.set({
      from: currentMonday,
      to: currentSaturday,
    });
  });
};

export const useMealPlanner = () => {
  const currentWeek = use$(mealPlannerState$.currentWeek);
  const selectedPlanId = use$(mealPlannerState$.selectedPlanId);

  const startDate = use$(mealPlannerState$.shoppingListDate)?.from?.getTime();
  const endDate = use$(mealPlannerState$.shoppingListDate)?.to?.getTime();

  const t = useTranslations("mealPlanner");

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
      startDate,
      endDate,
    }),
  );

  const { mutate: generatePlanAndShoppingListMutate, isPending: isGenerating } =
    useMutation({
      mutationFn: useConvexMutation(
        api.planAndList.generatePlanAndShoppingList,
      ),
      onSuccess: () => {
        toast(t("toast.successTitle"), {
          description: t("generatePlanSuccessDescription"),
        });
      },
      onError: (error) => {
        console.error("Error generating meal plan:", error);
        toast(t("toast.errorTitle"), {
          description:
            error instanceof Error
              ? error.message
              : t("generatePlanErrorUnknown"),
        });
      },
    });

  const { mutate: lockPlanMutate, isPending: isLocking } = useMutation({
    mutationFn: useConvexMutation(api.mealPlans.lockMealPlan),
    onSuccess: (
      data: FunctionReturnType<typeof api.mealPlans.lockMealPlan>,
    ) => {
      toast(t("toast.successTitle"), {
        description: data.locked
          ? t("lockPlanSuccessDescription")
          : t("unlockPlanSuccessDescription"),
      });
    },
    onError: (error) => {
      console.error("Error locking meal plan:", error);
      toast(t("toast.errorTitle"), {
        description:
          error instanceof Error ? error.message : t("lockPlanErrorFallback"),
      });
    },
  });

  const handleGenerateMealPlan = () => {
    const weekStart = mealPlannerState$.currentWeek.get().getTime();
    generatePlanAndShoppingListMutate({ weekStart });
  };

  const lockMealPlan = (mealPlanId: Id<"mealPlans">) => {
    lockPlanMutate({ mealPlanId });
  };

  const isBusy = isMealPlanLoading || isShoppingListLoading;

  useWhenReady(mealPlanData, (mealPlans) => {
    if (mealPlannerState$.selectedPlanId.get()) return;

    const id =
      mealPlans?.find((plan) => isToday(plan.date))?._id ||
      mealPlans?.find((plan) => plan.date === currentWeek.getTime())?._id;

    return mealPlannerState$.selectedPlanId.set(id);
  });

  return {
    mealPlannerState$,
    selectedPlanId,
    currentWeek,

    // deprecate
    setCurrentWeek,

    handleNavigatePrevious,
    handleNavigateNext,
    handleNavigateToday,

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
