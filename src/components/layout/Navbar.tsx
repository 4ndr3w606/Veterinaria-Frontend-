import { Link } from "react-router-dom";
import { ArrowUpRight, LogOut, Menu, ShoppingCart, Store, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import { useStore } from "@/lib/store";

export function Navbar() {
  const navigate = useNavigate();
  const toShop = () => navigate("/tienda");
  const { user, logout, setAuthOpen, setCartOpen, count } = useStore();

  return (
    <header className="fixed inset-x-0 top-4 z-50 px-4">
      {/* Fila: [barra de navegación] [iconos de acciones] */}
      <div className="mx-auto flex max-w-6xl items-center gap-3">
        <nav className="flex flex-1 items-center justify-between rounded-full border bg-background/70 py-3 pr-3 pl-5 text-lg backdrop-blur-xl">
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
                  <Button variant="outline" size="icon" className="rounded-full md:hidden" aria-label="Abrir menú">
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

        {/* NUEVO: iconos fuera de la barra */}
     <div className="flex items-center gap-2 rounded-full border bg-background/70 p-2 backdrop-blur-xl">
<Link
  to="/tienda"
  title="Tienda"
  aria-label="Tienda"
  className="inline-flex size-12 items-center justify-center rounded-full text-primary hover:bg-muted sm:size-12"
>
  <Store className="size-6" />
</Link>
  <Button
    variant="ghost"
    size="icon"
    title={user ? `Salir (${user.name.split(" ")[0]})` : "Entrar"}
    aria-label={user ? "Cerrar sesión" : "Entrar"}
    className="size-12 rounded-full"
    onClick={() => (user ? logout() : setAuthOpen(true))}
  >
    {user ? <LogOut className="size-6" /> : <UserRound className="size-6" />}
  </Button>

  <Button
    variant="secondary"
    size="icon"
    title="Carrito"
    aria-label="Carrito"
    className="relative size-12 rounded-full"
    onClick={() => setCartOpen(true)}
  >
    <ShoppingCart className="size-6" />
    {count > 0 && (
      <span
        key={count}
        className="bubble absolute -top-1 -right-1 flex size-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground"
      >
        {count}
      </span>
    )}
  </Button>
</div>
      </div>
    </header>
  );
}
