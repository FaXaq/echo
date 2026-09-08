import { useLingui } from "@lingui/react/macro";
import { MarkdownEditor, type MarkdownSaveStatus } from "@/components/ui/markdown-editor";

export interface LyricsEditorProps {
  markdown: string;
  onChange: (markdown: string) => void;
  saveStatus?: MarkdownSaveStatus;
}

export function LyricsEditor({ markdown, onChange, saveStatus }: LyricsEditorProps) {
  const { t } = useLingui();

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] font-semibold">{t`Lyrics`}</span>
      <MarkdownEditor
        markdown={markdown}
        onChange={onChange}
        placeholder={t`Write the lyrics…`}
        saveStatus={saveStatus}
        className="min-h-64 max-h-[32rem] overflow-y-auto rounded-lg border px-4 py-3 text-sm leading-relaxed [&_.ProseMirror]:min-h-56 [&_.ProseMirror]:outline-none [&_.ProseMirror_p]:my-1"
      />
    </div>
  );
}
