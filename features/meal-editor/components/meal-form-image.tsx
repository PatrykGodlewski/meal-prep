"use client";

import { useMutation, useQuery } from "convex/react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { Control, UseFormSetValue } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Upload } from "lucide-react";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE_MB = 5;

interface MealFormImageProps {
  control: Control<any>;
  setValue: UseFormSetValue<any>;
}

export function MealFormImage({ control, setValue }: MealFormImageProps) {
  const t = useTranslations("mealEditor");
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingStorageId, setPendingStorageId] = useState<Id<"_storage"> | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const fileUrl = useQuery(
    api.files.getFileUrl,
    pendingStorageId ? { storageId: pendingStorageId } : "skip",
  );

  useEffect(() => {
    if (fileUrl && pendingStorageId) {
      setValue("imageUrl", fileUrl, { shouldDirty: true });
      setPendingStorageId(null);
    }
  }, [fileUrl, pendingStorageId, setValue]);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploadError(null);

      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        setUploadError(t("imageUploadInvalidType"));
        return;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setUploadError(t("imageUploadTooLarge", { max: MAX_FILE_SIZE_MB }));
        return;
      }

      setIsUploading(true);
      try {
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!result.ok) {
          throw new Error("Upload failed");
        }
        const { storageId } = await result.json();
        setPendingStorageId(storageId);
      } catch {
        setUploadError(t("imageUploadError"));
      } finally {
        setIsUploading(false);
        e.target.value = "";
      }
    },
    [generateUploadUrl, t],
  );

  return (
    <FormField
      control={control}
      name="imageUrl"
      render={({ field }) => (
        <FormItem>
          <div className="relative h-64 w-full overflow-hidden rounded-t-lg bg-gray-200 dark:bg-neutral-800 md:h-96">
            {field.value ? (
              <div className="relative h-full w-full">
                <Image
                  src={field.value}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      <Upload className="h-4 w-4" />
                      {isUploading ? t("imageUploading") : t("imageUploadFile")}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                    >
                      {t("imageUrlOrUpload")}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-4">
                <div className="flex flex-col items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_IMAGE_TYPES.join(",")}
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {isUploading ? t("imageUploading") : t("imageUploadFile")}
                  </Button>
                  <button
                    type="button"
                    className="text-muted-foreground text-sm underline hover:no-underline"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                  >
                    {t("imageUrlOrUpload")}
                  </button>
                </div>
                {uploadError && (
                  <p className="text-destructive text-sm">{uploadError}</p>
                )}
              </div>
            )}

            {showUrlInput && (
              <div className="absolute inset-0 flex items-end justify-center bg-black/60 p-4">
                <div className="w-full max-w-md space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="imageUrlEdit" className="text-white">
                      {t("imageUrlLabel")}
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                      onClick={() => setShowUrlInput(false)}
                    >
                      {t("cancel")}
                    </Button>
                  </div>
                  <FormControl>
                    <Input
                      id="imageUrlEdit"
                      type="text"
                      placeholder={t("imageUrlPlaceholder")}
                      {...field}
                      value={field.value ?? ""}
                      className="border-gray-300 bg-white dark:border-neutral-600 dark:bg-neutral-700"
                    />
                  </FormControl>
                </div>
              </div>
            )}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
