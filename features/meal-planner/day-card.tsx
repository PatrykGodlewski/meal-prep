"use client";
import { format, isToday, isValid, toDate } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { For } from "@/components/for-each";
import type { WeeklyMealPlan } from "./actions";
import { Button } from "@/components/ui/button";

const DATE_FORMAT_DISPLAY_CARD = "MMM dd";

interface PlanCardProps {
  plan: WeeklyMealPlan[number];
}

export function PlanCard({ plan }: PlanCardProps) {
  if (!isValid(toDate(plan.date))) {
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
      className={cn("shadow-sm flex flex-col min-h-[150px]", {
        "bg-neutral-200 dark:bg-neutral-800": isToday(plan.date),
      })}
    >
      <CardHeader className="p-3">
        <CardTitle className="flex items-center justify-between text-sm font-medium ">
          <span>{format(plan.date, "EEEE")}</span>

          <span className="text-xs text-gray-500">
            {format(plan.date, DATE_FORMAT_DISPLAY_CARD)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 justify-between  flex flex-col space-y-2 flex-grow">
        <ul className="space-y-1 text-xs group">
          <For
            each={plan.plannedMeals.sort((a, b) =>
              (a.meal.category ?? "").localeCompare(b.meal?.category ?? ""),
            )}
            empty={
              <li className="text-center text-gray-400 italic pt-4">
                No meals planned
              </li>
            }
          >
            {(plannedMeal) => (
              <li
                key={`${plan.id}-${plannedMeal.meal.category}-${plannedMeal.id}`}
              >
                <Link
                  className="hover:underline"
                  href={`/meals/${plannedMeal.meal.id}`}
                >
                  <span className="font-semibold capitalize">
                    {plannedMeal.meal.category}:
                  </span>{" "}
                  {plannedMeal.meal.name}
                </Link>
              </li>
            )}
          </For>
        </ul>

        <Button size={"sm"} asChild>
          <Link href={`/plans/${plan.id}`}>Go to plan</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
