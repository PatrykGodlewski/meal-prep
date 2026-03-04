import { useTranslations } from "next-intl";

type Props = {
  stepKey: "step1" | "step2" | "step3" | "step4" | "step5";
};

export function StepHeader({ stepKey }: Props) {
  const t = useTranslations(`onboarding.${stepKey}`);
  return (
    <div>
      <h1 className="font-bold text-2xl">{t("title")}</h1>
      <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
    </div>
  );
}
