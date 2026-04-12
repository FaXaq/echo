import { useState } from "react";
import type React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DragDropProvider } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { move } from "@dnd-kit/helpers";
import { trpcLoader, trpc } from "@/lib/trpc";
import { useTranslation } from "react-i18next";
import { Button } from "@/ui/button";
import { EditableBadge } from "@/ui/editable-badge";
import { ViewModeToggle, type ViewMode } from "./-view-mode-toggle";
import { SectionCard, type SectionInstance } from "./-section-card";
import { AddSectionRow } from "./-add-section-row";
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

function SortableSectionRow({
  instance,
  index,
  viewMode,
  autoFocusName,
  onDelete,
}: {
  instance: SectionInstance;
  index: number;
  viewMode: ViewMode;
  autoFocusName?: boolean;
  onDelete: (id: string) => void;
}) {
  const { ref, handleRef, isDragging } = useSortable({ id: instance.id, index });

  return (
    <div ref={ref as React.Ref<HTMLDivElement>}>
      <SectionCard
        instance={instance}
        viewMode={viewMode}
        dragging={isDragging}
        handleRef={handleRef as React.Ref<HTMLDivElement>}
        autoFocusName={autoFocusName}
        onDelete={() => onDelete(instance.id)}
      />
    </div>
  );
}


function SongDetailPage() {
  const { t } = useTranslation("songs");
  const { song, instances: initialInstances } = Route.useLoaderData();
  const { organizationSlug, songSlug } = Route.useParams();
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const [viewMode, setViewMode] = useState<ViewMode>("lyrics+chords");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newlyCreatedDefId, setNewlyCreatedDefId] = useState<string | null>(null);

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

  const createDefinition = trpc.organization.song.section.definition.create.useMutation();
  const createInstance = trpc.organization.song.section.instance.create.useMutation({
    onSuccess: () => utils.organization.song.section.instance.list.invalidate({ songId: song.id }),
  });

  const deletingInstance = deletingId ? instances.find(i => i.id === deletingId) : null;

  async function handleCreateNew(name: string) {
    const def = await createDefinition.mutateAsync({ songId: song.id, name });
    setNewlyCreatedDefId(def.id);
    createInstance.mutate({ songId: song.id, definitionId: def.id });
  }

  function handleAddInstance(definitionId: string) {
    createInstance.mutate({ songId: song.id, definitionId });
  }

  const isAddPending = createDefinition.isPending || createInstance.isPending;

  const existingDefinitions = Array.from(
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
        <div className="mb-4">
          <ViewModeToggle value={viewMode} onChange={setViewMode} />
        </div>

        <div className="space-y-3">
          <DragDropProvider
            onDragEnd={(event) => {
              if (event.canceled) return;
              const reordered = move(instances, event);
              reorderInstances.mutate({
                songId: song.id,
                orderedIds: reordered.map(i => i.id),
              });
            }}
          >
            {instances.map((instance, index) => (
              <SortableSectionRow
                key={instance.id}
                instance={instance as SectionInstance}
                index={index}
                viewMode={viewMode}
                autoFocusName={instance.definition.id === newlyCreatedDefId}
                onDelete={setDeletingId}
              />
            ))}
          </DragDropProvider>

          <AddSectionRow
            existingDefinitions={existingDefinitions}
            onCreateNew={handleCreateNew}
            onAddInstance={handleAddInstance}
            isPending={isAddPending}
          />
        </div>
      </div>

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
