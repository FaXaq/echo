import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import { Check } from "lucide-react";
import { useLingui } from "@lingui/react/macro";
import { Spinner } from "@/components/ui/spinner";

// tiptap-markdown ships no TypeScript types at all.
declare module "@tiptap/core" {
  interface Storage {
    markdown: { getMarkdown: () => string };
  }
}

export type MarkdownSaveStatus = "idle" | "saving" | "saved";

export interface MarkdownEditorProps {
  id?: string;
  markdown: string;
  onChange?: (markdown: string) => void;
  placeholder?: string;
  editable?: boolean;
  saveStatus?: MarkdownSaveStatus;
  className?: string;
}

export function MarkdownEditor({
  id,
  markdown,
  onChange,
  placeholder,
  editable = true,
  saveStatus = "idle",
  className,
}: MarkdownEditorProps) {
  const { t } = useLingui();
  const editor = useEditor({
    extensions: [StarterKit, Markdown, Placeholder.configure({ placeholder })],
    content: markdown,
    editable,
    onUpdate: ({ editor }) => onChange?.(editor.storage.markdown.getMarkdown()),
  });

  if (!editor) return null;

  return (
    <div className="relative">
      <EditorContent id={id} editor={editor} className={className} />
      {saveStatus !== "idle" && (
        <span
          role="status"
          aria-label={saveStatus === "saving" ? t`Saving…` : t`Saved`}
          className="pointer-events-none absolute right-3 bottom-2 text-muted-foreground"
        >
          {saveStatus === "saving" ? (
            <Spinner className="size-3.5" />
          ) : (
            <Check className="size-3.5" />
          )}
        </span>
      )}
    </div>
  );
}
