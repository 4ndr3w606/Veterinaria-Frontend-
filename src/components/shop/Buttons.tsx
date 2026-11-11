import { useEffect, useRef, useState } from "react";
import { Check, Heart, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { vars } from "@/lib/utils";
import type { Product } from "@/lib/types";
import { flyToCart } from "./flyToCart";

/** "Añadir": suma al carrito, lanza la miniatura hacia el icono del carrito y muestra "Añadido" un momento. */
export function AddButton({ p, size, className = "" }: { p: Product; size?: "lg"; className?: string }) {
  const { add } = useStore();
  const [ok, setOk] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <Button
      size={size}
      className={`rounded-full ${className}`}
      onClick={(e) => {
        add(p.id);
        flyToCart(e.currentTarget, p);
        setOk(true);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setOk(false), 1200);
      }}
    >
      {ok ? <><Check className="shop-pop" /> Añadido</> : <><Plus /> Añadir</>}
    </Button>
  );
}

/** Corazón de favoritos (por cuenta). Al marcarlo "late" y suelta chispas. */
export function HeartButton({ id, className = "" }: { id: number; className?: string }) {
  const { wishes, toggleWish } = useStore();
  const liked = wishes.includes(id);
  const [burst, setBurst] = useState(0);

  return (
    <button
      type="button"
      aria-pressed={liked}
      aria-label={liked ? "Quitar de favoritos" : "Añadir a favoritos"}
      onClick={() => { if (!liked) setBurst((b) => b + 1); toggleWish(id); }}
      className={`relative flex size-10 items-center justify-center rounded-full bg-background/70 backdrop-blur-md transition-transform hover:scale-110 active:scale-95 ${liked ? "text-accent" : "text-foreground"} ${className}`}
    >
      <Heart key={liked ? "on" : "off"} className={`size-5 ${liked ? "shop-beat fill-current" : ""}`} />
      {liked && burst > 0 && (
        <span key={burst} className="shop-burst pointer-events-none absolute inset-0" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5].map((i) => <i key={i} style={vars({ "--a": `${i * 60}deg` })} />)}
        </span>
      )}
    </button>
  );
}
