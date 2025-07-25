"use client";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "./ui/button";

interface Props {
  destination?: string;
}

export function BackButton({ destination }: Props) {
  const router = useRouter();
  const t = useTranslations("common");

  return (
    <Button
      variant="link"
      onClick={() => (destination ? router.push(destination) : router.back())}
      className="h-auto p-0 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
    >
      <ArrowLeft className="mr-1 h-4 w-4" /> {t("back")}
    </Button>
  );
}
