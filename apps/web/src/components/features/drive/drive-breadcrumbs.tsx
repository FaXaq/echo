import { Fragment } from "react";
import { useLingui } from "@lingui/react/macro";
import { Link } from "@tanstack/react-router";
import type { DriveLocation } from "@echo/modules/drive/domain";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { driveLocationLink, locationKey } from "@/lib/drive-location";

export function DriveBreadcrumbs({
  projectSlug,
  path,
}: {
  projectSlug: string;
  path: { label: string; location: DriveLocation }[];
}) {
  const { t } = useLingui();
  const isRoot = path.length === 0;

  return (
    <Breadcrumb>
      <BreadcrumbList className="list-none p-0 pb-2 m-0">
        <BreadcrumbItem className="m-0">
          {isRoot ? (
            <BreadcrumbPage>{t`/`}</BreadcrumbPage>
          ) : (
            <BreadcrumbLink render={<Link {...driveLocationLink(projectSlug, { kind: "root" })} />}>
              {t`/`}
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>
        {path.map((segment, index) => (
          <Fragment key={locationKey(segment.location)}>
            <BreadcrumbSeparator className="m-0" />
            <BreadcrumbItem className="m-0">
              {index === path.length - 1 ? (
                <BreadcrumbPage>{segment.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  render={<Link {...driveLocationLink(projectSlug, segment.location)} />}
                >
                  {segment.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
