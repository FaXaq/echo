import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export interface SidebarItem {
  label: string;
  value: React.ReactNode;
  badge?: React.ReactNode;
}

export interface EntityDetailLayoutProps {
  icon?: React.ReactNode;
  title: string;
  actions?: React.ReactNode;
  sidebarItems: SidebarItem[];
  children?: React.ReactNode;
  attachments: React.ReactNode;
  className?: string;
}

export function EntityDetailLayout({
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
          <div className="flex flex-row gap-2.5 w-full">
            <div className="self-center">{icon}</div>
            <h1 className="m-0 text-[clamp(22px,4vw,26px)] leading-tight font-semibold tracking-tight">
              {title}
            </h1>
            <div className="flex items-center justify-between m-0 ml-auto">{actions}</div>
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
