"use client";

import { format, startOfWeek } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import type { MealCategory } from "@/validators";
import { generateWeeklyMealPlan } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { revalidatePath } from "next/cache";

interface MealPlanWithMeals {
  date: Date;
  day: string;
  meals: {
    name: string;
    category: MealCategory;
  }[];
}

interface MealPlanGridProps {
  mealPlansData: MealPlanWithMeals[];
}

const MealPlanGrid: React.FC<MealPlanGridProps> = ({ mealPlansData }) => {
  const [loading, setLoading] = useState(false); // Set initial state to false
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false); // Loading state
  const { toast } = useToast(); // Use toast

  useEffect(() => {
    if (!mealPlansData) {
      setLoading(true); // Start loading if data is initially missing
    } else {
      setLoading(false); // Stop loading if data is present
    }
  }, [mealPlansData]);

  if (!mealPlansData && loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        Loading meal plans...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        Error: {error}
      </div>
    );
  }

  const handleGenerateMeals = async () => {
    setIsGenerating(true);
    try {
      const today = new Date();
      const startDate = startOfWeek(today, { weekStartsOn: 1 });
      await generateWeeklyMealPlan(startDate); // Call the server action
      toast({
        title: "Success",
        description: "Weekly meal plan generated successfully!",
      });
    } catch (error) {
      console.error("Error generating meal plan:", error);
      toast({
        title: "Error",
        description: "Failed to generate meal plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <Button onClick={handleGenerateMeals} disabled={isGenerating}>
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          "Generate Meals for a week"
        )}
      </Button>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
        {mealPlansData.map((plan) => (
          <Card key={plan.date.toISOString()}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{plan.day}</span>
                <span>{format(plan.date, "MMM dd")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul>
                {plan.meals.length > 0 ? (
                  plan.meals.map((meal) => (
                    <li
                      key={`${plan.date.toISOString()}-${meal.category}`}
                      className="mb-2"
                    >
                      <span className="font-semibold">{meal.category}:</span>{" "}
                      {meal.name}
                    </li>
                  ))
                ) : (
                  <li>No meals planned</li>
                )}
              </ul>
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MealPlanGrid;
