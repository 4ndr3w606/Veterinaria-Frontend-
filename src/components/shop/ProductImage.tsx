import { useState } from "react";
import { CAT_EMOJI } from "@/lib/constants";
import type { Product } from "@/lib/types";
import { reducedMotion } from "./helpers";

type PicProps = {
  p: Product;
  className?: string;
  /** Cuando es true y el producto tiene `gif`, se reproduce encima de la foto. */
  play?: boolean;
};

/**
 * Imagen de producto.
 * - Muestra un "skeleton" brillante mientras carga.
 * - Si el producto tiene `gif` y `play` es true, lo reproduce (el GIF solo se descarga cuando se necesita
 *   y vuelve a empezar cada vez).
 * - Si la foto no existe, muestra un panel con el emoji de la categoría (nunca una imagen rota).
 */
export function Pic({ p, className = "", play = false }: PicProps) {
  const [loaded, setLoaded] = useState(false);
  const [bad, setBad] = useState(false);
  const [gifReady, setGifReady] = useState(false);
  const [gifBad, setGifBad] = useState(false);

  if (bad || !p.image) {
    return (
      <div role="img" aria-label={p.name} className={`relative flex items-center justify-center overflow-hidden bg-muted ${className}`}>
        <span className="shop-bob text-7xl" aria-hidden="true">{CAT_EMOJI[p.cat] ?? "🐾"}</span>
      </div>
    );
  }

  const showGif = play && !!p.gif && !gifBad && !reducedMotion();

  return (
    <div className={`relative overflow-hidden bg-muted ${className}`}>
      {!loaded && <span className="shop-skeleton absolute inset-0" aria-hidden="true" />}
      <img
        // Si la imagen ya estaba en caché, el evento load puede haber pasado antes de montar.
        ref={(el) => { if (el?.complete && el.naturalWidth > 0) setLoaded(true); }}
        src={p.image}
        alt={p.name}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setBad(true)}
        className={`size-full object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
      {showGif && (
        <img
          src={p.gif}
          alt=""
          aria-hidden="true"
          onLoad={() => setGifReady(true)}
          onError={() => setGifBad(true)}
          className={`absolute inset-0 size-full object-cover transition-opacity duration-300 ${gifReady ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </div>
  );
}
