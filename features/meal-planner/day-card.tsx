import { format, isValid } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";
import { MealPlanDayInternal } from "@/validators/mealPlanner";

const DATE_FORMAT_DISPLAY_CARD = "MMM dd";

interface DayCardProps {
  planDay: MealPlanDayInternal;
  isLoading: boolean;
}

export const DayCard: React.FC<DayCardProps> = React.memo(
  ({ planDay, isLoading }) => {
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
  },
);
DayCard.displayName = "DayCard"; // For better debugging
