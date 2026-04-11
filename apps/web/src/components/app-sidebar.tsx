import * as React from "react"

import { VersionSwitcher } from "@/components/version-switcher"
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
} from "@/components/ui/sidebar"
import { useNavigation } from "@/hooks/use-navigation"
import { Link, useNavigate } from "@tanstack/react-router"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { orgOptions, activeOrganization, setActiveOrganization, navGroups } = useNavigation()
  const navigate = useNavigate()

  const activeOrgName = activeOrganization?.name ?? orgOptions[0]?.name ?? ""
  const orgNames = orgOptions.map((o) => o.name)

  const handleOrgSelect = (name: string) => {
    const org = orgOptions.find((o) => o.name === name)
    if (org) setActiveOrganization(org)
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <VersionSwitcher
          versions={orgNames}
          defaultVersion={activeOrgName}
          onSelect={handleOrgSelect}
          onCreateNew={() => navigate({ to: "/organizations/new" })}
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
                    <SidebarMenuButton asChild isActive={item.isActive}>
                      <Link to={item.to} params={item.params}>{item.title}</Link>
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
  )
}
