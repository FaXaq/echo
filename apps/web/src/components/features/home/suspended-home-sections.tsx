import { Suspense, type ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Trans, useLingui } from "@lingui/react/macro";
import { CalendarDays, Files, Images, ListMusic, Music, Play } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListEmptyState } from "@/components/ui/list-empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { eventDotClasses } from "@/components/ui/event-calendar/colors";
import { AttachmentList, gallerySpan } from "@/ui/attachment-list";
import { formatEventWhen } from "@/lib/event-format";
import { formatDuration, formatSize } from "@/lib/file";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import {
  getLastEventQueryOptions,
  getUpcomingEventsQueryOptions,
} from "@/services/resources/calendar";
import {
  downloadOrganizationFile,
  getEventFilesQueryOptions,
  getRecentFilesQueryOptions,
  getRecentMediaQueryOptions,
} from "@/services/resources/drive";
import { getMyBalanceQueryOptions } from "@/services/resources/expense";
import { getRecentPlaylistsQueryOptions } from "@/services/resources/playlist";
import { getRecentSongsQueryOptions } from "@/services/resources/song";
import type { FileRouteTypes } from "@/routeTree.gen";
import { describeBalance } from "./describe-balance";

export interface HomeSectionProps {
  organizationId: string;
  projectSlug: string;
}

const rowClass =
  "flex items-center gap-2.5 rounded-xs py-1.5 text-sm no-underline hover:bg-muted/50";

function SectionError() {
  return (
    <p className="m-0 text-sm text-destructive">
      <Trans>Couldn't load this section</Trans>
    </p>
  );
}

function HomeSection({
  title,
  action,
  className,
  children,
}: {
  title: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent>
        <ErrorBoundary FallbackComponent={SectionError}>
          <Suspense fallback={<Skeleton className="h-28 w-full" />}>{children}</Suspense>
        </ErrorBoundary>
      </CardContent>
    </Card>
  );
}

function SectionLink(props: {
  to: FileRouteTypes["to"];
  projectSlug: string;
  children: ReactNode;
}) {
  return (
    <Link
      to={props.to}
      params={{ projectSlug: props.projectSlug }}
      className={buttonVariants({ variant: "link", size: "sm" })}
    >
      {props.children}
    </Link>
  );
}

function UpcomingEventsContent({ organizationId, projectSlug }: HomeSectionProps) {
  const { i18n } = useLingui();
  const { data: events } = useSuspenseQuery(getUpcomingEventsQueryOptions({ organizationId }));
  const dayFormat = new Intl.DateTimeFormat(i18n.locale, { day: "numeric", month: "short" });
  const timeFormat = new Intl.DateTimeFormat(i18n.locale, { timeStyle: "short" });

  if (events.length === 0)
    return (
      <ListEmptyState
        className="py-4"
        icon={<CalendarDays />}
        title={<Trans>No upcoming events</Trans>}
        description={<Trans>Plan rehearsals and gigs from the calendar.</Trans>}
      />
    );

  return (
    <ul className="m-0 flex list-none flex-col p-0">
      {events.map((event) => (
        <li key={event.id}>
          <Link
            to="/projects/$projectSlug/calendar/$eventId"
            params={{ projectSlug, eventId: event.id }}
            className={rowClass}
          >
            <span className="w-14 shrink-0 font-semibold tabular-nums">
              {dayFormat.format(new Date(event.startDate))}
            </span>
            <span
              aria-hidden
              className={cn("size-2 shrink-0 rounded-full", eventDotClasses[event.color])}
            />
            <span className="min-w-0 flex-1 truncate">
              <span className="font-medium">{event.title}</span>
              <span className="text-muted-foreground">
                {event.allDay ? "" : ` · ${timeFormat.format(new Date(event.startDate))}`}
                {event.place ? ` · ${event.place.name}` : ""}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function SuspendedUpcomingEvents(props: HomeSectionProps & { className?: string }) {
  return (
    <HomeSection
      className={props.className}
      title={<Trans>Upcoming events</Trans>}
      action={
        <SectionLink to="/projects/$projectSlug/calendar" projectSlug={props.projectSlug}>
          <Trans>Calendar</Trans>
        </SectionLink>
      }
    >
      <UpcomingEventsContent {...props} />
    </HomeSection>
  );
}

function LastEventFiles({ organizationId, eventId }: { organizationId: string; eventId: string }) {
  const { data: files } = useSuspenseQuery(getEventFilesQueryOptions({ organizationId, eventId }));
  if (files.length === 0) return null;
  return (
    <AttachmentList
      files={files}
      onDownload={(file) => downloadOrganizationFile({ id: file.id, organizationId })}
    />
  );
}

function LastEventContent({ organizationId, projectSlug }: HomeSectionProps) {
  const { i18n } = useLingui();
  const { data: event } = useSuspenseQuery(getLastEventQueryOptions({ organizationId }));

  if (!event)
    return (
      <ListEmptyState
        className="py-4"
        icon={<CalendarDays />}
        title={<Trans>No past events yet</Trans>}
        description={<Trans>Your latest event will show up here once it's over.</Trans>}
      />
    );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Link
          to="/projects/$projectSlug/calendar/$eventId"
          params={{ projectSlug, eventId: event.id }}
          className="flex items-center gap-2 font-heading text-lg font-semibold no-underline"
        >
          <span aria-hidden className={cn("size-2 rounded-full", eventDotClasses[event.color])} />
          {event.title}
        </Link>
        <span className="text-sm text-muted-foreground">
          {formatEventWhen(event, i18n.locale)}
          {event.place ? ` · ${event.place.name}` : ""}
        </span>
      </div>
      {event.description && <p className="m-0 text-sm">{event.description}</p>}
      <Suspense fallback={<Skeleton className="h-20 w-full" />}>
        <LastEventFiles organizationId={organizationId} eventId={event.id} />
      </Suspense>
    </div>
  );
}

export function SuspendedLastEvent(props: HomeSectionProps & { className?: string }) {
  return (
    <HomeSection className={props.className} title={<Trans>Last event</Trans>}>
      <LastEventContent {...props} />
    </HomeSection>
  );
}

function MyBalanceContent({ organizationId, projectSlug }: HomeSectionProps) {
  const { i18n, t } = useLingui();
  const { data: balance } = useSuspenseQuery(getMyBalanceQueryOptions({ organizationId }));
  const { kind, amountMinor } = describeBalance(balance.amountMinor);
  const label = {
    owe: t`You owe`,
    owed: t`You are owed`,
    settled: t`You're all settled`,
  }[kind];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="font-heading text-3xl font-semibold tabular-nums">
          {formatMoney(amountMinor, balance.currency, i18n.locale)}
        </span>
      </div>
      <Link
        to="/projects/$projectSlug/expenses"
        params={{ projectSlug }}
        className={buttonVariants({ size: "sm", className: "self-start" })}
      >
        <Trans>Open expenses</Trans>
      </Link>
    </div>
  );
}

export function SuspendedMyBalance(props: HomeSectionProps & { className?: string }) {
  return (
    <HomeSection className={props.className} title={<Trans>My balance</Trans>}>
      <MyBalanceContent {...props} />
    </HomeSection>
  );
}

function RecentFilesContent({ organizationId }: HomeSectionProps) {
  const { data: files } = useSuspenseQuery(getRecentFilesQueryOptions({ organizationId }));

  if (files.length === 0)
    return (
      <ListEmptyState
        className="py-4"
        icon={<Files />}
        title={<Trans>No files yet</Trans>}
        description={<Trans>Audio and documents you upload to the drive show up here.</Trans>}
      />
    );

  return (
    <ul className="m-0 flex list-none flex-col p-0">
      {files.map((file) => (
        <li key={file.id}>
          <button
            type="button"
            onClick={() => downloadOrganizationFile({ id: file.id, organizationId })}
            className={cn(rowClass, "w-full cursor-pointer border-0 bg-transparent text-start")}
          >
            <span className="w-9 shrink-0 font-mono text-[10px] font-bold uppercase text-muted-foreground">
              {file.filename.split(".").pop()}
            </span>
            <span className="min-w-0 flex-1 truncate font-medium">{file.filename}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatSize(file.sizeBytes)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function SuspendedRecentFiles(props: HomeSectionProps & { className?: string }) {
  return (
    <HomeSection
      className={props.className}
      title={<Trans>Latest files</Trans>}
      action={
        <SectionLink to="/projects/$projectSlug/drive" projectSlug={props.projectSlug}>
          <Trans>Drive</Trans>
        </SectionLink>
      }
    >
      <RecentFilesContent {...props} />
    </HomeSection>
  );
}

function RecentMediaContent({ organizationId }: HomeSectionProps) {
  const { data: media } = useSuspenseQuery(
    getRecentMediaQueryOptions({ organizationId, limit: 9 }),
  );

  if (media.length === 0)
    return (
      <ListEmptyState
        className="py-4"
        icon={<Images />}
        title={<Trans>No photos or videos yet</Trans>}
        description={<Trans>Upload media to the drive or to an event.</Trans>}
      />
    );

  return (
    <ul className="m-0 grid grid-flow-row-dense auto-rows-[5.5rem] grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-1 p-0">
      {media.map((file) => {
        const span = gallerySpan(file);
        return (
          <li
            key={file.id}
            className="relative m-0 list-none overflow-hidden rounded-md bg-muted p-0"
            style={{ gridColumn: `span ${span.columns}`, gridRow: `span ${span.rows}` }}
          >
            <a href={file.downloadUrl} target="_blank" rel="noreferrer" className="block size-full">
              {file.thumbnailUrl ? (
                <img
                  src={file.thumbnailUrl}
                  alt={file.filename}
                  className="size-full object-cover"
                />
              ) : (
                <span className="flex size-full items-center justify-center text-muted-foreground">
                  <Images aria-hidden className="size-4" />
                  <span className="sr-only">{file.filename}</span>
                </span>
              )}
              {file.kind === "video" && (
                <span className="absolute start-1 bottom-1 flex items-center gap-0.5 rounded-sm bg-primary px-1 text-[11px] text-primary-foreground tabular-nums">
                  <Play aria-hidden className="size-2 fill-current" />
                  {file.durationSeconds != null && formatDuration(file.durationSeconds)}
                </span>
              )}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

export function SuspendedRecentMedia(props: HomeSectionProps & { className?: string }) {
  return (
    <HomeSection
      className={props.className}
      title={<Trans>Latest media</Trans>}
      action={
        <SectionLink to="/projects/$projectSlug/drive" projectSlug={props.projectSlug}>
          <Trans>Drive</Trans>
        </SectionLink>
      }
    >
      <RecentMediaContent {...props} />
    </HomeSection>
  );
}

function RecentSongsContent({ organizationId, projectSlug }: HomeSectionProps) {
  const { data: songs } = useSuspenseQuery(getRecentSongsQueryOptions({ organizationId }));

  if (songs.length === 0)
    return (
      <ListEmptyState
        className="py-4"
        icon={<Music />}
        title={<Trans>No songs yet</Trans>}
        description={<Trans>Songs you create or edit show up here.</Trans>}
      />
    );

  return (
    <ul className="m-0 flex list-none flex-col p-0">
      {songs.map((song) => (
        <li key={song.id}>
          <Link
            to="/projects/$projectSlug/songs/$songId"
            params={{ projectSlug, songId: song.id }}
            className={rowClass}
          >
            <Music aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate font-medium">{song.title}</span>
            {song.artist && (
              <span className="shrink-0 text-xs text-muted-foreground">{song.artist}</span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function SuspendedRecentSongs(props: HomeSectionProps & { className?: string }) {
  return (
    <HomeSection
      className={props.className}
      title={<Trans>Recently edited songs</Trans>}
      action={
        <SectionLink to="/projects/$projectSlug/songs" projectSlug={props.projectSlug}>
          <Trans>All songs</Trans>
        </SectionLink>
      }
    >
      <RecentSongsContent {...props} />
    </HomeSection>
  );
}

function RecentPlaylistsContent({ organizationId, projectSlug }: HomeSectionProps) {
  const { data: playlists } = useSuspenseQuery(getRecentPlaylistsQueryOptions({ organizationId }));

  if (playlists.length === 0)
    return (
      <ListEmptyState
        className="py-4"
        icon={<ListMusic />}
        title={<Trans>No playlists yet</Trans>}
        description={<Trans>Build a setlist from the playlists page.</Trans>}
      />
    );

  return (
    <ul className="m-0 flex list-none flex-col p-0">
      {playlists.map((playlist) => (
        <li key={playlist.id}>
          <Link
            to="/projects/$projectSlug/playlists/$playlistId"
            params={{ projectSlug, playlistId: playlist.id }}
            className={rowClass}
          >
            <ListMusic aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate font-medium">{playlist.title}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              <Trans>{playlist.songCount} songs</Trans>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function SuspendedRecentPlaylists(props: HomeSectionProps & { className?: string }) {
  return (
    <HomeSection
      className={props.className}
      title={<Trans>New playlists</Trans>}
      action={
        <SectionLink to="/projects/$projectSlug/playlists" projectSlug={props.projectSlug}>
          <Trans>All playlists</Trans>
        </SectionLink>
      }
    >
      <RecentPlaylistsContent {...props} />
    </HomeSection>
  );
}
