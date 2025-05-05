import { enUS, pl } from "date-fns/locale";
import { useLocale } from "next-intl";

export function useDateLocale() {
  const locale = useLocale();

  return {
    pl,
    en: enUS,
  }[locale];
}
