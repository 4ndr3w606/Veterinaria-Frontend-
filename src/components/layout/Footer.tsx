import { ArrowUpRight, Clock3, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { Logo } from "@/components/layout/Logo";
import { go } from "@/lib/utils";

export function Footer() {
  return (
    <footer className="mx-auto max-w-6xl px-5 pb-32">
      <Separator />
      <div className="grid gap-8 py-12 md:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            Medicina veterinaria con propósito. Su mundo también es el nuestro.
          </p>
        </div>

        <div className="space-y-3 text-sm text-muted-foreground">
          <p className="font-bold text-foreground">Encuéntranos</p>
          <p className="flex gap-2">
            <MapPin className="size-4 text-primary" /> Tu ciudad, Colombia
          </p>
          <p className="flex gap-2">
            <Clock3 className="size-4 text-primary" /> Lunes a sábado · Horario por confirmar
          </p>
        </div>

        <div>
          <Button variant="outline" className="rounded-full" onClick={() => go("inicio")}>
            Volver al inicio <ArrowUpRight />
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        © {new Date().getFullYear()} Lúmina Animal Care. Hecho con ciencia, cuidado y corazón.
      </p>
    </footer>
  );
}