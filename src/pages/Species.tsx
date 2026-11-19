import { useLayoutEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AnimalLibrary } from "@/components/sections/AnimalLibrary";
import "@/styles/species.css";

export default function Species() {
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    const previousTitle = document.title;
    document.title = "Especies y razas | Lúmina Animal Care";
    let disposed = false;
    let stopMotion = () => {};
    void import("gsap").then(({ gsap }) => {
    if (disposed) return;
    const motion = gsap.matchMedia();
    stopMotion = () => motion.revert();
    motion.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(".species-page__intro > *", { y: 24, opacity: 0, duration: .65, stagger: .08, ease: "power3.out" });
      gsap.from(".species-page__portrait", { y: 36, opacity: 0, duration: .85, stagger: .12, ease: "power3.out", delay: .15 });
      const statement = root.current?.querySelector(".species-page__closing h2");
      if (!statement) return;
      const observer = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        gsap.fromTo(statement, { y: 20, opacity: .3 }, { y: 0, opacity: 1, duration: .7, ease: "power3.out" });
        observer.disconnect();
      }, { threshold: .5 });
      observer.observe(statement);
      return () => observer.disconnect();
    }, root);
    }).catch(() => { /* El contenido permanece visible si no carga la animación. */ });
    return () => { disposed = true; stopMotion(); document.title = previousTitle; };
  }, []);

  return <div className="species-page" ref={root}>
    <a className="species-page__skip" href="#especies">Ir al buscador de animales</a>
    <Navbar />
    <main>
      <section className="species-page__hero" aria-labelledby="species-title">
        <div className="species-page__hero-inner">
          <div className="species-page__intro">
            <p className="species-page__eyebrow">LÚMINA / BIBLIOTECA ANIMAL</p>
            <h1 id="species-title">Un mundo<br />de especies.<br /><em>Una curiosidad<br />sin límites.</em></h1>
            <p>De los compañeros de casa a los animales que aún no conoces. Descubre sus historias, sus formas de vivir y lo que los hace únicos.</p>
            <a className="species-page__button" href="#especies">Explorar animales <ArrowDown size={18} aria-hidden="true" /></a>
          </div>
          <div className="species-page__portraits">
            <div className="species-page__portrait species-page__portrait--dog"><img src="https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=800&q=80" width="800" height="1000" alt="Golden retriever entre la vegetación" fetchPriority="high" /></div>
            <div className="species-page__portrait species-page__portrait--cat"><img src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=500&q=80" width="500" height="650" alt="Gato mirando con curiosidad" decoding="async" /></div>
          </div>
          <div className="species-page__index"><span>01 — Busca una especie</span><span>02 — Conoce su historia</span><span>03 — Sigue explorando</span></div>
        </div>
      </section>
      <AnimalLibrary />
      <section className="species-page__closing" aria-labelledby="species-closing">
        <p className="species-page__eyebrow">DE LA CURIOSIDAD AL CUIDADO</p>
        <h2 id="species-closing">Conocerlos es el primer paso.<br /><em>Cuidarlos, el siguiente.</em></h2>
        <p>Cada animal tiene necesidades propias. Si tienes dudas sobre tu compañero, estamos aquí para escucharte.</p>
        <Link className="species-page__button" to="/#cita">Reservar una visita <ArrowUpRight size={18} aria-hidden="true" /></Link>
      </section>
    </main>
    <p className="species-page__photo-credit">Fotografías de portada: Unsplash. Las fichas incluyen sus propias fuentes y créditos.</p>
    <Footer />
  </div>;
}
