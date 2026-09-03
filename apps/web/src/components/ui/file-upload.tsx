import * as React from "react";
import { FileUp, Loader, UploadCloud } from "lucide-react";
import { useLingui } from "@lingui/react/macro";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  onFilesSelected: (files: File[]) => void;
  variant: "box" | "icon";
  loading?: boolean;
}

export function FileUpload({
  accept,
  multiple = true,
  disabled = false,
  onFilesSelected,
  variant,
  loading,
}: FileUploadProps) {
  const { t } = useLingui();
  const [isDragging, setIsDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList | null) => {
    if (disabled || !fileList || fileList.length === 0) return;
    onFilesSelected(Array.from(fileList));
  };

  if (variant === "icon") {
    return (
      <>
        <input
          ref={inputRef}
          type="file"
          aria-label={t`Add files`}
          className="sr-only"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <Button
          variant="secondary"
          size="icon-xs"
          aria-label="Submit"
          className="rounded-full"
          onClick={() => inputRef.current?.click()}
        >
          {loading ? <Loader /> : <FileUp />}
        </Button>
      </>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-disabled={disabled}
      data-dragging={isDragging}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center gap-2 rounded-md border border-dashed border-border p-6 text-center transition-colors",
        isDragging && "border-primary bg-muted",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <UploadCloud className="size-6 text-muted-foreground" />
      <p className="text-xs text-muted-foreground">
        {t`Drag and drop files here, or click to select`}
      </p>
      <input
        ref={inputRef}
        type="file"
        aria-label={t`Add files`}
        className="sr-only"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
