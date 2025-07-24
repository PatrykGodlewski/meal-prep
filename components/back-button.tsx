"use client";
import { useRouter } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
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
      className="p-0 h-auto text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
    >
      <ArrowLeft className="h-4 w-4 mr-1" /> {t("back")}
    </Button>
  );
}
