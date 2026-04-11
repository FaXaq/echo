import { useState, useRef } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { trpcLoader, trpc } from "@/lib/trpc";
import { useTranslation, Trans } from "react-i18next";
import { Button } from "@/ui/button";
import { EditableBadge } from "@/ui/editable-badge";
import { ViewModeToggle, type ViewMode } from "./-view-mode-toggle";
import { SectionCard, type SectionInstance } from "./-section-card";
import { AddSectionDialog } from "./-add-section-dialog";
import { DeleteSectionDialog } from "./-delete-section-dialog";

export const Route = createFileRoute(
  "/_auth-guard/organizations/$organizationSlug/songs/$songSlug/",
)({
  loader: async ({ params }) => {
    const [song, instances] = await Promise.all([
      trpcLoader.organization.song.get.query({ songId: params.songSlug }),
      trpcLoader.organization.song.section.instance.list.query({ songId: params.songSlug }),
    ]);
    return { song, instances };
  },
  component: SongDetailPage,
});

function SongDetailPage() {
  const { t } = useTranslation("songs");
  const { song, instances: initialInstances } = Route.useLoaderData();
  const { organizationSlug, songSlug } = Route.useParams();
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const [viewMode, setViewMode] = useState<ViewMode>("lyrics+chords");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const draggingId = useRef<string | null>(null);

  const { data: instances = initialInstances } =
    trpc.organization.song.section.instance.list.useQuery({ songId: song.id });

  const updateSong = trpc.organization.song.update.useMutation({
    onSuccess: () => utils.organization.song.get.invalidate({ songId: song.id }),
  });

  const deleteInstance = trpc.organization.song.section.instance.delete.useMutation({
    onSuccess: () => {
      utils.organization.song.section.instance.list.invalidate({ songId: song.id });
      setDeletingId(null);
    },
  });

  const reorderInstances = trpc.organization.song.section.instance.reorder.useMutation({
    onSuccess: () => utils.organization.song.section.instance.list.invalidate({ songId: song.id }),
  });

  function handleDrop(targetId: string) {
    const sourceId = draggingId.current;
    if (!sourceId || sourceId === targetId) {
      draggingId.current = null;
      setDragOverId(null);
      return;
    }
    const ids = instances.map(i => i.id);
    const from = ids.indexOf(sourceId);
    const to = ids.indexOf(targetId);
    if (from === -1 || to === -1) return;
    const reordered = [...ids];
    reordered.splice(from, 1);
    reordered.splice(to, 0, sourceId);
    reorderInstances.mutate({ songId: song.id, orderedIds: reordered });
    draggingId.current = null;
    setDragOverId(null);
  }

  const deletingInstance = deletingId ? instances.find(i => i.id === deletingId) : null;

  const uniqueDefinitions = Array.from(
    new Map(instances.map(i => [i.definition.id, i.definition])).values()
  );

  return (
    <div className="p-6 max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{song.name}</h1>
          <div className="flex gap-2 mt-2">
            <EditableBadge
              label={t("BPM")}
              value={song.bpm ?? ""}
              type="number"
              placeholder={t("Add BPM")}
              onSave={(val) => {
                const bpm = parseInt(val, 10);
                if (!isNaN(bpm) && bpm > 0) updateSong.mutate({ songId: song.id, bpm });
              }}
            />
            <EditableBadge
              label={t("Key")}
              value={song.key ?? ""}
              placeholder={t("Add key")}
              onSave={(val) => updateSong.mutate({ songId: song.id, key: val || null })}
            />
          </div>
          {song.description && (
            <p className="mt-2 text-sm text-muted-foreground">{song.description}</p>
          )}
        </div>
        <Button
          onClick={() =>
            navigate({
              to: "/organizations/$organizationSlug/songs/$songSlug/daw",
              params: { organizationSlug, songSlug },
            })
          }
        >
          {t("Open DAW")}
        </Button>
      </div>

      {/* Structure section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <ViewModeToggle value={viewMode} onChange={setViewMode} />
          <Button variant="outline" size="sm" onClick={() => setShowAddDialog(true)}>
            <Trans t={t}>Add section</Trans>
          </Button>
        </div>

        {instances.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
            <Trans t={t}>No sections yet. Add your first section to get started.</Trans>
          </div>
        ) : (
          <div className="space-y-3">
            {instances.map(instance => (
              <div
                key={instance.id}
                className={[
                  "relative group",
                  dragOverId === instance.id ? "ring-2 ring-primary rounded-lg" : "",
                ].join(" ")}
              >
                <SectionCard
                  instance={instance as SectionInstance}
                  viewMode={viewMode}
                  dragging={draggingId.current === instance.id}
                  onDragStart={() => { draggingId.current = instance.id; }}
                  onDragOver={() => setDragOverId(instance.id)}
                  onDrop={() => handleDrop(instance.id)}
                />
                <button
                  type="button"
                  title={t("Remove section")}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all text-xs px-2 py-0.5 rounded"
                  onClick={() => setDeletingId(instance.id)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      {showAddDialog && (
        <AddSectionDialog
          songId={song.id}
          existingDefinitions={uniqueDefinitions}
          onClose={() => setShowAddDialog(false)}
        />
      )}

      {deletingInstance && (
        <DeleteSectionDialog
          sectionName={deletingInstance.definition.name}
          isPending={deleteInstance.isPending}
          onConfirm={() => deleteInstance.mutate({ id: deletingInstance.id })}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  );
}
