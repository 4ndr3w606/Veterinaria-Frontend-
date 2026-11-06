import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountBar } from "@/components/sections/Auth";
import { Catalog, Pic } from "@/components/sections/Catalog";
import { Footer } from "@/components/layout/Footer";
import { PRODUCTS } from "@/lib/store";

const d = (i: number) => ({ "--i": i }) as React.CSSProperties;
const WORDS = ["Alimento", "Juguetes", "Descanso", "Paseo", "Higiene"];

export default function Shop() {
  const [idle, setIdle] = useState(true);
  const hero = PRODUCTS.find((p) => p.featured) ?? PRODUCTS[0];
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between bg-background/80 px-5 py-3 backdrop-blur-md">
        <Link to="/" className="group flex items-center gap-2 text-sm hover:text-primary">
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" /> Inicio
        </Link>
        <span className="hidden font-display text-xl text-primary italic sm:block">Lúmina</span>
        <AccountBar />
      </header>

      {/* La linterna sigue al cursor; sin cursor, se pasea sola */}
      <section
        className="hero relative overflow-hidden px-5 pt-16 pb-24"
        data-idle={idle}
        onMouseMove={(e) => {
          setIdle(false);
          const r = e.currentTarget.getBoundingClientRect();
          e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
          e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
        }}
        onMouseLeave={(e) => {
          setIdle(true);
          e.currentTarget.style.removeProperty("--mx");
          e.currentTarget.style.removeProperty("--my");
        }}
      >
        <div className="lantern" />
        <div className="halo" />
        <div className="relative mx-auto grid max-w-6xl items-end gap-12 lg:grid-cols-[1.25fr_1fr]">
          <div>
            <h1 className="leading-[0.9] font-light tracking-tight text-[clamp(3.5rem,10.5vw,9rem)]">
              <span className="enter block" style={d(0)}>Lo que</span>
              <em className="enter block text-primary" style={d(1)}>brilla</em>
              <span className="enter block" style={d(2)}>en casa.</span>
            </h1>
            <p className="enter mt-8 max-w-md text-lg leading-8" style={d(4)}>
              Alimento, juguetes y mimos elegidos por nuestros veterinarios. Mueve el cursor: hay huellas escondidas en la oscuridad.
            </p>
            <Button size="lg" className="enter mt-8 rounded-full" style={d(5)} onClick={() => document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" })}>
              Ver productos <ArrowDown />
            </Button>
          </div>
          <div className="enter arch overflow-hidden" style={d(3)}>
            <Pic p={hero} className="aspect-[4/5] w-full" />
          </div>
        </div>
      </section>

      {/* Cinta de categorías: un solo campo de color pleno */}
      <div className="marquee overflow-hidden bg-primary py-5 text-primary-foreground" aria-hidden>
        <div className="marquee-track font-display text-3xl italic">
          {[...WORDS, ...WORDS, ...WORDS, ...WORDS].map((w, i) => <span key={i} className="mx-8">{w} ✦</span>)}
        </div>
      </div>

      <Catalog />
      <Footer />
    </>
  );
}