import type { ReactNode } from "react";
import { LogOut, ShoppingCart, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

type AccountBarProps = {
  children?: ReactNode;
  showGreeting?: boolean;
};

/** Una instancia en la cabecera de cada ruta; comparte cuenta, contador y destino del carrito. */
export function AccountBar({ children, showGreeting = false }: AccountBarProps) {
  const { user, logout, authOpen, cartOpen, setAuthOpen, setCartOpen, count } = useStore();
  const firstName = user?.name.trim().split(/\s+/)[0];
  const accountLabel = user ? "Cerrar sesión de " + user.name : "Entrar";
  const cartLabel = "Carrito, " + count + (count === 1 ? " producto" : " productos");

  return (
    <div
      role="group"
      aria-label="Cuenta y carrito"
      className="flex shrink-0 items-center gap-1 rounded-full border bg-background/70 p-1.5 backdrop-blur-xl"
    >
      {children}
      {showGreeting && user && (
        <span className="hidden max-w-36 truncate px-2 text-sm sm:block" title={user.name}>
          Hola, <span className="font-display italic text-primary">{firstName}</span>
        </span>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-11 rounded-full"
        title={accountLabel}
        aria-label={accountLabel}
        aria-haspopup={user ? undefined : "dialog"}
        aria-expanded={user ? undefined : authOpen}
        onClick={() => (user ? logout() : setAuthOpen(true))}
      >
        {user ? <LogOut className="size-5" aria-hidden="true" /> : <UserRound className="size-5" aria-hidden="true" />}
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="relative size-11 rounded-full"
        title="Abrir carrito"
        aria-label={cartLabel}
        aria-haspopup="dialog"
        aria-expanded={cartOpen}
        data-cart-target
        onClick={() => setCartOpen(true)}
      >
        <ShoppingCart className="size-5" aria-hidden="true" />
        {count > 0 && (
          <span
            key={count}
            aria-hidden="true"
            className="bubble absolute -top-1 -right-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-accent-foreground"
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </Button>
    </div>
  );
}
