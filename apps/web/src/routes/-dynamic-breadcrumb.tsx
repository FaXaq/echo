import { useMatches, Link } from "@tanstack/react-router";
import { useLingui } from "@lingui/react/macro";
import { Home } from "lucide-react";
import { translateDynamic } from "@/lib/dynamic-messages";
import { usePageMetaOverride } from "@/contexts/page-meta";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

function useBreadcrumbLabel(match: ReturnType<typeof useMatches>[number]) {
  const override = usePageMetaOverride(match.pathname)?.breadcrumb;
  const loaderBreadcrumb = (match.loaderData as { breadcrumb?: string } | undefined)?.breadcrumb;
  return override ?? loaderBreadcrumb ?? match.staticData.breadcrumb;
}

function BreadcrumbCrumb({
  match,
  isLast,
}: {
  match: ReturnType<typeof useMatches>[number];
  isLast: boolean;
}) {
  const { t } = useLingui();
  const rawLabel = useBreadcrumbLabel(match);
  if (!rawLabel) return null;
  const label = translateDynamic(t, rawLabel);

  return (
    <div className="flex items-center gap-2">
      <BreadcrumbSeparator className="hidden md:block" />
      <BreadcrumbItem>
        {isLast ? (
          <BreadcrumbPage>{label}</BreadcrumbPage>
        ) : (
          <BreadcrumbLink render={<Link to={match.pathname} />}>{label}</BreadcrumbLink>
        )}
      </BreadcrumbItem>
    </div>
  );
}

export function DynamicBreadcrumb() {
  const matches = useMatches();

  const crumbMatches = matches.filter((m) => {
    const override =
      m.staticData.breadcrumb ?? (m.loaderData as { breadcrumb?: string })?.breadcrumb;
    return Boolean(override);
  });

  if (crumbMatches.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink render={<Link to="/" />}>
            <Home className="size-4" />
          </BreadcrumbLink>
        </BreadcrumbItem>

        {crumbMatches.map((match, index) => (
          <BreadcrumbCrumb
            key={match.pathname}
            match={match}
            isLast={index === crumbMatches.length - 1}
          />
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
