"use client"

import { createContext, useContext } from "react";
import type { authClient } from "@/lib/auth";

type Session = typeof authClient.$Infer.Session;

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children, session }: { children: React.ReactNode, session: Session }) {
  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const session = useContext(SessionContext);
  return { session: session! };
}
