import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { AccountBar } from "@/components/sections/Auth";
import { Catalog } from "@/components/sections/Catalog";
import { Footer } from "@/components/layout/Footer";

export default function Shop() {
  const [idle, setIdle] = useState(true);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/80 px-5 py-3 backdrop-blur-md">
        <Link to="/" className="group flex items-center gap-2 text-sm hover:text-primary">
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" /> Volver al inicio
        </Link>
        <span className="hidden font-display text-xl italic text-primary sm:block">Lúmina · Tienda</span>
        <AccountBar />
      </header>

      {/* La linterna sigue al cursor; sin cursor, se pasea sola */}
      <section
        className="hero relative overflow-hidden px-5 pt-24 pb-6 text-center"
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
        <h1 className="enter relative text-6xl font-light tracking-tight md:text-8xl">
          Tienda <em className="text-primary">Lúmina</em>
        </h1>
        <p className="enter relative mx-auto mt-5 max-w-md leading-8 text-muted-foreground" style={{ "--i": 2 } as React.CSSProperties}>
          Alimento, juguetes y mimos para tus peludos. Mueve el cursor y descubre las huellas escondidas.
        </p>
      </section>

      <Catalog />
      <Footer />
    </>
  );
}
