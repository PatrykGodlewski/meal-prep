"use client";

import React from "react";
import type { Control } from "react-hook-form";
import { IngredientReplacementsSelector } from "./ingredient-replacements-selector";

interface ReplacementOption {
  label: string;
  value: string;
  defaultRatio?: number;
}

interface IngredientReplacementsFieldProps {
  index: number;
  control: Control<any>;
  replacementOptions: ReplacementOption[];
  hasDefaultReplacements: boolean;
}

export const IngredientReplacementsField = React.memo(
  function IngredientReplacementsField(props: IngredientReplacementsFieldProps) {
    if (props.replacementOptions.length === 0) return null;

    return (
      <div className="col-span-full px-4 pb-3 pt-1">
        <IngredientReplacementsSelector {...props} />
      </div>
    );
  },
);
