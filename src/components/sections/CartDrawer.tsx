import { useEffect, useRef, useState } from "react";
import { Minus, Plus, ShoppingBag, Truck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pic } from "@/components/shop/ProductImage";
import { FREE_SHIPPING, money, useStore } from "@/lib/store";

/** Cesta lateral. Es global (se abre desde la barra de la web, la tienda o el chat). Cada cuenta ve solo la suya. */
export function CartDrawer() {
  const { cartOpen, setCartOpen, cart, products, setQty, total, count, checkout } = useStore();
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Escape cierra la cesta y, al abrirla, el foco va al botón de cerrar.
  useEffect(() => {
    if (!cartOpen) return;
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setCartOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cartOpen, setCartOpen]);

  const items = products.filter((p) => cart[p.id]);
  const pct = Math.min(100, (total / FREE_SHIPPING) * 100);

  const finish = async () => {
    setBusy(true);
    setError(null);
    const err = await checkout();
    setBusy(false);
    if (err) { setError(err); return; }
    setDone(true);
    timer.current = window.setTimeout(() => { setDone(false); setCartOpen(false); }, 2200);
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-[55] bg-background/70 backdrop-blur-sm transition-opacity duration-500 ${cartOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setCartOpen(false)}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Tu cesta"
        // Cerrada, queda fuera del orden de tabulación y de los lectores de pantalla.
        inert={!cartOpen}
        className={`fixed top-0 right-0 z-[60] flex h-full w-full max-w-md flex-col bg-card p-6 transition-transform duration-700 [transition-timing-function:cubic-bezier(0.2,0.75,0.25,1)] ${cartOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-3xl font-light">Tu cesta</h3>
          <button ref={closeBtn} onClick={() => setCartOpen(false)} aria-label="Cerrar"><X /></button>
        </div>

        {!done && count > 0 && (
          <div className="mt-5 rounded-2xl bg-muted p-4 text-sm">
            <p className="flex items-center gap-2"><Truck className="size-4 text-primary" />{pct >= 100 ? "¡Envío gratis desbloqueado!" : `Te faltan ${money(FREE_SHIPPING - total)} para el envío gratis`}</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-background"><div className="h-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${pct}%` }} /></div>
          </div>
        )}

        <div className="mt-5 flex-1 space-y-3 overflow-y-auto">
          {done && <div className="bubble py-16 text-center"><span className="beat inline-block text-5xl">💚</span><p className="mt-4 font-display text-2xl">¡Pedido recibido!</p><p className="text-sm text-muted-foreground">Demostración: no se cobró nada.</p></div>}
          {!done && items.length === 0 && <p className="py-16 text-center text-muted-foreground">Tu cesta está vacía. Añade algo para tu peludo.</p>}
          {!done && items.map((p) => (
            <div key={p.id} className="bubble flex items-center gap-3 rounded-2xl bg-muted p-3">
              <Pic p={p} className="size-16 shrink-0 rounded-xl" />
              <div className="flex-1"><p className="text-sm">{p.name}</p><p className="text-xs text-accent">{money(p.price * cart[p.id])}</p></div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="size-7 rounded-full" aria-label={`Quitar uno de ${p.name}`} onClick={() => setQty(p.id, cart[p.id] - 1)}><Minus /></Button>
                <span className="w-5 text-center text-sm">{cart[p.id]}</span>
                <Button size="icon" variant="ghost" className="size-7 rounded-full" aria-label={`Añadir uno de ${p.name}`} onClick={() => setQty(p.id, cart[p.id] + 1)}><Plus /></Button>
              </div>
            </div>
          ))}
        </div>

        {!done && count > 0 && (
          <div className="pt-4">
            <div className="mb-4 flex justify-between"><span>Total</span><span key={total} className="bubble font-display text-2xl text-primary">{money(total)}</span></div>
            {error && <p role="alert" className="mb-3 text-sm text-destructive">{error}</p>}
            <Button size="lg" className="w-full rounded-full" disabled={busy} onClick={() => void finish()}>
              <ShoppingBag /> {busy ? "Enviando…" : "Finalizar pedido"}
            </Button>
          </div>
        )}
      </aside>
    </>
  );
}
