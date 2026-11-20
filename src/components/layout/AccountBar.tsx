import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, UserRound } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useStore } from "@/lib/store";

type AccountBarProps = {
  children?: ReactNode;
  showGreeting?: boolean;
};

/** Una instancia en la cabecera de cada ruta; comparte cuenta, contador y destino del carrito. */
export function AccountBar({ children, showGreeting = false }: AccountBarProps) {
  const { user, authOpen, cartOpen, setAuthOpen, setCartOpen, count } = useStore();
  const { pathname } = useLocation();
  const firstName = user?.name.trim().split(/\s+/)[0];
  const initials = user?.name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]?.toUpperCase()).join("");
  const accountLabel = user ? "Mi cuenta de " + user.name : "Entrar";
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
      {user ? (
        // Con sesión, el botón lleva a «Mi cuenta»; cerrar sesión se hace desde esa página.
        <Link
          to="/mi-cuenta"
          title={accountLabel}
          aria-label={accountLabel}
          aria-current={pathname === "/mi-cuenta" ? "page" : undefined}
          className={buttonVariants({ variant: "ghost", size: "icon", className: "size-11 rounded-full aria-[current=page]:bg-muted" })}
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground" aria-hidden="true">{initials}</span>
        </Link>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 rounded-full"
          title={accountLabel}
          aria-label={accountLabel}
          aria-haspopup="dialog"
          aria-expanded={authOpen}
          onClick={() => setAuthOpen(true)}
        >
          <UserRound className="size-5" aria-hidden="true" />
        </Button>
      )}
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
