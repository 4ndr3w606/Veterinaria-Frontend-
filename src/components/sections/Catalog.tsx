import { useState } from "react";
import { Check, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/animations/Reveal";
import {  PRODUCTS, glow, money, useStore } from "@/lib/store.tsx";

const CATS = ["Todo", ...Array.from(new Set(PRODUCTS.map((p) => p.cat)))];

export function Catalog() {
  const { add } = useStore();
  const [cat, setCat] = useState("Todo");
  const [just, setJust] = useState<number | null>(null);
  const list = PRODUCTS.filter((p) => cat === "Todo" || p.cat === cat);

  return (
    <section id="tienda" className="mx-auto max-w-6xl px-5 py-28">
      <Reveal>
        <h2 className="text-5xl font-light tracking-tight md:text-7xl">Lo que brilla <em className="text-primary">en casa.</em></h2>
        <div className="mt-8 flex flex-wrap gap-2">
          {CATS.map((c) => (
            <button key={c} onClick={() => setCat(c)}
              className={`rounded-full border px-5 py-2 text-sm transition-all duration-300 ${cat === c ? "scale-105 bg-primary text-primary-foreground" : "hover:border-primary hover:text-primary"}`}>{c}</button>
          ))}
        </div>
      </Reveal>
      <div key={cat} className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {list.map((p, i) => (
          <article key={p.id} onMouseMove={glow} className="glow-card enter rounded-3xl border bg-card p-5" style={{ "--i": i } as React.CSSProperties}>
            <div className="arch flex h-40 items-center justify-center bg-secondary">
              <span className="float text-6xl" style={{ animationDelay: `${i * 300}ms` }}>{p.emoji}</span>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">{p.cat}</p>
            <h3 className="text-xl">{p.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="font-display text-lg text-accent">{money(p.price)}</span>
              <Button size="sm" className="rounded-full" onClick={() => { add(p.id); setJust(p.id); setTimeout(() => setJust(null), 1100); }}>
                {just === p.id ? <><Check className="bubble" /> Listo</> : <><Plus /> Añadir</>}
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function CartDrawer() {
  const { cartOpen, setCartOpen, cart, setQty, total, count, checkout } = useStore();
  const [done, setDone] = useState(false);
  const items = PRODUCTS.filter((p) => cart[p.id]);
  return (
    <>
      <div className={`fixed inset-0 z-40 bg-background/70 backdrop-blur-sm transition-opacity duration-500 ${cartOpen ? "opacity-100" : "pointer-events-none opacity-0"}`} onClick={() => setCartOpen(false)} />
      <aside className={`fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col border-l bg-card p-6 transition-transform duration-700 [transition-timing-function:cubic-bezier(0.2,0.75,0.25,1)] ${cartOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between"><h3 className="text-3xl font-light">Tu cesta</h3><button onClick={() => setCartOpen(false)} aria-label="Cerrar"><X /></button></div>
        <div className="mt-6 flex-1 space-y-3 overflow-y-auto">
          {done && <div className="bubble py-16 text-center"><span className="beat inline-block text-5xl">💚</span><p className="mt-4 font-display text-2xl">¡Pedido recibido!</p><p className="text-sm text-muted-foreground">Demostración: no se cobró nada.</p></div>}
          {!done && items.length === 0 && <p className="py-16 text-center text-muted-foreground">Tu cesta está vacía. Añade algo para tu peludo.</p>}
          {!done && items.map((p) => (
            <div key={p.id} className="bubble flex items-center gap-3 rounded-2xl bg-muted p-3">
              <span className="text-3xl">{p.emoji}</span>
              <div className="flex-1"><p className="text-sm">{p.name}</p><p className="text-xs text-accent">{money(p.price * cart[p.id])}</p></div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="size-7 rounded-full" onClick={() => setQty(p.id, cart[p.id] - 1)}><Minus /></Button>
                <span className="w-5 text-center text-sm">{cart[p.id]}</span>
                <Button size="icon" variant="ghost" className="size-7 rounded-full" onClick={() => setQty(p.id, cart[p.id] + 1)}><Plus /></Button>
              </div>
            </div>
          ))}
        </div>
        {!done && count > 0 && (
          <div className="border-t pt-4">
            <div className="mb-4 flex justify-between"><span>Total</span><span key={total} className="bubble font-display text-2xl text-primary">{money(total)}</span></div>
            <Button size="lg" className="w-full rounded-full" onClick={() => { checkout(); setDone(true); setTimeout(() => { setDone(false); setCartOpen(false); }, 2200); }}><ShoppingBag /> Finalizar pedido</Button>
          </div>
        )}
      </aside>
    </>
  );
}