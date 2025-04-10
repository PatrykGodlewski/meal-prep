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
} from "date-fns"; // Added getDay
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { generateWeeklyMealPlan, getMealPlanForWeek } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import {
  MealPlanDayInternalSchema,
  type MealPlanDayInternal,
  type WeeklyPlanClientInput,
} from "@/validators/mealPlanner"; // Adjust path

interface MealPlanGridProps {
  initialMealPlansData: WeeklyPlanClientInput | null | undefined;
}

const daysOfWeekNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const getMonday = (date: Date): Date => {
  if (!isValid(date)) {
    return startOfWeek(new Date(), { weekStartsOn: 1 });
  }
  return startOfWeek(date, { weekStartsOn: 1 });
};

// --- Zod Parsing Function (Revised as above) ---
const parseWithZod = (
  clientData: WeeklyPlanClientInput | null | undefined,
): MealPlanDayInternal[] => {
  // Always return an array
  if (!clientData || !Array.isArray(clientData)) {
    return [];
  }
  const parsedData: MealPlanDayInternal[] = [];
  for (const day of clientData) {
    const result = MealPlanDayInternalSchema.safeParse(day);
    if (result.success) {
      parsedData.push(result.data);
    } else {
      console.warn(
        "Zod parsing failed for a day:",
        result.error.flatten().fieldErrors,
        "Input:",
        day,
      );
    }
  }
  const sortedData = [...parsedData].sort((a, b) => {
    const dayA = daysOfWeekNames.indexOf(a.dayName);
    const dayB = daysOfWeekNames.indexOf(b.dayName);
    const sortA = dayA === 0 ? 7 : dayA;
    const sortB = dayB === 0 ? 7 : dayB;
    return sortA - sortB;
  });
  return sortedData; // Return successfully parsed days, potentially empty array
};
// --- End Zod Parsing Function ---

// --- Function to create the base 7-day structure ---
const createBaseWeekStructure = (startDate: Date): MealPlanDayInternal[] => {
  const mondayStart = getMonday(startDate);
  const weekDays: MealPlanDayInternal[] = [];
  for (let i = 0; i < 7; i++) {
    const currentDate = addDays(mondayStart, i);
    const dayIndex = getDay(currentDate);
    weekDays.push({
      date: currentDate,
      dayName: daysOfWeekNames[dayIndex],
      meals: [], // Start with empty meals
    });
  }
  const sortedWeek = weekDays.sort((a, b) => {
    const dayA = daysOfWeekNames.indexOf(a.dayName);
    const dayB = daysOfWeekNames.indexOf(b.dayName);
    const sortA = dayA === 0 ? 7 : dayA;
    const sortB = dayB === 0 ? 7 : dayB;
    return sortA - sortB;
  });
  return sortedWeek;
};
// --- End Base Structure Function ---

const MealPlanGrid: React.FC<MealPlanGridProps> = ({
  initialMealPlansData,
}) => {
  const { toast } = useToast();
  const isMounted = useRef(false);

  // --- State ---
  const [planCache, setPlanCache] = useState<
    Map<string, MealPlanDayInternal[]>
  >(() => {
    const cache = new Map<string, MealPlanDayInternal[]>();
    const parsedInitial = parseWithZod(initialMealPlansData); // Returns [] on failure
    if (parsedInitial.length > 0) {
      const initialKey = getMonday(parsedInitial[0].date).toISOString();
      cache.set(initialKey, parsedInitial);
    }
    // Even if initial data is bad/empty, the cache starts empty, which is fine.
    return cache;
  });

  const initialStartDate = useMemo(() => {
    const initialKey = Array.from(planCache.keys())[0];
    return initialKey ? parseISO(initialKey) : getMonday(new Date());
  }, [planCache]);

  const [displayedWeekStart, setDisplayedWeekStart] =
    useState<Date>(initialStartDate);

  // --- Derive Display Plan (Merge Base + Cache) ---
  const displayPlan = useMemo(() => {
    const baseStructure = createBaseWeekStructure(displayedWeekStart);
    const cachedData = planCache.get(displayedWeekStart.toISOString()); // Might be [] or MealPlanDayInternal[]

    if (!cachedData || cachedData.length === 0) {
      return baseStructure; // Use base if cache is empty/missing
    }

    // Create a map of the cached data for efficient lookup
    const cachedMap = new Map<string, MealPlanDayInternal>();
    cachedData.forEach((day) => {
      if (isValid(day.date)) {
        // Ensure date is valid before formatting
        cachedMap.set(format(day.date, "yyyy-MM-dd"), day);
      }
    });

    // Merge: Map over base, replace with cached data if found
    return baseStructure.map((baseDay) => {
      const dateKey = format(baseDay.date, "yyyy-MM-dd");
      return cachedMap.get(dateKey) || baseDay; // Use cached or default to base
    });
  }, [planCache, displayedWeekStart]);
  // --- End Derive Display Plan ---

  const [isGenerating, setIsGenerating] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  // --- End State ---

  // Effect to update cache if initial props change after mount
  useEffect(() => {
    if (isMounted.current) {
      const newParsedData = parseWithZod(initialMealPlansData); // Returns [] on failure
      if (newParsedData.length > 0) {
        // Only update cache if there's valid parsed data
        const dataWeekStart = getMonday(newParsedData[0].date);
        const dataKey = dataWeekStart.toISOString();
        // Update cache only if new data is different from cached data for that week
        if (
          JSON.stringify(planCache.get(dataKey)) !==
          JSON.stringify(newParsedData)
        ) {
          console.log("Updating cache from new props for week:", dataKey);
          setPlanCache((prev) => new Map(prev).set(dataKey, newParsedData));
        }
      }
    } else {
      isMounted.current = true;
    }
  }, [initialMealPlansData, planCache]);

  // --- Data Loading Logic ---
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
        setDisplayedWeekStart(targetMonday);
        return; // Use cached data (displayPlan updates via useMemo)
      }

      setIsNavigating(true);
      setDisplayedWeekStart(targetMonday); // Update displayed week optimistically
      // displayPlan will show base structure via useMemo while loading

      try {
        const weekDataClient = await getMealPlanForWeek(targetMonday);
        const weekDataInternal = parseWithZod(weekDataClient); // Returns [] on failure

        // Update Cache with parsed data (even if empty)
        setPlanCache((prev) => new Map(prev).set(dateKey, weekDataInternal));
        // displayPlan updates automatically via useMemo
      } catch (error) {
        console.error("Error fetching week data:", error);
        // Store empty array in cache on fetch error to prevent refetch loop
        setPlanCache((prev) => new Map(prev).set(dateKey, []));
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Could not load data for the selected week.",
          variant: "destructive",
        });
      } finally {
        setIsNavigating(false);
      }
    },
    [planCache, toast],
  );
  // --- End Data Loading Logic ---

  // --- Event Handlers (Keep as before) ---
  const handleNavigateWeek = (direction: "previous" | "next") => {
    const currentMonday = getMonday(displayedWeekStart);
    const newStartDate =
      direction === "previous"
        ? subDays(currentMonday, 7)
        : addDays(currentMonday, 7);
    loadWeekData(newStartDate);
  };

  const handleGenerateMeals = useCallback(async () => {
    setIsGenerating(true);
    const mondayForGeneration = getMonday(new Date());
    const generationKey = mondayForGeneration.toISOString();
    try {
      await generateWeeklyMealPlan(mondayForGeneration);
      toast({
        title: "Success",
        description: "Meal plan generation initiated! Data will refresh.",
      });
      setPlanCache((prev) => {
        const newCache = new Map(prev);
        newCache.delete(generationKey); // Clear cache for generated week
        return newCache;
      });
      if (displayedWeekStart.toISOString() === generationKey) {
        setTimeout(() => loadWeekData(mondayForGeneration), 500);
      }
    } catch (error) {
      console.error("Error generating meal plan:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to generate meal plan.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [toast, displayedWeekStart, loadWeekData]);
  // --- End Event Handlers ---

  const isLoading = isGenerating || isNavigating;
  // Show loading overlay only when navigating AND data isn't in cache yet
  const showLoadingOverlay =
    isNavigating && !planCache.has(displayedWeekStart.toISOString());

  return (
    <div className="p-4">
      {/* Navigation and Generate Button */}
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
          <h2 className="text-xl font-semibold text-center sm:text-left whitespace-nowrap">
            Week of{" "}
            {isValid(displayedWeekStart)
              ? format(displayedWeekStart, "MMMM do")
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
          {isGenerating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Generate for This Week
        </Button>
      </div>

      {/* Grid Display */}
      <div
        key={displayedWeekStart.toISOString()}
        className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 relative min-h-[200px]`}
      >
        {showLoadingOverlay && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10 rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Always map over the 7-day displayPlan */}
        {displayPlan.map((planDay) =>
          isValid(planDay.date) ? (
            <Card
              key={planDay.date.toISOString()}
              className={`shadow-sm flex flex-col min-h-[150px] ${showLoadingOverlay ? "opacity-50" : ""}`}
            >
              <CardHeader className="p-3">
                <CardTitle className="flex items-center justify-between text-sm font-medium">
                  <span>{planDay.dayName}</span>
                  <span className="text-xs text-gray-500">
                    {format(planDay.date, "MMM dd")}
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
          ) : (
            // Fallback for invalid date (should be rare now)
            <Card
              key={`invalid-${Math.random()}`}
              className="shadow-sm flex flex-col min-h-[150px] border-red-500"
            >
              <CardHeader className="p-3">
                <CardTitle className="text-sm text-red-600">
                  Display Error
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 text-xs text-red-500">
                Invalid date encountered.
              </CardContent>
            </Card>
          ),
        )}
      </div>
    </div>
  );
};

export default MealPlanGrid;
