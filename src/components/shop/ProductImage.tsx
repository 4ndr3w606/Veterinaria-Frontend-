import { useState } from "react";
import { CAT_EMOJI } from "@/lib/constants";
import type { Product } from "@/lib/types";

type PicProps = {
  p: Product;
  className?: string;
};

/** Foto de producto con skeleton de carga y alternativa si la imagen no existe. */
export function Pic({ p, className = "" }: PicProps) {
  const [loaded, setLoaded] = useState(false);
  const [bad, setBad] = useState(false);

  if (bad || !p.image) {
    return (
      <div role="img" aria-label={p.name} className={`relative flex items-center justify-center overflow-hidden bg-muted ${className}`}>
        <span className="shop-bob text-7xl" aria-hidden="true">{CAT_EMOJI[p.cat] ?? "🐾"}</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-muted ${className}`}>
      {!loaded && <span className="shop-skeleton absolute inset-0" aria-hidden="true" />}
      <img
        // Una imagen en caché puede haber terminado de cargar antes de montar el elemento.
        ref={(el) => { if (el?.complete && el.naturalWidth > 0) setLoaded(true); }}
        src={p.image}
        alt={p.name}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setBad(true)}
        className={`size-full object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}