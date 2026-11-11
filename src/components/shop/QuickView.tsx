import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { money, useStore } from "@/lib/store";
import type { Product } from "@/lib/types";
import { AddButton, HeartButton } from "./Buttons";
import { petLabel } from "./helpers";
import { Pic } from "./ProductImage";

/**
 * Vista rápida de un producto con el <dialog> nativo del navegador: ya trae el cierre con Escape, el foco
 * atrapado y el fondo oscuro, así que no hace falta nada más para que sea accesible.
 * Aquí el GIF se reproduce solo.
 */
export function QuickView({ p, onClose }: { p: Product | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const { cart } = useStore();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (p && !d.open) d.showModal();
    if (!p && d.open) d.close();
  }, [p]);

  const inCart = p ? (cart[p.id] ?? 0) : 0;

  return (
    <dialog
      ref={ref}
      aria-labelledby="quick-title"
      onClose={onClose}
      // Un clic en el fondo (el propio <dialog>, no su contenido) cierra la ventana.
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="shop-dialog m-auto max-h-[calc(100svh-2rem)] w-[min(54rem,calc(100vw-2rem))] overflow-auto rounded-[2rem] border-0 bg-card p-0 text-foreground backdrop:bg-background/75 backdrop:backdrop-blur-sm"
    >
      {p && (
        <div className="grid gap-6 p-5 md:grid-cols-2 md:gap-8 md:p-8">
          <div className="shop-shine glow-card relative overflow-hidden rounded-3xl">
            <Pic p={p} play className="aspect-[4/5] w-full" />
            {p.tag && <span className="shop-tag absolute top-3 left-3 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">{p.tag}</span>}
          </div>

          <div className="flex flex-col">
            <button type="button" onClick={onClose} aria-label="Cerrar" className="self-end rounded-full p-1 text-muted-foreground transition-transform hover:rotate-90 hover:text-primary">
              <X />
            </button>
            <p className="text-sm text-accent">{p.cat} · {petLabel(p)}</p>
            <h3 id="quick-title" className="mt-2 text-4xl leading-none font-light md:text-5xl">{p.name}</h3>
            <p className="mt-4 leading-8 text-secondary-foreground">{p.desc}</p>
            <p key={p.id} className="shop-pop mt-6 font-display text-4xl text-primary">{money(p.price)}</p>
            {inCart > 0 && <p key={inCart} className="shop-pop mt-2 text-sm text-muted-foreground">Ya tienes {inCart} en tu cesta.</p>}
            <div className="mt-auto flex items-center gap-3 pt-8">
              <AddButton p={p} size="lg" className="flex-1" />
              <HeartButton id={p.id} className="size-12 border" />
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
