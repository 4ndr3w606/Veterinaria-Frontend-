import { useRef, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Bird, BookOpen, Cat, Dog, Fish, PawPrint, Rabbit, Search, Turtle, X } from "lucide-react";
import { ANIMALS, ANIMAL_GROUPS, filterAnimals, type AnimalGroup, type AnimalKind } from "@/data/animals";
import { useInView } from "@/components/hooks/useInView";
import { AnimalDetail, AnimalSkeleton } from "@/components/animals/AnimalDetail";
import { WikipediaSearch } from "@/components/animals/WikipediaSearch";
import "@/styles/animal-library.css";

const ICONS = { Todos: PawPrint, Perros: Dog, Gatos: Cat, "Pequeños mamíferos": Rabbit, Aves: Bird, Reptiles: Turtle, Peces: Fish };

export function AnimalLibrary() {
  const [ref, seen] = useInView<HTMLElement>(0.05);
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState<{ query: string; version: number } | null>(null);
  const [group, setGroup] = useState<AnimalGroup>("Todos");
  const [kind, setKind] = useState<"Todos" | AnimalKind>("Todos");
  const [selection, setSelection] = useState({ title: ANIMALS[0].title, animate: true });
  const [attempt, setAttempt] = useState(0);
  const filtered = filterAnimals("", group, kind);
  const selected = filtered.find((animal) => animal.title === selection.title) ?? filtered[0];
  const reset = () => { setQuery(""); setSearch(null); setGroup("Todos"); setKind("Todos"); input.current?.setCustomValidity(""); };

  return <section ref={ref} id="especies" className="animal-library" aria-labelledby="animal-library-title">
    <div className="animal-library__wrap">
      <div className="animal-library__heading">
        <div>
          <p className="animal-library__eyebrow"><BookOpen size={17} aria-hidden="true" /> Biblioteca animal</p>
          <h2 id="animal-library-title">Explora la<br /><em>biblioteca.</em></h2>
        </div>
        <div className="animal-library__intro">
          <p>Conoce especies y razas, desde los compañeros de siempre hasta los que despiertan tu curiosidad.</p>
          <p className="animal-library__catalog-note">Busca en Wikipedia en español o explora nuestras sugerencias.</p>
          <ArrowDownRight size={32} strokeWidth={1.25} aria-hidden="true" />
        </div>
      </div>

      <form className="animal-library__filters" role="search" aria-label="Buscar en Wikipedia" onSubmit={(event) => {
        event.preventDefault();
        if (query.trim().length < 2) return;
        setSearch((current) => ({ query: query.trim(), version: (current?.version ?? 0) + 1 }));
      }}>
        <div className="animal-library__search-field">
          <label htmlFor="animal-search">Buscar especie o raza</label>
          <div className="animal-library__input-wrap">
            <Search size={20} aria-hidden="true" />
            <input ref={input} id="animal-search" type="search" value={query} autoComplete="off" minLength={2} maxLength={100} required
              placeholder="Prueba con ajolote, caballo o tucán…" aria-controls="animal-results" aria-describedby="animal-search-help"
              onChange={(event) => {
                const value = event.target.value;
                event.target.setCustomValidity(value.length > 0 && value.trim().length < 2 ? "Escribe al menos dos caracteres, sin contar espacios." : "");
                setQuery(value);
              }} />
            {query && <button type="button" aria-label="Limpiar búsqueda" onClick={() => { reset(); document.getElementById("animal-search")?.focus(); }}><X size={18} aria-hidden="true" /></button>}
          </div>
        </div>
        <button type="submit" className="animal-library__read justify-self-start"><Search size={18} aria-hidden="true" /> Buscar en Wikipedia</button>
      </form>
      <p id="animal-search-help" className="animal-library__catalog-note">Escribe al menos dos caracteres y pulsa Buscar o Enter. La consulta no está limitada a las sugerencias.</p>

      {search ? <>
        <button type="button" className="animal-library__text-button" onClick={reset}>Volver a las sugerencias <X size={15} aria-hidden="true" /></button>
        <WikipediaSearch key={`${search.query}:${search.version}`} query={search.query}
          retry={() => setSearch((current) => current && ({ ...current, version: current.version + 1 }))} />
      </> : <>
      <p className="animal-library__catalog-note">{ANIMALS.length} sugerencias para empezar. Estos filtros se aplican solo a las sugerencias.</p>
      <label htmlFor="animal-kind">Filtrar sugerencias por tipo</label>
      <select id="animal-kind" value={kind} aria-controls="animal-results" onChange={(event) => setKind(event.target.value as "Todos" | AnimalKind)}>
        <option value="Todos">Especies y razas</option><option value="Especie">Solo especies</option><option value="Raza">Solo razas</option>
      </select>

      <div className="animal-library__groups" role="group" aria-label="Filtrar por grupo de animales">
        {ANIMAL_GROUPS.map((item) => {
          const Icon = ICONS[item];
          return <button key={item} type="button" aria-pressed={group === item} aria-controls="animal-results"
            onClick={(event) => { setGroup(item); setSelection((current) => ({ ...current, animate: event.detail > 0 })); }}>
            <Icon size={17} aria-hidden="true" />{item}
          </button>;
        })}
      </div>

      <div className="animal-library__result-heading">
        <p id="animal-count" role="status" aria-atomic="true">{filtered.length} {filtered.length === 1 ? "ficha disponible" : "fichas disponibles"}</p>
        {(query || group !== "Todos" || kind !== "Todos") && <button type="button" className="animal-library__text-button" onClick={reset}>Restablecer filtros <X size={15} aria-hidden="true" /></button>}
      </div>

      {selected ? <div id="animal-results" className="animal-library__explorer">
        <nav aria-label="Fichas de animales" className="animal-library__list">
          {filtered.map((animal) => {
            const Icon = ICONS[animal.group];
            return <button key={animal.title} type="button" aria-pressed={selected.title === animal.title} aria-controls="animal-detail"
              onClick={(event) => setSelection({ title: animal.title, animate: event.detail > 0 })}>
              <Icon size={22} strokeWidth={1.5} aria-hidden="true" />
              <span><span className="animal-library__list-name">{animal.name}</span><span className="animal-library__list-kind">{animal.kind} · {animal.group}</span></span>
              <ArrowUpRight size={17} aria-hidden="true" />
            </button>;
          })}
        </nav>
        <div id="animal-detail" className="animal-library__detail" role="region" aria-label={`Ficha de ${selected.name}`}>
          <p className="sr-only" role="status">Ficha seleccionada: {selected.name}</p>
          {seen ? <AnimalDetail key={`${selected.title}:${attempt}`} animal={selected} animate={selection.animate}
            retry={() => setAttempt((value) => value + 1)} /> : <AnimalSkeleton />}
        </div>
      </div> : <div id="animal-results" className="animal-library__empty">
        <Search size={32} strokeWidth={1.25} aria-hidden="true" />
        <h3>No encontramos esa combinación</h3>
        <p>Amplía los filtros de las sugerencias o usa el buscador para consultar otros animales en Wikipedia.</p>
        <button type="button" className="animal-library__read" onClick={reset}>Ver todas las fichas <ArrowUpRight size={18} aria-hidden="true" /></button>
      </div>}
      </>}
      <p className="animal-library__footnote">Una biblioteca para conocerlos mejor. La información es general y no sustituye una consulta veterinaria.</p>
    </div>
  </section>;
}
