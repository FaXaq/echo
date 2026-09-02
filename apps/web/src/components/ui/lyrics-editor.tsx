import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import { useLingui } from "@lingui/react/macro";

// tiptap-markdown ships no TypeScript types at all.
declare module "@tiptap/core" {
  interface Storage {
    markdown: { getMarkdown: () => string };
  }
}

export interface LyricsEditorProps {
  markdown: string;
  onChange: (markdown: string) => void;
}

export function LyricsEditor({ markdown, onChange }: LyricsEditorProps) {
  const { t } = useLingui();
  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown,
      Placeholder.configure({ placeholder: t`Write the lyrics…` }),
    ],
    content: markdown,
    onUpdate: ({ editor }) => onChange(editor.storage.markdown.getMarkdown()),
  });

  if (!editor) return null;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] font-semibold">{t`Lyrics`}</span>
      <EditorContent
        editor={editor}
        className="min-h-64 rounded-lg border px-4 py-3 text-sm leading-relaxed [&_.ProseMirror]:min-h-56 [&_.ProseMirror]:outline-none [&_.ProseMirror_p]:my-1"
      />
    </div>
  );
}
