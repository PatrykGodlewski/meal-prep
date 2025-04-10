"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  Users,
  ChefHat,
  Calendar,
  ArrowLeft,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
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
import {
  type Ingredient,
  type Meal,
  mealCategoryEnum,
  unitEnum,
} from "@/supabase/schema";
import { Label } from "./ui/label";
import { deleteMeal, updateMeal } from "@/app/actions";
import type { MealCategory, UnitType } from "@/validators";

type MealWithDetails = Meal & {
  ingredients: Ingredient[];
  authorName: string;
};

type TempIngredient = Omit<Ingredient, "id"> & { id: string };

type EditedMeal = Omit<MealWithDetails, "ingredients"> & {
  ingredients: (Ingredient | TempIngredient)[];
};

interface MealDetailViewProps {
  meal: MealWithDetails;
}

export default function MealDetailView({ meal }: MealDetailViewProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editedMeal, setEditedMeal] = useState<EditedMeal>(meal);

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
    if (isEditing) {
      setEditedMeal(meal);
    }
  };

  const handleChange = <K extends keyof EditedMeal>(
    field: K,
    value: EditedMeal[K],
  ) => {
    setEditedMeal({
      ...editedMeal,
      [field]: value,
    });
  };

  const handleIngredientChange = <K extends keyof Ingredient>(
    index: number,
    field: K,
    value: Ingredient[K],
  ) => {
    const updatedIngredients = [...editedMeal.ingredients];
    updatedIngredients[index] = {
      ...updatedIngredients[index],
      [field]: value,
    };
    setEditedMeal({
      ...editedMeal,
      ingredients: updatedIngredients,
    });
  };

  const addIngredient = () => {
    setEditedMeal({
      ...editedMeal,
      ingredients: [
        ...editedMeal.ingredients,
        {
          id: `temp-${Date.now()}`,
          mealId: editedMeal.id,
          name: "",
          quantity: "",
          unit: null,
          isOptional: false,
          notes: null,
          createdAt: new Date(),
        },
      ],
    });
  };

  const removeIngredient = (index: number) => {
    const updatedIngredients = [...editedMeal.ingredients];
    updatedIngredients.splice(index, 1);
    setEditedMeal({
      ...editedMeal,
      ingredients: updatedIngredients,
    });
  };

  const saveChanges = async () => {
    setIsSubmitting(true);
    try {
      const result = await updateMeal(editedMeal);

      if (result.success) {
        toast({
          title: "Success",
          description: "Meal updated successfully",
        });
        setIsEditing(false);
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update meal",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      const result = await deleteMeal(editedMeal.id);

      if (result.success) {
        toast({
          title: "Success",
          description: "Meal deleted successfully",
        });
        router.push("/meals");
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete meal",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalTime =
    (editedMeal.prepTimeMinutes || 0) + (editedMeal.cookTimeMinutes || 0);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <Link
          href="/meals"
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to all meals
        </Link>

        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={toggleEditMode}
                disabled={isSubmitting}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button onClick={saveChanges} disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-1" />
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={toggleEditMode}>
              <Edit className="h-4 w-4 mr-1" />
              Edit Meal
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  meal and all its ingredients from the database.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isSubmitting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="bg-neutral-900 rounded-lg shadow-md overflow-hidden">
        <div className="relative h-64 md:h-96 w-full bg-neutral-900">
          {isEditing ? (
            <div className="absolute inset-0 flex items-center justify-center p-4 bg-black bg-opacity-50">
              <Input
                type="text"
                placeholder="Image URL"
                value={editedMeal.imageUrl || ""}
                onChange={(e) => handleChange("imageUrl", e.target.value)}
                className="max-w-md"
              />
            </div>
          ) : editedMeal.imageUrl ? (
            <Image
              src={editedMeal.imageUrl}
              alt={editedMeal.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-neutral-700">
              <span className="text-neutral-500 text-lg">
                No image available
              </span>
            </div>
          )}

          {editedMeal.category && !isEditing && (
            <span className="absolute top-4 right-4 bg-blue-600 uppercase text-white px-3 py-1 rounded-full">
              {editedMeal.category}
            </span>
          )}
        </div>

        <div className="p-6">
          {/* Title */}
          {isEditing ? (
            <Input
              type="text"
              value={editedMeal.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="text-3xl font-bold mb-4 h-auto py-2"
            />
          ) : (
            <h1 className="text-3xl font-bold mb-2">{editedMeal.name}</h1>
          )}

          {/* Meta information */}
          <div className="flex flex-wrap items-center text-neutral-400 mb-6">
            <MealLabel icon={ChefHat} text={`By ${editedMeal.authorName}`} />
            <MealLabel
              icon={Calendar}
              text={new Date(editedMeal.createdAt).toLocaleDateString()}
            />

            {isEditing ? (
              <>
                <div className="flex items-center mr-6 mb-2">
                  <Clock className="h-5 w-5 mr-1" />
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Prep time"
                      value={editedMeal.prepTimeMinutes || ""}
                      onChange={(e) =>
                        handleChange(
                          "prepTimeMinutes",
                          e.target.value === ""
                            ? null
                            : Number.parseInt(e.target.value),
                        )
                      }
                      className="w-20 h-8"
                    />
                    <span>+</span>
                    <Input
                      type="number"
                      placeholder="Cook time"
                      value={editedMeal.cookTimeMinutes || ""}
                      onChange={(e) =>
                        handleChange(
                          "cookTimeMinutes",
                          e.target.value === ""
                            ? null
                            : Number.parseInt(e.target.value),
                        )
                      }
                      className="w-20 h-8"
                    />
                    <span>min</span>
                  </div>
                </div>

                <div className="flex items-center mr-6 mb-2">
                  <Users className="h-5 w-5 mr-1" />
                  <Input
                    type="number"
                    placeholder="Servings"
                    value={editedMeal.servings || ""}
                    onChange={(e) =>
                      handleChange(
                        "servings",
                        e.target.value === ""
                          ? null
                          : Number.parseInt(e.target.value),
                      )
                    }
                    className="w-20 h-8"
                  />
                  <span className="ml-2">servings</span>
                </div>

                <div className="flex items-center mb-2 ml-6">
                  <span className="mr-2">Category:</span>
                  <Select
                    value={editedMeal.category || ""}
                    onValueChange={(value) =>
                      handleChange("category", value as MealCategory)
                    }
                  >
                    <SelectTrigger className="w-32 h-8">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {mealCategoryEnum.enumValues.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center mb-2 ml-6">
                  <Checkbox
                    id="isPublic"
                    checked={!!editedMeal.isPublic}
                    onCheckedChange={(checked) =>
                      handleChange("isPublic", !!checked)
                    }
                  />
                  <Label htmlFor="isPublic" className="ml-2">
                    Public meal
                  </Label>
                </div>
              </>
            ) : (
              <>
                {totalTime > 0 && (
                  <div className="flex items-center mr-6 mb-2">
                    <Clock className="h-5 w-5 mr-1" />
                    <span>{totalTime} min</span>
                    {editedMeal.prepTimeMinutes &&
                      editedMeal.cookTimeMinutes && (
                        <span className="text-sm text-neutral-500 ml-1">
                          (Prep: {editedMeal.prepTimeMinutes} min, Cook:{" "}
                          {editedMeal.cookTimeMinutes} min)
                        </span>
                      )}
                  </div>
                )}

                {editedMeal.servings && (
                  <div className="flex items-center mb-2">
                    <Users className="h-5 w-5 mr-1" />
                    <span>
                      {editedMeal.servings}{" "}
                      {editedMeal.servings === 1 ? "serving" : "servings"}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2">Description</h2>
            {isEditing ? (
              <Textarea
                value={editedMeal.description}
                onChange={(e) => handleChange("description", e.target.value)}
                className="min-h-20"
              />
            ) : (
              <p className="text-neutral-400">{editedMeal.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 ">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Ingredients</h2>
                {isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addIngredient}
                    className="flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  {editedMeal.ingredients.map((ingredient, index) => (
                    <div
                      key={ingredient.id}
                      className="border rounded-md p-3 bg-background"
                    >
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">
                          Ingredient #{index + 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeIngredient(index)}
                          className="h-6 w-6 p-0"
                          disabled={editedMeal.ingredients.length <= 1}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <Label className="text-sm font-medium">Name</Label>
                          <Input
                            value={ingredient.name}
                            onChange={(e) =>
                              handleIngredientChange(
                                index,
                                "name",
                                e.target.value,
                              )
                            }
                            placeholder="e.g., Flour"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-sm font-medium">
                              Quantity
                            </Label>
                            <Input
                              value={ingredient.quantity}
                              onChange={(e) =>
                                handleIngredientChange(
                                  index,
                                  "quantity",
                                  e.target.value,
                                )
                              }
                              placeholder="e.g., 2"
                            />
                          </div>

                          <div>
                            <Label className="text-sm font-medium">Unit</Label>
                            <Select
                              value={ingredient.unit || ""}
                              onValueChange={(value) =>
                                handleIngredientChange(
                                  index,
                                  "unit",
                                  value as UnitType,
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                {unitEnum.enumValues.map((unit) => (
                                  <SelectItem key={unit} value={unit}>
                                    {unit}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Notes</Label>
                          <Input
                            value={ingredient.notes || ""}
                            onChange={(e) =>
                              handleIngredientChange(
                                index,
                                "notes",
                                e.target.value,
                              )
                            }
                            placeholder="e.g., finely chopped"
                          />
                        </div>

                        <div className="flex items-center">
                          <Checkbox
                            id={`optional-${index}`}
                            checked={!!ingredient.isOptional}
                            onCheckedChange={(checked) =>
                              handleIngredientChange(
                                index,
                                "isOptional",
                                !!checked,
                              )
                            }
                          />
                          <Label
                            htmlFor={`optional-${index}`}
                            className="ml-2 text-sm"
                          >
                            Optional ingredient
                          </Label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <ul className="space-y-2 text-neutral-400">
                  {editedMeal.ingredients.map((ingredient) => (
                    <li key={ingredient.id} className="flex items-start">
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mt-2 mr-2" />
                      <div>
                        <span className="font-medium">
                          {ingredient.quantity} {ingredient.unit}{" "}
                          {ingredient.name}
                        </span>
                        {ingredient.isOptional && (
                          <span className="text-sm text-neutral-500 ml-2">
                            (optional)
                          </span>
                        )}
                        {ingredient.notes && (
                          <p className="text-sm text-neutral-600">
                            {ingredient.notes}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Instructions */}
            <div className="md:col-span-2">
              <h2 className="text-xl font-semibold mb-4">Instructions</h2>
              {isEditing ? (
                <Textarea
                  value={editedMeal.instructions || ""}
                  onChange={(e) => handleChange("instructions", e.target.value)}
                  className="min-h-64"
                  placeholder="Step-by-step instructions for preparing the meal"
                />
              ) : (
                <div className="prose max-w-none text-neutral-400">
                  {editedMeal.instructions ? (
                    editedMeal.instructions
                      .split("\n")
                      .map((paragraph, idx) => (
                        // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                        <p key={paragraph + idx} className="mb-4">
                          {paragraph}
                        </p>
                      ))
                  ) : (
                    <p className="text-neutral-500 italic">
                      No instructions provided.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type Props = {
  icon: LucideIcon;
  text: string;
};
function MealLabel({ icon: Icon, text }: Props) {
  return (
    <div className="flex items-center mr-6 mb-2">
      <Icon className="h-5 w-5 mr-1" />
      <span>{text}</span>
    </div>
  );
}
