import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Building2,
  Plus,
  Users,
  LineChart,
  Settings2,
  ShieldCheck,
  LogOut,
  ClipboardCheck,
  FlaskConical,
  Handshake,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { isSponsorshipEnabledClient } from "@/lib/sponsorship/feature-flag";

const baseItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Listings", url: "/listings", icon: Building2 },
  { title: "Create Listing", url: "/create-listing", icon: Plus },
  { title: "Resolved Visitors", url: "/resolved-visitors", icon: Users },
  { title: "Identity Resolution", url: "/identity", icon: ShieldCheck },
  { title: "Company", url: "/company", icon: Settings2 },
  { title: "Privacy", url: "/privacy-settings", icon: ShieldCheck },
];

const superAdminItems = [
  { title: "Tracking", url: "/tracking", icon: LineChart },
  { title: "Tracking Verify", url: "/tracking-verify", icon: FlaskConical },
  { title: "MVP Test Center", url: "/test-center", icon: ClipboardCheck },
];

const sponsorshipItem = { title: "Sponsorship", url: "/sponsorship", icon: Handshake };

export function AppSidebar() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { roles } = useAuth();
  const isSuperAdmin = roles.includes("super_admin");
  const items = isSuperAdmin
    ? [
        ...baseItems,
        ...superAdminItems,
        ...(isSponsorshipEnabledClient() ? [sponsorshipItem] : []),
      ]
    : baseItems;
  const isActive = (url: string) =>
    url === "/dashboard" ? pathname === url : pathname === url || pathname.startsWith(url + "/");

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-4 py-5 border-b">
        <Link to="/dashboard" className="flex items-baseline gap-1.5">
          <span className="font-display text-xl tracking-tight">SmartTour</span>
          <span className="font-display text-xl text-muted-foreground">OS</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url} className="flex items-center gap-2.5">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut}>
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
