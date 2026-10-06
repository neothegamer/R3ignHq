"use client";

import type { ReactNode } from "react";
import OnlinePresenceProvider from "@/components/OnlinePresenceProvider";
import R3ignDialogProvider from "@/components/R3ignDialog";
import R3ignBotProvider from "@/components/R3ignBot";

/** Client-side app providers (presence, themed dialogs, etc.) */
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <OnlinePresenceProvider>
      <R3ignBotProvider>
        <R3ignDialogProvider>{children}</R3ignDialogProvider>
      </R3ignBotProvider>
    </OnlinePresenceProvider>
  );
}
