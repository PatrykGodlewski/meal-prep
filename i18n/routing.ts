import { defineRouting } from "next-intl/routing";

export const LOCALES = ["en", "pl"];
export const DEFAULT_LOCALE = LOCALES[0];

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
});
