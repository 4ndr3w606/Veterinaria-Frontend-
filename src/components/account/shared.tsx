import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatusPill({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "done" | "muted" | "danger" }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
      tone === "done" && "bg-primary/15 text-primary",
      tone === "default" && "bg-accent/15 text-accent",
      tone === "muted" && "bg-muted text-muted-foreground",
      tone === "danger" && "bg-destructive/15 text-destructive",
    )}>
      {children}
    </span>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed p-10 text-center">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-muted text-primary">{icon}</span>
      <p className="mt-4 font-display text-xl">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{text}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

const DATE = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", year: "numeric" });
const LONG = new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

/** Fecha corta desde un ISO con hora, o desde YYYY-MM-DD interpretado en hora local. */
export const shortDate = (value: string) => DATE.format(value.length === 10 ? new Date(value + "T00:00:00") : new Date(value));
export const longDate = (value: string) => LONG.format(new Date(value + "T00:00:00"));
