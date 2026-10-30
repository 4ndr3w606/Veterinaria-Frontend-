import { PawPrint } from "lucide-react";

export function Logo() {
  return (
    <span className="flex items-center gap-3">
      <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <PawPrint className="size-5" />
      </span>
      <span className="font-display text-xl font-semibold tracking-tight">
        Lúmina Animal Care
      </span>
    </span>
  );
}