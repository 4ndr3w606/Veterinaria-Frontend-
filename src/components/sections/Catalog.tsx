import { useMemo, useState } from "react";
import { Check, Minus, Plus, Search, ShoppingBag, Truck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Reveal } from "@/components/animations/Reveal";
import { FREE_SHIPPING, PRODUCTS, glow, money, useStore, type Product } from "@/lib/store";

const d = (i: number) => ({ "--i": i }) as React.CSSProperties;
const CATS = ["Todo", ...Array.from(new Set(PRODUCTS.map((p) => p.cat)))];
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const SORTS = { rec: "Destacados", asc: "Precio: menor a mayor", desc: "Precio: mayor a menor", az: "Nombre A–Z" } as const;
const ORDER: Record<keyof typeof SORTS, (a: Product, b: Product) => number> = {
  rec: () => 0, asc: (a, b) => a.price - b.price, desc: (a, b) => b.price - a.price, az: (a, b) => a.name.localeCompare(b.name),
};

/** Imagen del producto. Si falta el archivo, muestra un panel tonal con la inicial (nunca una imagen rota). */
export function Pic({ p, className = "" }: { p: Product; className?: string }) {
  const [bad, setBad] = useState(false);
  if (bad || !p.image)
    return <div className={`flex items-center justify-center bg-muted ${className}`}><span className="font-display text-7xl text-primary/60 italic">{p.name[0]}</span></div>;
  return <img src={p.image} alt={p.name} loading="lazy" decoding="async" onError={() => setBad(true)} className={`object-cover ${className}`} />;
}

function AddBtn({ p, className = "", size }: { p: Product; className?: string; size?: "lg" }) {
  const { add } = useStore();
  const [ok, setOk] = useState(false);
  return (
    <Button size={size} className={`rounded-full ${className}`} onClick={() => { add(p.id); setOk(true); setTimeout(() => setOk(false), 1100); }}>
      {ok ? <><Check className="bubble" /> Añadido</> : <><Plus /> Añadir</>}
    </Button>
  );
}

export function Catalog() {
  const [cat, setCat] = useState("Todo");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<keyof typeof SORTS>("rec");
  const feat = PRODUCTS.find((p) => p.featured);
  const showFeat = !!feat && cat === "Todo" && !q;
  const list = useMemo(
    () => PRODUCTS.filter((p) => (cat === "Todo" || p.cat === cat) && norm(`${p.name} ${p.desc}`).includes(norm(q)) && !(showFeat && p === feat)).sort(ORDER[sort]),
    [cat, q, sort, showFeat, feat],
  );

  return (
    <section id="catalogo" className="mx-auto max-w-6xl px-5 py-24">
      <Reveal><h2 className="text-5xl font-light tracking-tight md:text-7xl">Todo para <em className="text-primary">ellos.</em></h2></Reveal>

      <div className="mt-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {CATS.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`rounded-full px-5 py-2 text-sm transition-all duration-300 ${cat === c ? "scale-105 bg-primary text-primary-foreground" : "bg-card hover:text-primary"}`}>
              {c} <span className="opacity-60">{c === "Todo" ? PRODUCTS.length : PRODUCTS.filter((p) => p.cat === c).length}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 lg:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar producto" aria-label="Buscar producto" className="h-12 rounded-full bg-card pl-11" />
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value as keyof typeof SORTS)} aria-label="Ordenar" className="h-12 rounded-full border bg-card px-4 text-sm">
            {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      {showFeat && feat && (
        <Reveal className="mt-8">
          <div className="grid items-center gap-8 rounded-[2rem] bg-secondary p-5 md:grid-cols-2 md:p-8">
            <div className="glow-card overflow-hidden rounded-3xl" onMouseMove={glow}>
              <Pic p={feat} className="aspect-[5/4] w-full transition-transform duration-700 hover:scale-105" />
            </div>
            <div className="md:pr-6">
              <p className="text-sm text-accent">Favorito de la casa</p>
              <h3 className="mt-3 text-5xl leading-none font-light md:text-6xl">{feat.name}</h3>
              <p className="mt-4 max-w-sm leading-8 text-secondary-foreground">{feat.desc}</p>
              <p className="mt-6 font-display text-3xl text-primary">{money(feat.price)}</p>
              <AddBtn p={feat} size="lg" className="mt-6" />
            </div>
          </div>
        </Reveal>
      )}

      <p key={list.length + cat + q} className="bubble mt-8 text-sm text-muted-foreground">{list.length} {list.length === 1 ? "producto" : "productos"}</p>
      <div key={cat + q + sort} className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p, i) => (
          <article key={p.id} className="group enter overflow-hidden rounded-3xl bg-card" style={d(i)}>
            <div className="glow-card relative" onMouseMove={glow}>
              <Pic p={p} className="aspect-[4/5] w-full transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-x-3 bottom-3 transition-all duration-300 md:translate-y-4 md:opacity-0 md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100 md:group-hover:translate-y-0 md:group-hover:opacity-100">
                <AddBtn p={p} className="w-full" />
              </div>
            </div>
            <div className="flex items-start justify-between gap-3 p-5">
              <div><p className="text-xs text-muted-foreground">{p.cat}</p><h3 className="text-xl leading-tight">{p.name}</h3></div>
              <span className="font-display text-lg whitespace-nowrap text-accent">{money(p.price)}</span>
            </div>
          </article>
        ))}
      </div>
      {list.length === 0 && !showFeat && <p className="bubble py-20 text-center text-muted-foreground">Nada coincide con «{q}». Prueba con otra palabra.</p>}
    </section>
  );
}

export function CartDrawer() {
  const { cartOpen, setCartOpen, cart, setQty, total, count, checkout } = useStore();
  const [done, setDone] = useState(false);
  const items = PRODUCTS.filter((p) => cart[p.id]);
  const pct = Math.min(100, (total / FREE_SHIPPING) * 100);
  return (
    <>
      <div className={`fixed inset-0 z-[55] bg-background/70 backdrop-blur-sm transition-opacity duration-500 ${cartOpen ? "opacity-100" : "pointer-events-none opacity-0"}`} onClick={() => setCartOpen(false)} />
      <aside className={`fixed top-0 right-0 z-[60] flex h-full w-full max-w-md flex-col bg-card p-6 transition-transform duration-700 [transition-timing-function:cubic-bezier(0.2,0.75,0.25,1)] ${cartOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between"><h3 className="text-3xl font-light">Tu cesta</h3><button onClick={() => setCartOpen(false)} aria-label="Cerrar"><X /></button></div>
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
              <Pic p={p} className="size-16 rounded-xl" />
              <div className="flex-1"><p className="text-sm">{p.name}</p><p className="text-xs text-accent">{money(p.price * cart[p.id])}</p></div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="size-7 rounded-full" aria-label="Quitar uno" onClick={() => setQty(p.id, cart[p.id] - 1)}><Minus /></Button>
                <span className="w-5 text-center text-sm">{cart[p.id]}</span>
                <Button size="icon" variant="ghost" className="size-7 rounded-full" aria-label="Añadir uno" onClick={() => setQty(p.id, cart[p.id] + 1)}><Plus /></Button>
              </div>
            </div>
          ))}
        </div>
        {!done && count > 0 && (
          <div className="pt-4">
            <div className="mb-4 flex justify-between"><span>Total</span><span key={total} className="bubble font-display text-2xl text-primary">{money(total)}</span></div>
            <Button size="lg" className="w-full rounded-full" onClick={() => { checkout(); setDone(true); setTimeout(() => { setDone(false); setCartOpen(false); }, 2200); }}><ShoppingBag /> Finalizar pedido</Button>
          </div>
        )}
      </aside>
    </>
  );
}