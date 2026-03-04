"use client";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { batch, observable } from "@legendapp/state";
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";
import { use$, useWhenReady } from "@legendapp/state/react";
import { syncObservable } from "@legendapp/state/sync";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { FunctionReturnType } from "convex/server";
import { addDays, isToday, subDays } from "date-fns";
import { useTranslations } from "next-intl";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { getMonday, getSaturday } from "./utils";

type Store = {
  currentWeek: Date;
  shoppingListDate: DateRange | undefined;
  selectedPlanId: string | undefined;
  peopleAmount: number;
};

const today = new Date();

const mealPlannerState$ = observable<Store>({
  peopleAmount: 1,
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

const servings$ = observable(mealPlannerState$.peopleAmount.get());
const hideCheckedShoppingListItems$ = observable(true);

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
    convexQuery(api.plans.getWeeklyMealPlan, {
      weekStart: currentWeek.getTime(),
    }),
  );

  const {
    data: shoppingListData,
    isLoading: isShoppingListLoading,
    error: shoppingListError,
  } = useQuery({
    ...convexQuery(api.shoppingList.getShoppingList, {
      startDate,
      endDate,
    }),
    // Keep subscription active briefly after unmount so switching fridge↔meal planner
    // feels instant when Convex pushes updates.
    gcTime: 30_000,
  });

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

  const { mutate: addFridgeItemsMutate, isPending: isAddingToFridge } =
    useMutation({
      mutationFn: useConvexMutation(api.fridge.addFridgeItems),
    });

  const { mutate: lockPlanMutate, isPending: isLocking } = useMutation({
    mutationFn: useConvexMutation(api.plans.lockMealPlan),
    onSuccess: (data: FunctionReturnType<typeof api.plans.lockMealPlan>) => {
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

  const handleNavigateToday = () => {
    const currentMonday = getMonday(today);
    const currentSaturday = getSaturday(today);

    const todayId = mealPlanData?.find((plan) => isToday(plan.date))?._id;

    batch(() => {
      mealPlannerState$.selectedPlanId.set(todayId);
      mealPlannerState$.currentWeek.set(currentMonday);
      mealPlannerState$.shoppingListDate.set({
        from: currentMonday,
        to: currentSaturday,
      });
    });
  };

  const handleGenerateMealPlan = () => {
    const weekStart = mealPlannerState$.currentWeek.get().getTime();
    generatePlanAndShoppingListMutate({ weekStart });
  };

  const handleGenerateWithExistingIngredients = (
    existingIngredients: { ingredientId: Id<"ingredients">; amount: number }[],
  ) => {
    const weekStart = mealPlannerState$.currentWeek.get().getTime();
    addFridgeItemsMutate(
      { items: existingIngredients },
      {
        onSuccess: () => {
          generatePlanAndShoppingListMutate({ weekStart });
        },
        onError: (error) => {
          console.error("Error adding to fridge:", error);
          toast(t("toast.errorTitle"), {
            description:
              error instanceof Error
                ? error.message
                : t("generatePlanErrorUnknown"),
          });
        },
      },
    );
  };

  const lockMealPlan = (mealPlanId: Id<"plans">) => {
    lockPlanMutate({ mealPlanId });
  };

  const isBusy = isMealPlanLoading || isShoppingListLoading;

  useWhenReady(mealPlanData, (plans) => {
    if (mealPlannerState$.selectedPlanId.get()) return;

    const id =
      plans?.find((plan) => isToday(plan.date))?._id ||
      plans?.find((plan) => plan.date === currentWeek.getTime())?._id;

    return mealPlannerState$.selectedPlanId.set(id);
  });

  const servings = use$(servings$);

  return {
    hideCheckedShoppingListItems$,

    servings$,
    servings,

    mealPlannerState$,
    selectedPlanId,
    currentWeek,

    // deprecate
    setCurrentWeek,

    handleNavigatePrevious,
    handleNavigateNext,
    handleNavigateToday,

    handleGenerateMealPlan,
    handleGenerateWithExistingIngredients,
    isGenerating,
    isGeneratingWithExisting: isAddingToFridge,
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
