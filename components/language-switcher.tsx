"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { LOCALES } from "@/i18n/routing";
import { Globe2 } from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();

  console.log({ locale, pathname });
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="uppercase" asChild>
        <Button variant="ghost" size="sm">
          <Globe2 size={16} className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-content" align="end">
        <DropdownMenuRadioGroup value={locale}>
          {LOCALES.map((locale) => (
            <Link key={locale} locale={locale} href={pathname}>
              <DropdownMenuRadioItem className="uppercase" value={locale}>
                {locale}
              </DropdownMenuRadioItem>
            </Link>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
