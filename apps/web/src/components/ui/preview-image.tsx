import { useEffect, useState, type ComponentProps } from "react";

const HEIC_FILENAME = /\.hei[cf]$/i;

type PreviewImageProps = ComponentProps<"img"> & { src?: string; filename: string };

// Only Safari decodes HEIC natively, so other browsers convert it on the first load error.
export function PreviewImage({ src, filename, onError, ...props }: PreviewImageProps) {
  const [convertedSrc, setConvertedSrc] = useState<string>();

  useEffect(
    () => () => {
      if (convertedSrc) URL.revokeObjectURL(convertedSrc);
    },
    [convertedSrc],
  );

  return (
    <img
      {...props}
      src={convertedSrc ?? src}
      onError={async (event) => {
        if (convertedSrc || !src || !HEIC_FILENAME.test(filename)) return onError?.(event);
        try {
          const [{ heicTo }, blob] = await Promise.all([
            import("heic-to"),
            fetch(src).then((response) => response.blob()),
          ]);
          const jpeg = await heicTo({ blob, type: "image/jpeg", quality: 0.8 });
          setConvertedSrc(URL.createObjectURL(jpeg));
        } catch {
          onError?.(event);
        }
      }}
    />
  );
}
