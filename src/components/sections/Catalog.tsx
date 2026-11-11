import { useMemo, useState } from "react";
import { Heart, SearchX, TriangleAlert } from "lucide-react";
import { Reveal } from "@/components/animations/Reveal";
import { AddButton, HeartButton } from "@/components/shop/Buttons";
import { FilterBar, type SortKey } from "@/components/shop/FilterBar";
import { matchesPet, petLabel, type PetFilter } from "@/components/shop/helpers";
import { ProductCard } from "@/components/shop/ProductCard";
import { Pic } from "@/components/shop/ProductImage";
import { QuickView } from "@/components/shop/QuickView";
import { glow, money, useStore } from "@/lib/store";
import type { Product } from "@/lib/types";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const ORDER: Record<SortKey, (a: Product, b: Product) => number> = {
  rec: () => 0,
  asc: (a, b) => a.price - b.price,
  desc: (a, b) => b.price - a.price,
  az: (a, b) => a.name.localeCompare(b.name, "es"),
};

/** Tarjetas "fantasma" mientras llega el catálogo desde la API. */
function SkeletonGrid() {
  return (
    <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Cargando productos">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-3xl bg-card ring-1 ring-border">
          <div className="shop-skeleton aspect-[4/5] w-full" />
          <div className="space-y-3 p-5">
            <div className="shop-skeleton h-3 w-1/3 rounded-full" />
            <div className="shop-skeleton h-5 w-3/4 rounded-full" />
            <div className="shop-skeleton h-10 w-full rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Catalog() {
  const { products, loading, apiError, wishes } = useStore();
  const [pet, setPet] = useState<PetFilter>("Todos");
  const [cat, setCat] = useState("Todo");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("rec");
  const [onlyWish, setOnlyWish] = useState(false);
  const [quick, setQuick] = useState<Product | null>(null);
  const [spot, setSpot] = useState(false);

  // Las categorías cuentan solo los productos de la mascota elegida.
  const cats = useMemo(() => {
    const forPet = products.filter((p) => matchesPet(p, pet));
    const names = Array.from(new Set(products.map((p) => p.cat)));
    return [{ name: "Todo", count: forPet.length }, ...names.map((name) => ({ name, count: forPet.filter((p) => p.cat === name).length }))];
  }, [products, pet]);

  const feat = products.find((p) => p.featured);
  const showFeat = !!feat && cat === "Todo" && !q && pet === "Todos" && !onlyWish;

  const list = useMemo(
    () =>
      products
        .filter((p) => matchesPet(p, pet) && (cat === "Todo" || p.cat === cat) && (!onlyWish || wishes.includes(p.id)) && norm(`${p.name} ${p.desc} ${p.cat}`).includes(norm(q)) && !(showFeat && p === feat))
        .sort(ORDER[sort]),
    [products, pet, cat, q, sort, onlyWish, wishes, showFeat, feat],
  );
  // El destacado se muestra arriba (fuera de la cuadrícula), pero cuenta como producto.
  const shown = list.length + (showFeat ? 1 : 0);

  return (
    <section id="catalogo" className="mx-auto max-w-6xl px-5 py-24">
      <Reveal><h2 className="text-5xl font-light tracking-tight md:text-7xl">Todo para <em className="text-primary">ellos.</em></h2></Reveal>

      <FilterBar
        pet={pet} setPet={setPet} cats={cats} cat={cat} setCat={setCat} q={q} setQ={setQ}
        sort={sort} setSort={setSort} onlyWish={onlyWish} setOnlyWish={setOnlyWish} wishCount={wishes.length}
      />

      {apiError && (
        <p role="status" className="shop-pop mt-6 flex items-center gap-2 rounded-2xl bg-muted px-4 py-3 text-sm">
          <TriangleAlert className="size-4 shrink-0 text-accent" /> {apiError}
        </p>
      )}

      {loading ? <SkeletonGrid /> : (
        <>
          {showFeat && feat && (
            <Reveal className="mt-8">
              <div className="shop-spot grid items-center gap-8 rounded-[2rem] bg-secondary p-5 md:grid-cols-2 md:p-8">
                <div className="relative mx-auto w-full max-w-sm">
                  <span className="shop-aura" aria-hidden="true" />
                  <div
                    className="glow-card shop-shine relative overflow-hidden rounded-3xl"
                    onMouseMove={glow}
                    onPointerEnter={(e) => { if (e.pointerType !== "touch") setSpot(true); }}
                    onPointerLeave={() => setSpot(false)}
                  >
                    <button type="button" onClick={() => setQuick(feat)} aria-label={`Ver detalles de ${feat.name}`} className="block w-full cursor-zoom-in">
                      <Pic p={feat} play={spot} className="aspect-[4/5] w-full" />
                    </button>
                  </div>
                  <span className="shop-sticker absolute -top-3 -right-3 flex size-20 items-center justify-center rounded-full bg-accent p-2 text-center text-xs leading-tight font-bold text-accent-foreground">
                    Favorito de la casa
                  </span>
                </div>
                <div className="md:pr-6">
                  <p className="text-sm text-accent">{feat.cat} · {petLabel(feat)}</p>
                  <h3 className="mt-3 text-5xl leading-none font-light md:text-6xl">{feat.name}</h3>
                  <p className="mt-4 max-w-sm leading-8 text-secondary-foreground">{feat.desc}</p>
                  <p className="mt-6 font-display text-3xl text-primary">{money(feat.price)}</p>
                  <div className="mt-6 flex items-center gap-3">
                    <AddButton p={feat} size="lg" />
                    <HeartButton id={feat.id} className="size-12 border" />
                  </div>
                </div>
              </div>
            </Reveal>
          )}

          <p key={`${shown}-${cat}-${pet}-${q}`} className="shop-pop mt-8 text-sm text-muted-foreground" aria-live="polite">
            {shown} {shown === 1 ? "producto" : "productos"}
          </p>

          <div key={`${cat}|${pet}|${q}|${sort}|${onlyWish}`} className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p, i) => <ProductCard key={p.id} p={p} index={i} onQuick={setQuick} />)}
          </div>

          {shown === 0 && (
            <div className="shop-pop py-20 text-center text-muted-foreground">
              {onlyWish && wishes.length === 0 ? (
                <>
                  <Heart className="shop-wobble mx-auto size-12 text-accent" />
                  <p className="mt-4">Aún no tienes favoritos. Toca el corazón de un producto para guardarlo aquí.</p>
                </>
              ) : (
                <>
                  <SearchX className="shop-wobble mx-auto size-12 text-primary" />
                  <p className="mt-4">{q ? `Nada coincide con «${q}». Prueba con otra palabra.` : "No hay productos con esos filtros."}</p>
                </>
              )}
            </div>
          )}
        </>
      )}

      <QuickView p={quick} onClose={() => setQuick(null)} />
    </section>
  );
}
