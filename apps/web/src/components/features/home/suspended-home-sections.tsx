import { Suspense, useRef, useState, type ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Trans, useLingui } from "@lingui/react/macro";
import {
  ArrowUpRight,
  CalendarDays,
  CalendarPlus,
  Files,
  ImagePlus,
  Images,
  ListMusic,
  Music,
  Plus,
  Upload,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useUploadFile } from "@/components/features/drive/use-upload-file";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListEmptyState } from "@/components/ui/list-empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { eventDotClasses } from "@/components/ui/event-calendar/colors";
import { AttachmentList } from "@/ui/attachment-list";
import { FileDetailsDialog } from "@/components/features/drive/file-details-dialog";
import { useAudioPlayerStore } from "@/stores/audio-player-store";
import { formatEventWhen } from "@/lib/event-format";
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
  type RecentFile,
} from "@/services/resources/drive";
import { getMyBalanceQueryOptions } from "@/services/resources/expense";
import { getRecentPlaylistsQueryOptions } from "@/services/resources/playlist";
import { getRecentSongsQueryOptions } from "@/services/resources/song";
import type { FileRouteTypes } from "@/routeTree.gen";
import { SongListItem } from "@/components/ui/song/song-list-item";
import { PlaylistListItem } from "@/components/ui/playlist/playlist-list-item";
import { SuspendedSongPlayButton } from "@/components/features/song/suspended-song-play-button";
import { SuspendedSongDuration } from "@/components/features/song/suspended-song-duration";
import { describeBalance } from "./describe-balance";

export interface HomeSectionProps {
  organizationId: string;
  projectSlug: string;
}

const rowClass =
  "flex items-center gap-2.5 rounded-xs px-2 py-1 text-sm no-underline hover:bg-muted/50";

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
      className={buttonVariants({ variant: "ghost", size: "icon-sm", className: "no-underline" })}
    >
      <ArrowUpRight aria-hidden />
      <span className="sr-only">{props.children}</span>
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
        action={
          <CreateLink
            to="/projects/$projectSlug/calendar"
            projectSlug={projectSlug}
            icon={<CalendarPlus data-icon="inline-start" />}
          >
            <Trans>Create your next event</Trans>
          </CreateLink>
        }
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
  const thumbnails = files.filter((file) => file.thumbnailUrl).slice(0, 4);
  const others = files.length - thumbnails.length;

  return (
    <div className="flex items-center gap-1.5">
      {thumbnails.map((file) => (
        <img
          key={file.id}
          src={file.thumbnailUrl ?? undefined}
          alt=""
          className="m-0 size-12 rounded-md bg-muted object-cover"
        />
      ))}
      {others > 0 && (
        <span className="flex h-12 items-center rounded-md bg-muted px-3 text-xs font-medium text-muted-foreground">
          <Trans>+{others} files</Trans>
        </span>
      )}
    </div>
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
        action={
          <CreateLink
            to="/projects/$projectSlug/calendar"
            projectSlug={projectSlug}
            icon={<CalendarPlus data-icon="inline-start" />}
          >
            <Trans>Create an event</Trans>
          </CreateLink>
        }
      />
    );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Link
          to="/projects/$projectSlug/calendar/$eventId"
          params={{ projectSlug, eventId: event.id }}
          className="flex items-center gap-2 font-heading text-lg font-semibold no-underline after:absolute after:inset-0 after:rounded-xl"
        >
          <span aria-hidden className={cn("size-2 rounded-full", eventDotClasses[event.color])} />
          {event.title}
        </Link>
        <span className="text-sm text-muted-foreground">
          {formatEventWhen(event, i18n.locale)}
          {event.place ? ` · ${event.place.name}` : ""}
        </span>
      </div>
      {event.description && <p className="m-0 line-clamp-3 text-sm">{event.description}</p>}
      <Suspense fallback={<Skeleton className="h-12 w-full" />}>
        <LastEventFiles organizationId={organizationId} eventId={event.id} />
      </Suspense>
    </div>
  );
}

export function SuspendedLastEvent(props: HomeSectionProps & { className?: string }) {
  return (
    <HomeSection
      className={cn("relative transition-colors hover:bg-muted/40", props.className)}
      title={<Trans>Last event</Trans>}
    >
      <LastEventContent {...props} />
    </HomeSection>
  );
}

function MyBalanceContent({ organizationId }: HomeSectionProps) {
  const { i18n, t } = useLingui();
  const { data: balance } = useSuspenseQuery(getMyBalanceQueryOptions({ organizationId }));
  const { kind, amountMinor } = describeBalance(balance.amountMinor);
  const label = {
    owe: t`You owe`,
    owed: t`You are owed`,
    settled: t`You're all settled`,
  }[kind];

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-heading text-3xl font-semibold tabular-nums">
        {formatMoney(amountMinor, balance.currency, i18n.locale)}
      </span>
    </div>
  );
}

export function SuspendedMyBalance(props: HomeSectionProps & { className?: string }) {
  return (
    <HomeSection
      className={props.className}
      title={<Trans>My balance</Trans>}
      action={
        <SectionLink to="/projects/$projectSlug/expenses" projectSlug={props.projectSlug}>
          <Trans>Expenses</Trans>
        </SectionLink>
      }
    >
      <MyBalanceContent {...props} />
    </HomeSection>
  );
}

function RecentFilesContent({ organizationId }: HomeSectionProps) {
  const { t } = useLingui();
  const uploadFiles = useDriveUpload(organizationId);
  const { data: files } = useSuspenseQuery(getRecentFilesQueryOptions({ organizationId }));
  const [detailsFile, setDetailsFile] = useState<RecentFile | null>(null);
  const requestPlay = useAudioPlayerStore((s) => s.requestPlay);
  const playingFileId = useAudioPlayerStore((s) =>
    s.status === "playing" ? s.file?.id : undefined,
  );

  if (files.length === 0)
    return (
      <DropZone onFiles={uploadFiles}>
        <ListEmptyState
          className="py-4"
          icon={<Files />}
          title={<Trans>No files yet</Trans>}
          description={<Trans>Audio and documents you upload to the drive show up here.</Trans>}
          action={
            <UploadButton
              label={t`Upload files`}
              icon={<Upload data-icon="inline-start" />}
              onFiles={uploadFiles}
            />
          }
        />
      </DropZone>
    );

  return (
    <>
      <AttachmentList
        view="list"
        files={files}
        playingFileId={playingFileId}
        onPlayAudio={(file) =>
          requestPlay({ id: file.id, filename: file.filename, downloadUrl: file.downloadUrl })
        }
        onDownload={(file) => downloadOrganizationFile({ id: file.id, organizationId })}
        onShowDetails={setDetailsFile}
      />
      <FileDetailsDialog
        file={detailsFile}
        organizationId={organizationId}
        onOpenChange={(open) => !open && setDetailsFile(null)}
      />
    </>
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

function useDriveUpload(organizationId: string) {
  const { t } = useLingui();
  const upload = useUploadFile();
  return (files: Iterable<File>) => {
    for (const file of files) {
      upload.mutate({ organizationId, file, place: { kind: "root" }, destinationLabel: t`Drive` });
    }
  };
}

function UploadButton({
  label,
  icon,
  onFiles,
}: {
  label: string;
  icon: ReactNode;
  onFiles: (files: Iterable<File>) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        aria-label={label}
        className="sr-only"
        onChange={(event) => {
          onFiles(event.target.files ?? []);
          event.target.value = "";
        }}
      />
      <Button size="sm" onClick={() => inputRef.current?.click()}>
        {icon}
        {label}
      </Button>
    </>
  );
}

function DropZone({
  onFiles,
  children,
}: {
  onFiles: (files: Iterable<File>) => void;
  children: ReactNode;
}) {
  const [isDragging, setIsDragging] = useState(false);
  return (
    <div
      data-dragging={isDragging}
      className="rounded-xl transition-colors data-[dragging=true]:bg-muted/50 data-[dragging=true]:ring-2 data-[dragging=true]:ring-primary"
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(event) => {
        const target = event.relatedTarget;
        if (!(target instanceof Node && event.currentTarget.contains(target))) setIsDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        onFiles(event.dataTransfer.files);
      }}
    >
      {children}
    </div>
  );
}

function CreateLink({
  to,
  projectSlug,
  icon,
  children,
}: {
  to:
    | "/projects/$projectSlug/calendar"
    | "/projects/$projectSlug/songs"
    | "/projects/$projectSlug/playlists";
  projectSlug: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      params={{ projectSlug }}
      search={{ create: true }}
      className={buttonVariants({ size: "sm", className: "no-underline" })}
    >
      {icon}
      {children}
    </Link>
  );
}

function RecentMediaContent({ organizationId }: HomeSectionProps) {
  const { t } = useLingui();
  const uploadMedia = useDriveUpload(organizationId);
  const { data: media } = useSuspenseQuery(
    getRecentMediaQueryOptions({ organizationId, limit: 9 }),
  );

  if (media.length === 0)
    return (
      <DropZone onFiles={uploadMedia}>
        <ListEmptyState
          className="py-4"
          icon={<Images />}
          title={<Trans>No photos or videos yet</Trans>}
          description={<Trans>Upload media to the drive or to an event.</Trans>}
          action={
            <UploadButton
              label={t`Upload photos or videos`}
              icon={<ImagePlus data-icon="inline-start" />}
              onFiles={uploadMedia}
            />
          }
        />
      </DropZone>
    );

  return (
    <AttachmentList
      view="gallery"
      files={media}
      onDownload={(file) => downloadOrganizationFile({ id: file.id, organizationId })}
    />
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
        action={
          <CreateLink
            to="/projects/$projectSlug/songs"
            projectSlug={projectSlug}
            icon={<Plus data-icon="inline-start" />}
          >
            <Trans>New song</Trans>
          </CreateLink>
        }
      />
    );

  return (
    <ul className="m-0 flex flex-col p-0">
      {songs.map((song) => (
        <li key={song.id} className="m-0 list-none p-0">
          <SongListItem
            song={song}
            projectSlug={projectSlug}
            leading={
              <SuspendedSongPlayButton
                songId={song.id}
                organizationId={organizationId}
                title={song.title}
              />
            }
            duration={<SuspendedSongDuration songId={song.id} organizationId={organizationId} />}
          />
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
        action={
          <CreateLink
            to="/projects/$projectSlug/playlists"
            projectSlug={projectSlug}
            icon={<Plus data-icon="inline-start" />}
          >
            <Trans>New playlist</Trans>
          </CreateLink>
        }
      />
    );

  return (
    <ul className="m-0 flex flex-col p-0">
      {playlists.map((playlist) => (
        <li key={playlist.id} className="m-0 list-none p-0">
          <PlaylistListItem playlist={playlist} projectSlug={projectSlug} />
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
