import { useMatches, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export function DynamicBreadcrumb() {
  const { t } = useTranslation("navigation");
  const matches = useMatches();

  const crumbs = matches
    .filter(
      (m) =>
        (m.loaderData as { breadcrumb?: string } | undefined)?.breadcrumb ??
        m.staticData.breadcrumb,
    )
    .map((m) => {
      const dynamic = (m.loaderData as { breadcrumb?: string } | undefined)
        ?.breadcrumb;
      const label = dynamic ?? t(m.staticData.breadcrumb!);
      return { label, pathname: m.pathname };
    });

  if (crumbs.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className={crumbs.length > 0 ? "hidden md:block" : ""}>
          {crumbs.length > 0 ? (
            <BreadcrumbLink asChild>
              <Link to="/">
                <Home className="size-4" />
              </Link>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage>
              <Home className="size-4" />
            </BreadcrumbPage>
          )}
        </BreadcrumbItem>

        {crumbs.map((crumb, index) => (
          <div key={crumb.pathname} className="flex items-center gap-2">
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              {index === crumbs.length - 1 ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={crumb.pathname}>{crumb.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
