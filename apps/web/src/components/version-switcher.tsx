"use client";

import { ChevronDown, Check, Plus, User } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { DotMatrix } from "@/components/ui/dot-matrix";
import { Trans } from "@lingui/react/macro";

export interface VersionOption {
  id: string;
  name: string;
  isPersonal: boolean;
  logoPattern: number[][];
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
            <div className="flex justify-between w-full">
              <div className="flex flex-row items-center gap-2">
                <div className="flex aspect-square size-5 items-center justify-center rounded-lg">
                  <DotMatrix matrix={current?.logoPattern ?? []} className="size-full!" gap={0.5} />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">{current?.name}</span>
                </div>
              </div>
              <div className="flex flex-row items-center gap-2">
                {current?.isPersonal && (
                  <Badge variant="outline">
                    <User />
                    <Trans>Personal</Trans>
                  </Badge>
                )}
                <ChevronDown className="ml-auto size-4" />
              </div>
            </div>
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
