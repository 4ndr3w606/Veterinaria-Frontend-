import { ArrowUpRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { Magnetic } from "@/components/animations/Magnetic";
import { Logo } from "@/components/layout/Logo";
import { links } from "@/data/siteData";
import { go } from "@/lib/utils";

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-4 z-50 px-4">
      <nav className="mx-auto flex max-w-5xl items-center justify-between rounded-full border bg-background/70 py-3 pr-3 pl-5 backdrop-blur-xl justify-start text-lg">
        <button onClick={() => go("inicio")} aria-label="Volver al inicio">
          <Logo />
        </button>

        {/* Enlaces de escritorio */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map(([label, id]) => (
            <Button
              key={id}
              variant="ghost"
       className="rounded-full px-4 text-base text-muted-foreground hover:text-primary md:text-lg"
              onClick={() => go(id)}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Botón de acción y menú móvil */}
        <div className="flex items-center gap-2">
          <span className="hidden sm:block">
            <Magnetic>
              <Button className="rounded-full" onClick={() => go("cita")}>
                Reserva una visita <ArrowUpRight />
              </Button>
            </Magnetic>
          </span>

          {/* Menú colapsable para móviles */}
          <Sheet>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full md:hidden"
                  aria-label="Abrir menú"
                >
                  <Menu />
                </Button>
              }
            />
            <SheetContent side="right" className="w-72 gap-2 p-6">
              <SheetTitle className="mb-4">Menú</SheetTitle>
              {[...links, ["Reservar cita", "cita"] as const].map(([label, id]) => (
                <SheetClose
                  key={id}
                  render={
                    <Button
                      variant="ghost"
                      className="justify-start text-base md:text-lg"
                      onClick={() => go(id)}
                    >
                      {label}
                    </Button>
                  }
                />
              ))}
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}