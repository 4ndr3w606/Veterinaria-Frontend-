import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ImageOff, RefreshCw, WifiOff } from "lucide-react";
import type { Animal } from "@/data/animals";
import { fetchWikipediaArticle, type WikiArticle } from "@/lib/wikipedia";

type AnimalReference = Pick<Animal, "name" | "title"> & Partial<Pick<Animal, "group" | "kind">>;

export function AnimalSkeleton() {
  return <div className="animal-library__skeleton" role="status">
    <div className="animal-library__skeleton-photo" aria-hidden="true" />
    <div><span>Cargando ficha de Wikipedia…</span><div className="animal-library__skeleton-line" aria-hidden="true" /><div className="animal-library__skeleton-line" aria-hidden="true" /></div>
  </div>;
}

function ArticleContent({ animal, article, animate, retry }: {
  animal: AnimalReference; article: WikiArticle; animate: boolean; retry: () => void;
}) {
  const photo = useRef<HTMLImageElement>(null);
  const [imageState, setImageState] = useState<"loading" | "ready" | "error">("loading");
  const [imageAttempt, setImageAttempt] = useState(0);

  useEffect(() => {
    if (!animate || imageState !== "ready") return;
    let disposed = false;
    let cleanup: (() => void) | undefined;
    // GSAP se descarga solo al mostrar una fotografía; no añade trabajo al inicio de la página.
    void import("gsap").then(({ gsap }) => {
      if (disposed || !photo.current) return;
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(photo.current, { scale: 1.035 }, { scale: 1, duration: 0.6, ease: "power3.out", clearProps: "transform" });
      });
      cleanup = () => media.revert();
    }).catch(() => { /* La fotografía sigue visible si no se descarga la animación. */ });
    return () => { disposed = true; cleanup?.(); };
  }, [animate, imageState]);

  const image = article.image;
  const showImage = image && imageState !== "error";
  return <>
    <p className="sr-only" role="status">Ficha de {animal.name} cargada.</p>
    <article className="animal-library__article" aria-labelledby="animal-name">
      <div className="animal-library__photo">
        {showImage ? <>
          {imageState === "loading" && <span className="animal-library__photo-loading" role="status">Cargando imagen…</span>}
          <img key={imageAttempt} ref={photo} src={image.source} alt={animal.name} decoding="async"
            onLoad={() => setImageState("ready")} onError={() => setImageState("error")} />
        </> : <div className="animal-library__image-fallback" role="status">
          <ImageOff size={32} strokeWidth={1.25} aria-hidden="true" />
          <p>{article.imageStatus === "missing" ? "Esta ficha no incluye una fotografía disponible." : "No pudimos cargar la imagen."}</p>
          {(article.imageStatus === "error" || imageState === "error") && <button type="button" className="animal-library__text-button"
            onClick={() => {
              if (image) { setImageState("loading"); setImageAttempt((value) => value + 1); }
              else retry();
            }}><RefreshCw size={16} aria-hidden="true" /> Reintentar imagen</button>}
        </div>}
      </div>
      <div className="animal-library__article-copy">
        <p className="animal-library__eyebrow">{animal.group ?? "Wikipedia en español"}{animal.kind && <> <span aria-hidden="true">/</span> {animal.kind}</>}</p>
        <h3 id="animal-name">{animal.name}</h3>
        <p className="animal-library__wiki-label">{animal.kind === "Especie" ? <em>{article.title}</em> : "Wikipedia en español"}</p>
        <p className="animal-library__extract">{article.extract}</p>
        <a className="animal-library__read" href={article.page} target="_blank" rel="noopener noreferrer">
          Leer en Wikipedia <ArrowUpRight size={18} aria-hidden="true" /><span className="sr-only"> (abre otra pestaña)</span>
        </a>
      </div>
    </article>
    <details className="animal-library__credits">
      <summary>Fuentes y créditos de esta ficha</summary>
      <p>Texto: colaboradores de <a href={article.page} target="_blank" rel="noopener noreferrer">Wikipedia, «{article.title}»</a>. <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.es" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>. Extracto de la introducción.</p>
      {image && <p>Fotografía: {image.author}. {image.licenseUrl ? <a href={image.licenseUrl} target="_blank" rel="noopener noreferrer">{image.license}</a> : image.license}. <a href={image.page} target="_blank" rel="noopener noreferrer">Archivo y condiciones en Wikimedia Commons</a>. Imagen ajustada al encuadre.</p>}
    </details>
  </>;
}

export function AnimalDetail({ animal, animate, retry }: { animal: AnimalReference; animate: boolean; retry: () => void }) {
  const [result, setResult] = useState<{ article?: WikiArticle; error?: string }>({});
  useEffect(() => {
    const controller = new AbortController();
    fetchWikipediaArticle(animal.title, controller.signal).then(
      (article) => { if (!controller.signal.aborted) setResult({ article }); },
      (error: unknown) => {
        if (!controller.signal.aborted) setResult({ error: error instanceof Error ? error.message : "No pudimos cargar esta ficha." });
      },
    );
    return () => controller.abort();
  }, [animal.title]);

  if (result.error) return <div className="animal-library__error" role="alert">
    <WifiOff size={32} strokeWidth={1.25} aria-hidden="true" />
    <h3>No pudimos cargar {animal.name}</h3>
    <p>{result.error}</p>
    <button type="button" className="animal-library__read" onClick={retry}><RefreshCw size={18} aria-hidden="true" /> Reintentar consulta</button>
  </div>;
  if (!result.article) return <AnimalSkeleton />;
  return <ArticleContent animal={animal} article={result.article} animate={animate} retry={retry} />;
}
