"use client";

import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  format,
  startOfWeek,
  addDays,
  subDays,
  parseISO,
  isValid,
  getDay,
} from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { generateWeeklyMealPlan, getMealPlanForWeek } from "@/app/actions"; // Server Actions
import { useToast } from "@/hooks/use-toast";
import {
  MealPlanDayInternalSchema, // Zod schema for ONE internal day
  type MealPlanDayInternal, // Type for ONE internal day
  type WeeklyPlanClientInput, // Type for the raw array from server
} from "@/validators/mealPlanner"; // Adjust path

// --- Component Props ---
interface MealPlanGridProps {
  initialMealPlansData: WeeklyPlanClientInput | null | undefined;
}

// --- Constants ---
const daysOfWeekNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const DATE_FORMAT_KEY = "yyyy-MM-dd"; // For cache keys and map lookups
const DATE_FORMAT_DISPLAY_HEADER = "MMMM do";
const DATE_FORMAT_DISPLAY_CARD = "MMM dd";

// --- Helper Functions ---
const getMonday = (date: Date): Date => {
  return isValid(date)
    ? startOfWeek(date, { weekStartsOn: 1 })
    : startOfWeek(new Date(), { weekStartsOn: 1 });
};

// Parses raw server data into internal format using Zod, resilient to individual day failures
const parseAndSortWeekData = (
  clientData: WeeklyPlanClientInput | null | undefined,
): MealPlanDayInternal[] => {
  if (!clientData || !Array.isArray(clientData)) return [];

  const parsedData = clientData.reduce((acc: MealPlanDayInternal[], day) => {
    const result = MealPlanDayInternalSchema.safeParse(day);
    if (result.success) {
      acc.push(result.data);
    } else {
      console.warn(
        "Zod parsing failed for a day:",
        result.error.flatten().fieldErrors,
        "Input:",
        day,
      );
    }
    return acc;
  }, []);

  // Sort Mon-Sun
  return parsedData.sort((a, b) => {
    const dayA = daysOfWeekNames.indexOf(a.dayName);
    const dayB = daysOfWeekNames.indexOf(b.dayName);
    const sortA = dayA === 0 ? 7 : dayA;
    const sortB = dayB === 0 ? 7 : dayB;
    return sortA - sortB;
  });
};

// Creates the base 7-day structure for a given week start
const createBaseWeekStructure = (startDate: Date): MealPlanDayInternal[] => {
  const mondayStart = getMonday(startDate);
  return Array.from({ length: 7 }).map((_, i) => {
    const currentDate = addDays(mondayStart, i);
    const dayIndex = getDay(currentDate);
    return {
      date: currentDate,
      dayName: daysOfWeekNames[dayIndex],
      meals: [],
    };
  });
};

// --- Sub-Components ---
interface DayCardProps {
  planDay: MealPlanDayInternal;
  isLoading: boolean;
}

const DayCard: React.FC<DayCardProps> = React.memo(({ planDay, isLoading }) => {
  if (!isValid(planDay.date)) {
    return (
      <Card className="shadow-sm flex flex-col min-h-[150px] border-red-500">
        <CardHeader className="p-3">
          <CardTitle className="text-sm text-red-600">Data Error</CardTitle>
        </CardHeader>
        <CardContent className="p-3 text-xs text-red-500">
          Invalid date encountered.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`shadow-sm flex flex-col min-h-[150px] ${isLoading ? "opacity-50" : ""}`}
    >
      <CardHeader className="p-3">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <span>{planDay.dayName}</span>
          <span className="text-xs text-gray-500">
            {format(planDay.date, DATE_FORMAT_DISPLAY_CARD)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-2 flex-grow">
        <ul className="space-y-1 text-xs">
          {planDay.meals.length > 0 ? (
            planDay.meals.map((meal) => (
              <li
                key={`${planDay.date.toISOString()}-${meal.category}-${meal.id}`}
              >
                <span className="font-semibold capitalize">
                  {meal.category}:
                </span>{" "}
                {meal.name}
              </li>
            ))
          ) : (
            <li className="text-center text-gray-400 italic pt-4">
              No meals planned
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
});
DayCard.displayName = "DayCard"; // For better debugging

// --- Main Component ---
const MealPlanGrid: React.FC<MealPlanGridProps> = ({
  initialMealPlansData,
}) => {
  const { toast } = useToast();
  const isMounted = useRef(false);

  // Cache: Stores parsed MealPlanDayInternal[] keyed by week start ISO string
  const [planCache, setPlanCache] = useState<
    Map<string, MealPlanDayInternal[]>
  >(() => {
    const cache = new Map<string, MealPlanDayInternal[]>();
    const parsedInitial = parseAndSortWeekData(initialMealPlansData); // Returns [] on failure
    if (parsedInitial.length > 0) {
      const initialKey = getMonday(parsedInitial[0].date).toISOString();
      cache.set(initialKey, parsedInitial);
    }
    return cache;
  });

  // Determine initial start date based on cache or current date
  const initialStartDate = useMemo(() => {
    const initialKey = Array.from(planCache.keys())[0];
    return initialKey ? parseISO(initialKey) : getMonday(new Date());
  }, [planCache]);

  // State for the currently viewed week's start date
  const [displayedWeekStart, setDisplayedWeekStart] =
    useState<Date>(initialStartDate);

  // State for loading indicators
  const [isGenerating, setIsGenerating] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Effect to update cache if initial props change after mount
  useEffect(() => {
    if (isMounted.current) {
      const newParsedData = parseAndSortWeekData(initialMealPlansData);
      if (newParsedData.length > 0) {
        const dataWeekStart = getMonday(newParsedData[0].date);
        const dataKey = dataWeekStart.toISOString();
        // Update cache if data differs (simple overwrite is fine)
        setPlanCache((prev) => new Map(prev).set(dataKey, newParsedData));
      }
    } else {
      isMounted.current = true;
    }
  }, [initialMealPlansData]); // Only depends on the prop

  // --- Derived State for Display ---
  const displayPlan = useMemo(() => {
    const baseStructure = createBaseWeekStructure(displayedWeekStart);
    const cachedWeekData = planCache.get(displayedWeekStart.toISOString()); // Array or undefined

    if (!cachedWeekData || cachedWeekData.length === 0) {
      return baseStructure; // Use base if cache is empty/missing
    }

    const cachedMap = new Map(
      cachedWeekData.map((day) => [format(day.date, DATE_FORMAT_KEY), day]),
    );

    return baseStructure.map(
      (baseDay) =>
        cachedMap.get(format(baseDay.date, DATE_FORMAT_KEY)) || baseDay,
    );
  }, [planCache, displayedWeekStart]);
  // --- End Derived State ---

  // --- Data Loading Callback ---
  const loadWeekData = useCallback(
    async (startDate: Date) => {
      if (!isValid(startDate)) {
        toast({
          title: "Error",
          description: "Invalid date requested.",
          variant: "destructive",
        });
        return;
      }

      const targetMonday = getMonday(startDate);
      const dateKey = targetMonday.toISOString();

      if (planCache.has(dateKey)) {
        setDisplayedWeekStart(targetMonday); // Navigate even if cached
        return;
      }

      setIsNavigating(true);
      setDisplayedWeekStart(targetMonday); // Optimistic UI update for week title

      try {
        const weekDataClient = await getMealPlanForWeek(targetMonday);
        const weekDataInternal = parseAndSortWeekData(weekDataClient); // Returns [] on failure

        // Update Cache (store [] if parsing failed or no data)
        setPlanCache((prev) => new Map(prev).set(dateKey, weekDataInternal));
      } catch (error) {
        console.error("Error fetching week data:", error);
        setPlanCache((prev) => new Map(prev).set(dateKey, [])); // Cache empty on error
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Could not load data.",
          variant: "destructive",
        });
      } finally {
        setIsNavigating(false);
      }
    },
    [planCache, toast], // Keep dependencies minimal
  );
  // --- End Data Loading Callback ---

  // --- Event Handlers ---
  const handleNavigateWeek = useCallback(
    (direction: "previous" | "next") => {
      const currentMonday = getMonday(displayedWeekStart);
      const newStartDate =
        direction === "previous"
          ? subDays(currentMonday, 7)
          : addDays(currentMonday, 7);
      loadWeekData(newStartDate);
    },
    [displayedWeekStart, loadWeekData],
  );

  const handleGenerateMeals = useCallback(async () => {
    setIsGenerating(true);
    const mondayForGeneration = getMonday(new Date());
    const generationKey = mondayForGeneration.toISOString();
    try {
      await generateWeeklyMealPlan(mondayForGeneration);
      toast({
        title: "Success",
        description: "Meal plan generation initiated!",
      });
      // Clear cache for generated week to force refetch
      setPlanCache((prev) => {
        const newCache = new Map(prev);
        newCache.delete(generationKey);
        return newCache;
      });
      // If viewing the generated week, trigger load after delay
      if (displayedWeekStart.toISOString() === generationKey) {
        setTimeout(() => loadWeekData(mondayForGeneration), 500);
      }
    } catch (error) {
      console.error("Error generating meal plan:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [toast, displayedWeekStart, loadWeekData]);
  // --- End Event Handlers ---

  const isLoading = isGenerating || isNavigating;
  const showLoadingOverlay =
    isNavigating && !planCache.has(displayedWeekStart.toISOString());

  return (
    <div className="p-4">
      {/* Header: Navigation & Actions */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleNavigateWeek("previous")}
            disabled={isLoading}
            aria-label="Previous Week"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold text-center sm:text-left whitespace-nowrap tabular-nums">
            Week of{" "}
            {isValid(displayedWeekStart)
              ? format(displayedWeekStart, DATE_FORMAT_DISPLAY_HEADER)
              : "Loading..."}
          </h2>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleNavigateWeek("next")}
            disabled={isLoading}
            aria-label="Next Week"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={handleGenerateMeals} disabled={isLoading}>
          {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Generate for This Week
        </Button>
      </div>

      {/* Grid Display Area */}
      <div
        key={displayedWeekStart.toISOString()}
        className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 relative min-h-[200px]`}
      >
        {showLoadingOverlay && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-black/50 z-10 rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Always render 7 DayCard components based on displayPlan */}
        {displayPlan.map((planDay) => (
          <DayCard
            key={planDay.date.toISOString()} // Use date object from merged plan
            planDay={planDay}
            isLoading={showLoadingOverlay} // Pass loading state for potential styling
          />
        ))}
      </div>
    </div>
  );
};

export default MealPlanGrid;
