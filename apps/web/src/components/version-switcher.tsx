"use client";

import { Layout, ChevronDown, Check, Plus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Trans } from "@lingui/react/macro";

export interface VersionOption {
  id: string;
  name: string;
  isPersonal: boolean;
}

export function VersionSwitcher({
  versions,
  currentVersion,
  onSelect,
  onCreateNew,
}: {
  versions: VersionOption[];
  currentVersion: string;
  onSelect?: (id: string) => void;
  onCreateNew?: () => void;
}) {
  const current = versions.find((version) => version.id === currentVersion);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
              />
            }
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Layout className="size-4" />
            </div>
            <div className="flex flex-col gap-0.5 leading-none">
              <span className="font-medium">{current?.name}</span>
            </div>
            {current?.isPersonal && (
              <Badge variant="secondary">
                <Trans>Personal</Trans>
              </Badge>
            )}
            <ChevronDown className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-(--anchor-width)" align="start">
            {versions.map((version) => (
              <DropdownMenuItem key={version.id} onClick={() => onSelect?.(version.id)}>
                {version.name}
                {version.isPersonal && (
                  <Badge variant="secondary">
                    <Trans>Personal</Trans>
                  </Badge>
                )}
                {version.id === currentVersion && <Check className="ml-auto size-4" />}
              </DropdownMenuItem>
            ))}
            {onCreateNew && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onCreateNew}>
                  <Plus className="size-4" />
                  <Trans>New project</Trans>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
