"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import {
  CalendarCog,
  LayoutDashboard,
  List,
  LogOut,
  Menu,
  Refrigerator,
  Settings,
  SquareStack,
  Triangle,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { api } from "@/convex/_generated/api";
import { usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", icon: LayoutDashboard, key: "mealPlanner" },
  { href: "/fridge", icon: Refrigerator, key: "fridge" },
  { href: "/meals", icon: List, key: "meals" },
  { href: "/plans", icon: CalendarCog, key: "plans" },
  { href: "/diet", icon: UtensilsCrossed, key: "diet" },
  { href: "/ingredients", icon: SquareStack, key: "ingredients" },
] as const;

export function AppHeader() {
  const t = useTranslations("appSidebar");
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center gap-6 border-border/60 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-6">
      <Link
        href="/"
        className="flex shrink-0 items-center gap-2 text-foreground transition-opacity hover:opacity-80"
      >
        <Triangle className="h-5 w-5 rotate-90 text-primary" />
        <span className="hidden font-semibold sm:inline-block">
          Skibidi Obiadex
        </span>
      </Link>

      {/* Mobile nav */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <nav className="mt-6 flex flex-col gap-1">
            {NAV_ITEMS.map(({ href, icon: Icon, key }) => (
              <Link key={href} href={href}>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Icon className="h-4 w-4" />
                  {t(key)}
                </Button>
              </Link>
            ))}
            <Link href="/settings">
              <Button
                variant="ghost"
                className="mt-2 w-full justify-start gap-2"
              >
                <Settings className="h-4 w-4" />
                {t("settings")}
              </Button>
            </Link>
          </nav>
        </SheetContent>
      </Sheet>

      <nav className="hidden flex-1 items-center gap-1 md:flex">
        {NAV_ITEMS.map(({ href, icon: Icon, key }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname?.startsWith(href);
          return (
            <Link key={href} href={href}>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "gap-2 font-medium",
                  isActive
                    ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {t(key)}
              </Button>
            </Link>
          );
        })}
      </nav>

      <div className="flex shrink-0 items-center gap-1">
        <Suspense
          fallback={
            <div className="h-8 w-8 animate-pulse rounded-md bg-muted" />
          }
        >
          <ThemeSwitcher />
        </Suspense>
        <Suspense
          fallback={
            <div className="h-8 w-8 animate-pulse rounded-md bg-muted" />
          }
        >
          <LanguageSwitcher />
        </Suspense>
        <HeaderUser />
      </div>
    </header>
  );
}

function HeaderUser() {
  const { isAuthenticated } = useConvexAuth();
  const currentUser = useQuery(
    api.users.queries.getCurrentUser,
    isAuthenticated ? {} : "skip",
  );
  const { signOut } = useAuthActions();
  const router = useRouter();

  if (!isAuthenticated || !currentUser) {
    return (
      <Button variant="ghost" size="sm" asChild>
        <Link href="/sign-in">Sign in</Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-8 w-8">
            {currentUser.image && (
              <AvatarImage
                src={currentUser.image}
                alt={currentUser.name ?? ""}
              />
            )}
            <AvatarFallback>
              {(currentUser.name ?? "U").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="font-medium">{currentUser.name}</p>
          <p className="truncate text-muted-foreground text-xs">
            {currentUser.email}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href="/settings"
            className="flex cursor-pointer items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex cursor-pointer items-center gap-2 text-destructive focus:text-destructive"
          onClick={() => void signOut().then(() => router.push("/sign-in"))}
        >
          <LogOut className="h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
