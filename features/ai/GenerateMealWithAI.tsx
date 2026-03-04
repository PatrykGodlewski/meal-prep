"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

export function GenerateMealWithAI() {
  const t = useTranslations("generateMealAI");
  const locale = useLocale();
  const requestMealGeneration = useMutation(api.ai.mutations.requestMealGeneration);
  const [prompt, setPrompt] = useState("");
  const [requestId, setRequestId] = useState<Id<"mealGenerationRequests"> | null>(null);

  const request = useQuery(
    api.ai.queries.getMealGenerationRequest,
    requestId ? { requestId } : "skip",
  );

  const isPending = request?.status === "pending" || request?.status === "running";
  const isCompleted = request?.status === "completed";
  const isFailed = request?.status === "failed";

  const handleGenerate = () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    requestMealGeneration({ prompt: trimmed, locale }).then(setRequestId);
  };

  const handleReset = () => {
    setRequestId(null);
    setPrompt("");
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
      <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
        {t("title")}
      </h3>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        {t("description")}
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
          placeholder={t("placeholder")}
          disabled={isPending}
          className="flex-1 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm placeholder:text-neutral-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60 dark:border-neutral-600 dark:bg-neutral-800 dark:placeholder:text-neutral-400"
        />
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isPending || !prompt.trim()}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("generating")}
            </>
          ) : (
            t("generate")
          )}
        </button>
      </div>

      {isCompleted && request?.mealId && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-200">
          {t("success")}
          <a
            href={`/meals/${request.mealId}`}
            className="ml-2 font-medium underline hover:no-underline"
          >
            {t("viewMeal")}
          </a>
          <button
            type="button"
            onClick={handleReset}
            className="ml-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
          >
            {t("generateAnother")}
          </button>
        </div>
      )}

      {isFailed && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
          {t("error")}: {request?.error ?? "Unknown error"}
          <button
            type="button"
            onClick={handleReset}
            className="ml-2 font-medium underline hover:no-underline"
          >
            {t("tryAgain")}
          </button>
        </div>
      )}
    </div>
  );
}
