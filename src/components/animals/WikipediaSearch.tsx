import { useEffect, useState } from "react";
import { ArrowUpRight, BookOpen, RefreshCw, Search } from "lucide-react";
import { searchWikipedia, type WikiSearchResult } from "@/lib/wikipedia";
import { AnimalDetail } from "@/components/animals/AnimalDetail";

export function WikipediaSearch({ query, retry }: { query: string; retry: () => void }) {
  const [response, setResponse] = useState<{ results?: WikiSearchResult[]; error?: string }>({});
  const [selection, setSelection] = useState<{ animal: WikiSearchResult; animate: boolean }>();
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    searchWikipedia(query, "page", controller.signal).then(
      (results) => { if (!controller.signal.aborted) setResponse({ results }); },
      (error: unknown) => { if (!controller.signal.aborted) setResponse({ error: error instanceof Error ? error.message : "No pudimos buscar en Wikipedia." }); },
    );
    return () => controller.abort();
  }, [query]);

  if (response.error) return <div id="animal-results" className="animal-library__error" role="alert">
    <h3>No pudimos completar la búsqueda</h3><p>{response.error}</p>
    <button type="button" className="animal-library__read" onClick={retry}><RefreshCw size={18} aria-hidden="true" /> Reintentar búsqueda</button>
  </div>;
  if (!response.results) return <div id="animal-results" className="animal-library__empty" role="status" aria-live="polite">
    <Search size={32} aria-hidden="true" /><p>Buscando animales para «{query}»…</p>
  </div>;
  if (!response.results.length) return <div id="animal-results" className="animal-library__empty" role="status">
    <h3>No encontramos animales para «{query}»</h3><p>Prueba un nombre científico u otro nombre habitual. Algunos artículos pueden no aparecer si su clasificación está incompleta.</p>
  </div>;

  return <>
    <p id="animal-count" className="animal-library__catalog-note" role="status">{response.results.length} {response.results.length === 1 ? "resultado" : "resultados"} de animales para «{query}» · Filtrados entre las primeras 20 coincidencias.</p>
    <p className="animal-library__catalog-note">Explora especies, razas y grupos de animales. Se omiten los artículos cuya clasificación no se puede confirmar.</p>
    <div id="animal-results" className="animal-library__explorer">
      <nav className="animal-library__list" aria-label="Resultados de Wikipedia">
        {response.results.map((animal) => <button key={animal.title} type="button" aria-pressed={selection?.animal.title === animal.title} aria-controls="animal-detail"
          onClick={(event) => setSelection({ animal, animate: event.detail > 0 })}>
          <BookOpen size={22} aria-hidden="true" />
          <span><span className="animal-library__list-name">{animal.name}</span><span className="animal-library__list-kind">{animal.description}</span></span>
          <ArrowUpRight size={17} aria-hidden="true" />
        </button>)}
      </nav>
      <div id="animal-detail" className="animal-library__detail" role="region" aria-label={selection ? `Ficha de ${selection.animal.name}` : "Detalle del resultado"}>
        {selection ? <AnimalDetail key={`${selection.animal.title}:${attempt}`} animal={selection.animal} animate={selection.animate} retry={() => setAttempt((value) => value + 1)} /> :
          <div className="animal-library__empty"><BookOpen size={32} aria-hidden="true" /><h3>Elige un resultado</h3><p>Abre el artículo del animal para consultar su descripción y fotografía.</p></div>}
      </div>
    </div>
  </>;
}
