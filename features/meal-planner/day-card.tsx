"use client";
import { format, isToday, isValid } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";
import { cn } from "@/lib/utils";
import type { MealPlanClient } from "./types";
import Link from "next/link";
import { For } from "@/components/for-each";

const DATE_FORMAT_DISPLAY_CARD = "MMM dd";

interface PlanCardProps {
  plan: MealPlanClient;
}

export function PlanCard({ plan }: PlanCardProps) {
  if (!isValid(plan.date)) {
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
      <CardContent className="p-3 space-y-2 flex-grow">
        <ul className="space-y-1 text-xs">
          <For
            each={plan.meals}
            empty={
              <li className="text-center text-gray-400 italic pt-4">
                No meals planned
              </li>
            }
          >
            {(meal) => (
              <li
                key={`${plan.date.toISOString()}-${meal.category}-${meal.id}`}
              >
                <Link className="hover:underline" href={`/meals/${meal.id}`}>
                  <span className="font-semibold capitalize">
                    {meal.category}:
                  </span>{" "}
                  {meal.name}
                </Link>
              </li>
            )}
          </For>
        </ul>
      </CardContent>
    </Card>
  );
}
