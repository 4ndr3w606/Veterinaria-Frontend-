import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight, Menu, Store } from "lucide-react";
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
import { AccountBar } from "@/components/layout/AccountBar";

export function Navbar() {
  const navigate = useNavigate();
  const toShop = () => navigate("/tienda");

  return (
    <header className="fixed inset-x-0 top-4 z-50 px-3 sm:px-4">
      {/* Fila: [barra de navegación] [iconos de acciones] */}
      <div className="mx-auto flex max-w-6xl items-center gap-2 sm:gap-3">
        <nav aria-label="Navegación principal" className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-full border bg-background/70 py-3 pr-2 pl-3 text-lg backdrop-blur-xl sm:pr-3 sm:pl-5">
          <button type="button" className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50" onClick={() => go("inicio")} aria-label="Volver al inicio">
            <Logo compactOnMobile />
          </button>

          {/* Enlaces de escritorio */}
          <div className="hidden items-center gap-1 xl:flex">
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

          <div className="flex items-center gap-2">
            <span className="hidden lg:block">
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
                  <Button variant="outline" size="icon" className="size-11 rounded-full xl:hidden" aria-label="Abrir menú">
                    <Menu />
                  </Button>
                }
              />
              <SheetContent side="right" className="w-72 gap-2 p-6">
                <SheetTitle className="mb-4">Menú</SheetTitle>
                {links.map(([label, id]) => (
                  <SheetClose
                    key={id}
                    render={
                      <Button variant="ghost" className="justify-start text-base md:text-lg" onClick={() => go(id)}>
                        {label}
                      </Button>
                    }
                  />
                ))}
                <SheetClose
                  render={
                    <Button variant="ghost" className="justify-start text-base text-primary md:text-lg" onClick={toShop}>
                      <Store className="size-4" /> Tienda
                    </Button>
                  }
                />
                <SheetClose
                  render={
                    <Button variant="ghost" className="justify-start text-base md:text-lg" onClick={() => go("cita")}>
                      Reservar cita
                    </Button>
                  }
                />
              </SheetContent>
            </Sheet>
          </div>
        </nav>

        <AccountBar>
          <Link
            to="/tienda"
            title="Tienda"
            aria-label="Tienda"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Store className="size-5" aria-hidden="true" />
          </Link>
        </AccountBar>
      </div>
    </header>
  );
}
