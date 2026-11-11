import { useState } from "react";
import { Eye } from "lucide-react";
import { Tilt } from "@/components/animations/Tilt";
import { useInView } from "@/components/hooks/useInView";
import { glow, money, useStore } from "@/lib/store";
import { vars } from "@/lib/utils";
import type { Product } from "@/lib/types";
import { AddButton, HeartButton } from "./Buttons";
import { petLabel } from "./helpers";
import { Pic } from "./ProductImage";

type Props = { p: Product; index: number; onQuick: (p: Product) => void };

/**
 * Tarjeta de producto de la tienda: aparece al hacer scroll, se inclina en 3D, brilla al pasar el cursor,
 * reproduce su GIF (si tiene) y suelta un corazón / vuela al carrito al añadirla.
 */
export function ProductCard({ p, index, onQuick }: Props) {
  const { cart } = useStore();
  const [ref, seen] = useInView<HTMLElement>(0.12);
  const [hover, setHover] = useState(false);
  const inCart = cart[p.id] ?? 0;

  return (
    <article
      ref={ref}
      className={`shop-card group ${seen ? "is-in" : ""}`}
      // El retraso se repite cada 3 tarjetas para que, tras filtrar, no haya esperas largas.
      style={vars({ "--i": index % 3 })}
      onPointerEnter={(e) => { if (e.pointerType !== "touch") setHover(true); }}
      onPointerLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
    >
      <Tilt>
        <div className="shop-card-inner h-full overflow-hidden rounded-3xl bg-card ring-1 ring-border">
          <div className="glow-card shop-shine relative" onMouseMove={glow}>
            <button type="button" onClick={() => onQuick(p)} aria-label={`Ver detalles de ${p.name}`} className="block w-full cursor-zoom-in">
              <Pic p={p} play={hover} className="aspect-[4/5] w-full" />
            </button>

            {p.tag && <span className="shop-tag absolute top-3 left-3 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">{p.tag}</span>}
            <HeartButton id={p.id} className="absolute top-3 right-3 z-10" />
            {inCart > 0 && (
              <span key={inCart} className="shop-pop absolute bottom-3 left-3 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                En tu cesta ×{inCart}
              </span>
            )}
            <span className="shop-quick pointer-events-none absolute right-3 bottom-3 flex items-center gap-1 rounded-full bg-background/80 px-3 py-1 text-xs backdrop-blur-md" aria-hidden="true">
              <Eye className="size-3.5" /> Vista rápida
            </span>
          </div>

          <div className="p-5">
            <p className="text-xs text-muted-foreground">{p.cat} · {petLabel(p)}</p>
            <div className="mt-1 flex items-start justify-between gap-3">
              <h3 className="text-xl leading-tight">{p.name}</h3>
              <span className="font-display text-lg whitespace-nowrap text-accent">{money(p.price)}</span>
            </div>
            <AddButton p={p} className="mt-4 w-full" />
          </div>
        </div>
      </Tilt>
    </article>
  );
}
