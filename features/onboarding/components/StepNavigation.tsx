import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

type Props = {
  backHref: string;
  nextLabel?: string;
  isSubmitting?: boolean;
};

export function StepNavigation({
  backHref,
  nextLabel,
  isSubmitting = false,
}: Props) {
  const t = useTranslations("onboarding");
  return (
    <div className="flex justify-between gap-4 pt-4">
      <Button type="button" variant="outline" asChild>
        <Link href={backHref}>{t("back")}</Link>
      </Button>
      <Button type="submit" disabled={isSubmitting}>
        {nextLabel ?? t("next")}
      </Button>
    </div>
  );
}
