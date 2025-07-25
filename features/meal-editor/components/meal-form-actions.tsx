"use client";
import { Save, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface MealFormActionsProps {
  isEditMode: boolean;
  isPending: boolean;
  isDirty: boolean;
  onSubmit: () => void;
  onDelete: () => void;
}

export function MealFormActions({
  isEditMode,
  isPending,
  isDirty,
  onSubmit,
  onDelete,
}: MealFormActionsProps) {
  const t = useTranslations("mealEditor");

  return (
    <div className="flex gap-2 justify-end mb-8">
      <Button onClick={onSubmit} disabled={isPending || !isDirty}>
        <Save className="h-4 w-4 mr-1" />
        {isPending ? t("saving") : t("saveChanges")}
      </Button>
      {isEditMode && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isPending}>
              <Trash2 className="h-4 w-4 mr-1" /> {t("delete")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("deleteConfirmationTitle")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("deleteConfirmationDescription")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>
                {t("cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
                className="bg-red-600 hover:bg-red-700"
                disabled={isPending}
              >
                {isPending ? t("deleting") : t("delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
