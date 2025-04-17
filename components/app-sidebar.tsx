import { Triangle } from "lucide-react";
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
import { getProfile } from "@/lib/getProfile";
import { authorize } from "@/lib/authorization";
import { NavGuest } from "./nav-guest";

export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const profile = await getProfile();
  const user = await authorize();

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/">
                <Triangle className="h-5 w-5 rotate-90" />
                <span className="text-base font-semibold">Skibidi Obiadex</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {user ? <NavMain /> : <NavGuest />}
        {!!user && <NavSecondary className="mt-auto" />}
      </SidebarContent>
      <SidebarFooter>
        {!!user && (
          <NavUser
            user={{
              name: profile?.nickname ?? "User",
              email: user?.email ?? "Email missing",
            }}
          />
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
