"use client"

import * as React from "react"
import { Layout, ChevronDown, Check, Plus } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Trans, useTranslation } from "react-i18next"

export function VersionSwitcher({
  versions,
  defaultVersion,
  onSelect,
  onCreateNew,
}: {
  versions: string[]
  defaultVersion: string
  onSelect?: (version: string) => void
  onCreateNew?: () => void
}) {
  const { t } = useTranslation("navigation")
  const [selectedVersion, setSelectedVersion] = React.useState(defaultVersion)

  React.useEffect(() => {
    setSelectedVersion(defaultVersion)
  }, [defaultVersion])

  const handleSelect = (version: string) => {
    setSelectedVersion(version)
    onSelect?.(version)
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Layout className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-medium">{selectedVersion}</span>
              </div>
              <ChevronDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width)"
            align="start"
          >
            {versions.map((version) => (
              <DropdownMenuItem
                key={version}
                onSelect={() => handleSelect(version)}
              >
                {version}
                {version === selectedVersion && (
                  <Check className="ml-auto size-4" />
                )}
              </DropdownMenuItem>
            ))}
            {onCreateNew && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={onCreateNew}>
                  <Plus className="size-4" />
                  <Trans t={t}>New project</Trans>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
