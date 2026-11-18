import { PawPrint } from "lucide-react";

export function Logo({ compactOnMobile = false }: { compactOnMobile?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <PawPrint className="size-5" />
      </span>
      <span className={compactOnMobile ? "hidden whitespace-nowrap font-display text-xl font-semibold tracking-tight sm:inline" : "font-display text-xl font-semibold tracking-tight"}>
        Lúmina Animal Care
      </span>
    </span>
  );
}