import { useState, type CSSProperties } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Trans, useLingui } from "@lingui/react/macro";
import {
  TIME_SIGNATURE_PATTERN,
  formatTimeSignature,
  normalizeBars,
  parseTimeSignature,
  sectionKindSchema,
  type SongSection,
} from "@echo/modules/song/domain";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ChordChartTextEditor } from "./chord-chart-text-editor";
import { ChordGrid } from "./chord-grid";
import { SECTION_KIND_COLORS, SECTION_KIND_LABELS } from "./section-kind";

const MAX_REPEAT = 16;

function draftOf(section: SongSection) {
  return { id: section.id, name: section.name, time: formatTimeSignature(section.time) };
}

export function SectionPanel({
  section,
  onChange,
  onDelete,
}: {
  section: SongSection;
  onChange: (section: SongSection) => void;
  onDelete: () => void;
}) {
  const { t } = useLingui();
  const [draft, setDraft] = useState(() => draftOf(section));
  const [deleteOpen, setDeleteOpen] = useState(false);
  if (draft.id !== section.id) setDraft(draftOf(section));

  const colorStyle: CSSProperties & Record<"--section-color", string> = {
    "--section-color": SECTION_KIND_COLORS[section.kind],
  };
  const nameInvalid = draft.name.trim() === "";
  const timeInvalid = parseTimeSignature(draft.time) === null;

  function changeName(name: string) {
    setDraft({ ...draft, name });
    if (name.trim() !== "") onChange({ ...section, name: name.trim() });
  }

  function changeTime(value: string) {
    setDraft({ ...draft, time: value });
    const time = parseTimeSignature(value);
    if (time) onChange({ ...section, time });
  }

  return (
    <section
      aria-label={t`Section detail`}
      className="flex flex-col gap-5 rounded-lg border bg-card p-5"
      style={colorStyle}
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_10rem_6rem_auto]">
        <Field data-invalid={nameInvalid}>
          <FieldLabel htmlFor="section-name">
            <Trans>Name</Trans>
          </FieldLabel>
          <Input
            id="section-name"
            maxLength={50}
            aria-invalid={nameInvalid}
            value={draft.name}
            onChange={(event) => changeName(event.target.value)}
          />
          {nameInvalid && (
            <FieldError>
              <Trans>Name is required</Trans>
            </FieldError>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="section-kind">
            <Trans>Type</Trans>
          </FieldLabel>
          <Select
            value={section.kind}
            onValueChange={(value) => {
              const kind = sectionKindSchema.safeParse(value);
              if (kind.success) onChange({ ...section, kind: kind.data });
            }}
          >
            <SelectTrigger id="section-kind" className="w-full">
              <SelectValue>{() => t(SECTION_KIND_LABELS[section.kind])}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {sectionKindSchema.options.map((kind) => (
                <SelectItem key={kind} value={kind}>
                  {t(SECTION_KIND_LABELS[kind])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field data-invalid={timeInvalid}>
          <FieldLabel htmlFor="section-time">
            <Trans>Time signature</Trans>
          </FieldLabel>
          <Input
            id="section-time"
            pattern={TIME_SIGNATURE_PATTERN.source}
            aria-invalid={timeInvalid}
            value={draft.time}
            onChange={(event) => changeTime(event.target.value)}
          />
          {timeInvalid && (
            <FieldError>
              <Trans>Use a time signature like 4/4</Trans>
            </FieldError>
          )}
        </Field>
        <Field>
          <FieldLabel>
            <Trans>Repeat</Trans>
          </FieldLabel>
          <div role="group" aria-label={t`Repeat count`} className="flex h-8 items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label={t`Fewer repeats`}
              disabled={section.repeat <= 1}
              onClick={() => onChange({ ...section, repeat: section.repeat - 1 })}
            >
              <Minus />
            </Button>
            <span className="min-w-7 text-center font-semibold tabular-nums">
              ×{section.repeat}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label={t`More repeats`}
              disabled={section.repeat >= MAX_REPEAT}
              onClick={() => onChange({ ...section, repeat: section.repeat + 1 })}
            >
              <Plus />
            </Button>
          </div>
        </Field>
      </div>

      <Tabs defaultValue="grid">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-heading text-sm font-semibold">
            <Trans>Chords</Trans>
          </h3>
          <TabsList>
            <TabsTrigger value="grid">
              <Trans>Grid</Trans>
            </TabsTrigger>
            <TabsTrigger value="text">
              <Trans>Text</Trans>
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="grid">
          <ChordGrid
            key={section.id}
            bars={section.bars}
            onChange={(bars) => onChange({ ...section, bars: normalizeBars(bars, section.time) })}
          />
        </TabsContent>
        <TabsContent value="text">
          <ChordChartTextEditor
            key={section.id}
            bars={section.bars}
            onChange={(bars) => onChange({ ...section, bars: normalizeBars(bars, section.time) })}
          />
        </TabsContent>
      </Tabs>

      <Field>
        <FieldLabel htmlFor="section-notes">
          <Trans>Notes</Trans>
        </FieldLabel>
        <Textarea
          id="section-notes"
          maxLength={5000}
          value={section.notes}
          onChange={(event) => onChange({ ...section, notes: event.target.value })}
        />
      </Field>

      <Button
        type="button"
        variant="outline"
        className="self-start text-destructive"
        onClick={() => setDeleteOpen(true)}
      >
        <Trash2 />
        <Trans>Delete section</Trans>
      </Button>
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        variant="destructive"
        title={<Trans>Delete section?</Trans>}
        description={<Trans>This will remove the section and its chords.</Trans>}
        confirmLabel={<Trans>Delete</Trans>}
        onConfirm={onDelete}
      />
    </section>
  );
}
