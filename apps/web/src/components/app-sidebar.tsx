import * as React from "react";

import { VersionSwitcher } from "@/components/version-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { useNavigation } from "@/hooks/use-navigation";
import { Link, useNavigate } from "@tanstack/react-router";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { orgOptions, activeOrganization, setActiveOrganization, navGroups } = useNavigation();
  const navigate = useNavigate();
  const { setOpenMobile } = useSidebar();

  const activeOrgId = activeOrganization?.id ?? orgOptions[0]?.id ?? "";
  const versions = orgOptions.map((o) => ({ id: o.id, name: o.name, isPersonal: o.isPersonal }));

  const handleOrgSelect = (id: string) => {
    const org = orgOptions.find((o) => o.id === id);
    if (org) setActiveOrganization(org);
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <VersionSwitcher
          versions={versions}
          currentVersion={activeOrgId}
          onSelect={handleOrgSelect}
          onCreateNew={() => navigate({ to: "/projects/new" })}
        />
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={item.isActive}
                      render={
                        <Link
                          to={item.to}
                          params={item.params}
                          onClick={() => setOpenMobile(false)}
                        />
                      }
                    >
                      {item.title}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
