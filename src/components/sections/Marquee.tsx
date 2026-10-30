import { PawPrint } from "lucide-react";

export function Marquee() {
  const words = ["Cuidar es amar", "Su bienestar, nuestra misión", "Pequeñas patas, grandes historias"];
  return (
    <div className="marquee overflow-hidden border-y bg-primary py-4 text-primary-foreground" aria-hidden="true">
      <div className="marquee-track">
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0 items-center gap-8 pr-8 font-display text-2xl italic">
            {[...words, ...words].map((w, i) => (<span key={i} className="flex items-center gap-8">{w}<PawPrint className="size-5" /></span>))}
          </div>
        ))}
      </div>
    </div>
  );
}