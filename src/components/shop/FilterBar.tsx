import { Heart, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PET_FILTERS, type PetFilter } from "./helpers";

export const SORTS = { rec: "Destacados", asc: "Precio: menor a mayor", desc: "Precio: mayor a menor", az: "Nombre A–Z" } as const;
export type SortKey = keyof typeof SORTS;

type Props = {
  pet: PetFilter; setPet: (v: PetFilter) => void;
  cats: { name: string; count: number }[]; cat: string; setCat: (v: string) => void;
  q: string; setQ: (v: string) => void;
  sort: SortKey; setSort: (v: SortKey) => void;
  onlyWish: boolean; setOnlyWish: (v: boolean) => void; wishCount: number;
};

/** Filtros de la tienda: mascota (con indicador deslizante), categorías, búsqueda, orden y favoritos. */
export function FilterBar({ pet, setPet, cats, cat, setCat, q, setQ, sort, setSort, onlyWish, setOnlyWish, wishCount }: Props) {
  const idx = Math.max(0, PET_FILTERS.findIndex((f) => f.value === pet));

  return (
    <div className="mt-10 space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Selector de mascota: la píldora se desliza hasta la opción elegida */}
        <div role="group" aria-label="Filtrar por mascota" className="relative grid w-full max-w-sm grid-cols-3 rounded-full bg-card p-1 ring-1 ring-border">
          <span
            aria-hidden="true"
            className="absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-full bg-primary transition-transform duration-500 [transition-timing-function:cubic-bezier(0.3,1.4,0.4,1)]"
            style={{ transform: `translateX(${idx * 100}%)` }}
          />
          {PET_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={pet === f.value}
              onClick={() => setPet(f.value)}
              className={`relative z-10 rounded-full py-2 text-sm transition-colors duration-300 ${pet === f.value ? "font-bold text-primary-foreground" : "hover:text-primary"}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 lg:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar producto" aria-label="Buscar producto" className="h-12 rounded-full bg-card pl-11" />
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Ordenar" className="h-12 rounded-full border bg-card px-4 text-sm">
            {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button
            type="button"
            aria-pressed={onlyWish}
            onClick={() => setOnlyWish(!onlyWish)}
            className={`flex h-12 items-center gap-2 rounded-full border px-4 text-sm transition-all duration-300 ${onlyWish ? "border-accent bg-accent text-accent-foreground" : "bg-card hover:text-accent"}`}
          >
            <Heart className={`size-4 ${onlyWish ? "fill-current" : ""}`} /> Favoritos <span className="opacity-70">{wishCount}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {cats.map((c) => (
          <button
            key={c.name}
            type="button"
            aria-pressed={cat === c.name}
            onClick={() => setCat(c.name)}
            className={`rounded-full px-5 py-2 text-sm transition-all duration-300 ${cat === c.name ? "scale-105 bg-primary text-primary-foreground" : "bg-card hover:-translate-y-0.5 hover:text-primary"}`}
          >
            {c.name} <span className="opacity-60">{c.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
