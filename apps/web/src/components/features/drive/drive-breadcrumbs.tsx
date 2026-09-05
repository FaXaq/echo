import { Fragment } from "react";
import { useLingui } from "@lingui/react/macro";
import { Link } from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { Folder } from "@/services/resources/drive";

export function DriveBreadcrumbs({ projectSlug, path }: { projectSlug: string; path: Folder[] }) {
  const { t } = useLingui();
  const isRoot = path.length === 0;

  return (
    <Breadcrumb>
      <BreadcrumbList className="list-none p-0 pb-2 m-0">
        <BreadcrumbItem className="m-0">
          {isRoot ? (
            <BreadcrumbPage>{t`/`}</BreadcrumbPage>
          ) : (
            <BreadcrumbLink
              render={<Link to="/projects/$projectSlug/drive" params={{ projectSlug }} />}
            >
              {t`/`}
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>
        {path.map((folder, index) => (
          <Fragment key={folder.id}>
            <BreadcrumbSeparator className="m-0" />
            <BreadcrumbItem className="m-0">
              {index === path.length - 1 ? (
                <BreadcrumbPage>{folder.name}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  render={
                    <Link
                      to="/projects/$projectSlug/drive/$folderId"
                      params={{ projectSlug, folderId: folder.id }}
                    />
                  }
                >
                  {folder.name}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
