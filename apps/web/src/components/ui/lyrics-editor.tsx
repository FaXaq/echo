import { useState } from "react";
import { Maximize2 } from "lucide-react";
import { useLingui } from "@lingui/react/macro";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { MarkdownEditor, type MarkdownSaveStatus } from "@/components/ui/markdown-editor";

export interface LyricsEditorProps {
  markdown: string;
  onChange: (markdown: string) => void;
  saveStatus?: MarkdownSaveStatus;
}

export function LyricsEditor({ markdown, onChange, saveStatus }: LyricsEditorProps) {
  const { t } = useLingui();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const editorProps = { markdown, onChange, saveStatus, placeholder: t`Write the lyrics…` };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold">{t`Lyrics`}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={t`Full screen`}
          onClick={() => setIsFullscreen(true)}
        >
          <Maximize2 />
        </Button>
      </div>
      {/* The editor only reads `markdown` on mount: remount it to pick up full-screen edits. */}
      <MarkdownEditor
        key={String(isFullscreen)}
        {...editorProps}
        className="min-h-64 max-h-[32rem] rounded-lg border px-4 py-3 text-sm leading-relaxed [&_.ProseMirror]:min-h-56 [&_.ProseMirror]:outline-none [&_.ProseMirror_p]:my-1"
      />
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="top-0 start-0 h-dvh w-screen max-w-none translate-x-0 translate-y-0 content-start rounded-none p-6 ring-0 sm:max-w-none rtl:translate-x-0">
          <DialogTitle>{t`Lyrics`}</DialogTitle>
          <MarkdownEditor
            {...editorProps}
            className="typeset typeset-notes h-[calc(100dvh-6rem)] text-lg leading-relaxed [&_.ProseMirror]:mx-auto [&_.ProseMirror]:min-h-[calc(100dvh-6.5rem)] [&_.ProseMirror]:max-w-3xl [&_.ProseMirror]:outline-none [&_.ProseMirror_p]:my-1"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
