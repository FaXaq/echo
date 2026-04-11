import { useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { Button } from "@/ui/button";
import type { SectionInstance } from "./-section-card";

const PRESETS = ["Intro", "Verse", "Chorus", "Bridge", "Outro", "Buildup"];

type Props = {
  songId: string;
  existingDefinitions: SectionInstance["definition"][];
  onClose: () => void;
};

export function AddSectionDialog({ songId, existingDefinitions, onClose }: Props) {
  const { t } = useTranslation("songs");
  const utils = trpc.useUtils();

  const [name, setName] = useState("");
  const [selectedDefinitionId, setSelectedDefinitionId] = useState<string | null>(null);

  const createDefinition = trpc.organization.song.section.definition.create.useMutation();
  const createInstance = trpc.organization.song.section.instance.create.useMutation({
    onSuccess: () => {
      utils.organization.song.section.instance.list.invalidate({ songId });
      onClose();
    },
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedDefinitionId) {
      createInstance.mutate({ songId, definitionId: selectedDefinitionId });
    } else if (name.trim()) {
      const def = await createDefinition.mutateAsync({ songId, name: name.trim() });
      createInstance.mutate({ songId, definitionId: def.id });
    }
  }

  const isPending = createDefinition.isPending || createInstance.isPending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <h2 className="font-semibold text-lg"><Trans t={t}>Add section</Trans></h2>

        {/* Reuse existing */}
        {existingDefinitions.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">
              <Trans t={t}>Reuse an existing section</Trans>
            </p>
            <div className="flex flex-wrap gap-2">
              {existingDefinitions.map(def => (
                <button
                  key={def.id}
                  type="button"
                  onClick={() => { setSelectedDefinitionId(def.id); setName(""); }}
                  className={[
                    "px-3 py-1 rounded-full text-sm border transition-colors",
                    selectedDefinitionId === def.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-muted",
                  ].join(" ")}
                >
                  {def.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Create new */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-2">
              <Trans t={t}>Or create a new section</Trans>
            </p>
            {/* Quick presets */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PRESETS.map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => { setName(t(preset as any) || preset); setSelectedDefinitionId(null); }}
                  className="px-2.5 py-0.5 text-xs rounded-full border border-border hover:bg-muted transition-colors"
                >
                  {t(preset as any) || preset}
                </button>
              ))}
            </div>
            <input
              className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background outline-none focus:border-primary"
              placeholder={t("Section name")}
              value={name}
              onChange={e => { setName(e.target.value); setSelectedDefinitionId(null); }}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              <Trans t={t}>Cancel</Trans>
            </Button>
            <Button
              type="submit"
              disabled={isPending || (!name.trim() && !selectedDefinitionId)}
            >
              {isPending ? <Trans t={t}>Adding…</Trans> : <Trans t={t}>Add</Trans>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
