import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowLeft, PawPrint, Sparkles, Stethoscope, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Counter } from "@/components/animations/Counter";
import { Reveal } from "@/components/animations/Reveal";
import { AccountBar } from "@/components/sections/Auth";
import { Catalog } from "@/components/sections/Catalog";
import { BackToTop } from "@/components/shop/BackToTop";
import { Pic } from "@/components/shop/ProductImage";
import { Footer } from "@/components/layout/Footer";
import { FREE_SHIPPING, money, useStore } from "@/lib/store";
import { vars } from "@/lib/utils";
// Animaciones EXCLUSIVAS de la tienda. Todo cuelga de la clase .shop (más abajo), así no afecta al resto de la web.
import "@/styles/shop.css";

const WORDS = ["Alimento", "Juguetes", "Descanso", "Paseo", "Higiene", "Salud"];

/** Huellas que suben flotando por el fondo del hero (posición, duración y retraso de cada una). */
const FLOATIES = [
  { x: "6%", t: 15, d: 0, r: 40, s: 22 }, { x: "17%", t: 19, d: 4, r: -30, s: 30 }, { x: "29%", t: 14, d: 8, r: 25, s: 18 },
  { x: "41%", t: 21, d: 2, r: -50, s: 26 }, { x: "55%", t: 16, d: 6, r: 35, s: 20 }, { x: "67%", t: 20, d: 10, r: -25, s: 32 },
  { x: "78%", t: 15, d: 3, r: 45, s: 22 }, { x: "90%", t: 18, d: 7, r: -40, s: 28 },
];

const PERKS = [
  { icon: Truck, title: "Envío gratis", text: `En pedidos desde ${money(FREE_SHIPPING)}.` },
  { icon: Stethoscope, title: "Elegidos por veterinarios", text: "Productos seleccionados por nuestro equipo." },
  { icon: Sparkles, title: "Para perros y gatos", text: "Filtra por mascota y encuentra lo ideal." },
];

export default function Shop() {
  const { products } = useStore();
  const [idle, setIdle] = useState(true);
  const [heroHover, setHeroHover] = useState(false);
  const hero = products.find((p) => p.featured) ?? products[0];
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="shop">
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
        <div className="shop-floaties" aria-hidden="true">
          {FLOATIES.map((f, i) => (
            <PawPrint key={i} className="shop-floaty" style={vars({ "--x": f.x, "--t": `${f.t}s`, "--d": `${f.d}s`, "--r": `${f.r}deg`, width: f.s, height: f.s })} />
          ))}
        </div>

        <div className="relative mx-auto grid max-w-6xl items-end gap-12 lg:grid-cols-[1.25fr_1fr]">
          <div>
            <h1 className="leading-[0.9] font-light tracking-tight text-[clamp(3.5rem,10.5vw,9rem)]">
              <span className="enter block" style={vars({ "--i": 0 })}>Lo que</span>
              <em className="shop-glint enter block text-primary" style={vars({ "--i": 1 })}>brilla</em>
              <span className="enter block" style={vars({ "--i": 2 })}>en casa.</span>
            </h1>
            <p className="enter mt-8 max-w-md text-lg leading-8" style={vars({ "--i": 4 })}>
              Alimento, juguetes y mimos elegidos por nuestros veterinarios. Mueve el cursor: hay huellas escondidas en la oscuridad.
            </p>
            <div className="enter mt-8 flex flex-wrap items-center gap-6" style={vars({ "--i": 5 })}>
              <Button size="lg" className="rounded-full" onClick={() => document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" })}>
                Ver productos <ArrowDown className="shop-bounce" />
              </Button>
              {products.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-display text-4xl text-primary"><Counter to={products.length} /></span> productos para perros y gatos
                </p>
              )}
            </div>
          </div>

          {hero && (
            <div className="enter relative" style={vars({ "--i": 3 })}>
              <span className="shop-aura" aria-hidden="true" />
              <div
                className="shop-float arch shop-shine relative overflow-hidden"
                onPointerEnter={(e) => { if (e.pointerType !== "touch") setHeroHover(true); }}
                onPointerLeave={() => setHeroHover(false)}
              >
                <Pic p={hero} play={heroHover} className="aspect-[4/5] w-full" />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Cinta de categorías: un solo campo de color pleno */}
      <div className="marquee overflow-hidden bg-primary py-5 text-primary-foreground" aria-hidden>
        <div className="marquee-track font-display text-3xl italic">
          {[...WORDS, ...WORDS, ...WORDS, ...WORDS].map((w, i) => <span key={i} className="mx-8">{w} ✦</span>)}
        </div>
      </div>

      <section className="mx-auto grid max-w-6xl gap-4 px-5 pt-16 sm:grid-cols-3">
        {PERKS.map(({ icon: Icon, title, text }, i) => (
          <Reveal key={title} delay={i * 120}>
            <div className="shop-perk flex h-full items-start gap-4 rounded-3xl bg-card p-5 ring-1 ring-border">
              <span className="shop-perk-icon flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"><Icon className="size-5" /></span>
              <div>
                <p className="font-display text-xl">{title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </section>

      <Catalog />
      <Footer />
      <BackToTop />
    </div>
  );
}
