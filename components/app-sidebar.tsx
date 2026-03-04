"use client";
import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import {
  CalendarCog,
  LayoutDashboardIcon,
  ListIcon,
  SquareStack,
  Triangle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { api } from "@/convex/_generated/api";
import { NavGuest } from "./nav-guest";
import { NavList } from "./nav-list";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isAuthenticated } = useConvexAuth();
  const currentUser = useQuery(
    api.users.queries.getCurrentUser,
    isAuthenticated ? {} : "skip",
  );

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="/">
                <Triangle className="h-5 w-5 rotate-90" />
                <span className="font-semibold text-base">Skibidi Obiadex</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {isAuthenticated ? <Nav /> : <NavGuest />}
        {!!isAuthenticated && <NavSecondary className="mt-auto" />}
      </SidebarContent>
      <SidebarFooter>
        {!!isAuthenticated && (
          <NavUser
            user={{
              name: currentUser?.name ?? "User",
              email: currentUser?.email ?? "",
              avatar: currentUser?.image,
            }}
          />
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

function Nav() {
  const t = useTranslations("appSidebar");
  const featureList = [
    {
      title: t("mealPlanner"),
      url: "/",
      icon: LayoutDashboardIcon,
    },
  ];

  const entityList = [
    {
      title: t("meals"),
      url: "/meals",
      icon: ListIcon,
    },
    {
      title: t("plans"),
      url: "/plans",
      icon: CalendarCog,
    },
    {
      title: t("ingredients"),
      url: "/ingredients",
      icon: SquareStack,
    },
  ];

  return (
    <>
      <NavMain />
      <NavList title={t("features")} items={featureList} />
      <NavList title={t("entities")} items={entityList} />
    </>
  );
}
