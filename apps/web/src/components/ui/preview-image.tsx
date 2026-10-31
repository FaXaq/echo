import { useEffect, useState, type ComponentProps } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const HEIC_FILENAME = /\.hei[cf]$/i;

type PreviewImageProps = ComponentProps<"img"> & { src?: string; filename: string };

// Only Safari decodes HEIC natively, so other browsers convert it on the first load error.
export function PreviewImage({ src, filename, onError, ...props }: PreviewImageProps) {
  const [convertedSrc, setConvertedSrc] = useState<string>();
  const [converting, setConverting] = useState(false);

  useEffect(
    () => () => {
      if (convertedSrc) URL.revokeObjectURL(convertedSrc);
    },
    [convertedSrc],
  );

  if (converting) return <Skeleton className={cn("size-full rounded-none", props.className)} />;

  return (
    <img
      {...props}
      src={convertedSrc ?? src}
      onError={async (event) => {
        if (convertedSrc || !src || !HEIC_FILENAME.test(filename)) return onError?.(event);
        setConverting(true);
        try {
          const [{ heicTo }, blob] = await Promise.all([
            import("heic-to"),
            fetch(src).then((response) => response.blob()),
          ]);
          const jpeg = await heicTo({ blob, type: "image/jpeg", quality: 0.8 });
          setConvertedSrc(URL.createObjectURL(jpeg));
        } catch {
          onError?.(event);
        } finally {
          setConverting(false);
        }
      }}
    />
  );
}
