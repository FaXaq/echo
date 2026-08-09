import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

interface PageMetaOverride {
  title?: string;
  breadcrumb?: string;
}

interface PageMetaContextValue {
  overrides: Record<string, PageMetaOverride>;
  setOverride: (pathname: string, override: PageMetaOverride | null) => void;
}

const noopContextValue: PageMetaContextValue = {
  overrides: {},
  setOverride: () => {},
};

// Falls back to a no-op outside PageMetaProvider (e.g. component tests
// rendered in isolation) rather than requiring every consumer to be wrapped.
const PageMetaContext = createContext<PageMetaContextValue>(noopContextValue);

export function PageMetaProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<Record<string, PageMetaOverride>>({});

  const setOverride = useCallback((pathname: string, override: PageMetaOverride | null) => {
    setOverrides((prev) => {
      if (!override) {
        if (!(pathname in prev)) return prev;
        const next = { ...prev };
        delete next[pathname];
        return next;
      }
      return { ...prev, [pathname]: override };
    });
  }, []);

  return (
    <PageMetaContext.Provider value={{ overrides, setOverride }}>
      {children}
    </PageMetaContext.Provider>
  );
}

function usePageMetaContext() {
  return useContext(PageMetaContext);
}

export function usePageMetaOverride(pathname: string): PageMetaOverride | undefined {
  return usePageMetaContext().overrides[pathname];
}

export function usePageMetaOverrides(): Record<string, PageMetaOverride> {
  return usePageMetaContext().overrides;
}

/**
 * Lets a route override its title/breadcrumb once data only known client-side
 * (e.g. fetched via a suspense query rather than a route loader) resolves.
 */
export function useSyncPageMeta(pathname: string, title?: string, breadcrumb?: string) {
  const { setOverride } = usePageMetaContext();

  useEffect(() => {
    if (!title && !breadcrumb) return;
    setOverride(pathname, { title, breadcrumb });
    return () => setOverride(pathname, null);
  }, [pathname, title, breadcrumb, setOverride]);
}
