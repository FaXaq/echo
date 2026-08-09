import { useEffect } from "react";
import { useMatches } from "@tanstack/react-router";
import { useLingui } from "@lingui/react/macro";
import { translateDynamic } from "@/lib/dynamic-messages";
import { usePageMetaOverrides } from "@/contexts/page-meta";

const PRODUCT_NAME = "Echo";

function resolveTitle(
  matches: ReturnType<typeof useMatches>,
  overrides: ReturnType<typeof usePageMetaOverrides>,
) {
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i];
    const title =
      overrides[match.pathname]?.title ??
      (match.loaderData as { title?: string } | undefined)?.title ??
      match.staticData.title;
    if (title) return title;
  }
  return undefined;
}

export function DynamicTitle() {
  const { t } = useLingui();
  const matches = useMatches();
  const overrides = usePageMetaOverrides();

  const rawTitle = resolveTitle(matches, overrides);
  const title = rawTitle ? translateDynamic(t, rawTitle) : undefined;

  useEffect(() => {
    document.title = title ? `${title} · ${PRODUCT_NAME}` : PRODUCT_NAME;
  }, [title]);

  return null;
}
