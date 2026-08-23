import { Link } from "@tanstack/react-router";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { getInitials } from "@/lib/remeda";
import { cn } from "@/lib/utils";

export interface SidebarItem {
  label: string;
  value: React.ReactNode;
  badge?: React.ReactNode;
}

export interface EntityDetailLayoutProps {
  organizationName: string;
  organizationSlug: string;
  icon?: React.ReactNode;
  title: string;
  actions?: React.ReactNode;
  sidebarItems: SidebarItem[];
  children?: React.ReactNode;
  attachments: React.ReactNode;
  className?: string;
}

export function EntityDetailLayout({
  organizationName,
  organizationSlug,
  icon,
  title,
  actions,
  sidebarItems,
  children,
  attachments,
  className,
}: EntityDetailLayoutProps) {
  return (
    <div data-slot="entity-detail" className={cn("flex flex-wrap-reverse gap-9 h-full", className)}>
      <ScrollArea className="h-full min-w-70 flex-[999_1_400px] pr-4">
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <Link
                to="/projects/$projectSlug"
                params={{ projectSlug: organizationSlug }}
                className="flex items-center gap-1.5 font-medium text-foreground"
              >
                <Avatar size="sm" className="h-5 w-5">
                  <AvatarFallback className="text-[10px]">
                    {getInitials(organizationName)}
                  </AvatarFallback>
                </Avatar>
                {organizationName}
              </Link>
            </div>
            {actions}
          </div>

          <div className="flex items-center gap-2.5">
            {icon}
            <h1 className="m-0 text-[clamp(22px,4vw,26px)] leading-tight font-semibold tracking-tight">
              {title}
            </h1>
          </div>

          <Separator />

          <ScrollArea className="w-full shrink-0 pb-4 lg:hidden">
            <div className="flex flex-row gap-1.5">
              {sidebarItems.map((item) => (
                <Badge key={item.label} variant="secondary">
                  {item.badge ?? item.value}
                </Badge>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {children}

          {attachments}
        </div>
      </ScrollArea>

      <div className="flex w-280px flex-[1_1_220px] flex-col hidden lg:block">
        {sidebarItems.map((item) => (
          <div key={item.label}>
            <div className="flex items-start justify-between gap-2 px-1 py-2.5">
              <span className="pt-px text-xs font-medium text-muted-foreground">{item.label}</span>
              <div className="text-right text-[13px] font-medium">{item.value}</div>
            </div>
            <Separator />
          </div>
        ))}
      </div>
    </div>
  );
}
