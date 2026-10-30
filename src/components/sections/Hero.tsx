import { useState, useRef, type PointerEvent } from "react";
import { CalendarDays, Heart, PawPrint } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Magnetic } from "@/components/animations/Magnetic";
import { useTyped } from "../hooks/useTyped";
import { go, track, vars } from "@/lib/utils";

type Paw = { id: number; x: number; y: number; r: number };
const L1 = "Pequeñas patas.";
const L2 = "Grandes historias.";

export function Hero() {
  const n = useTyped(L1.length + L2.length);
  const n2 = Math.max(0, n - L1.length);
  const [paws, setPaws] = useState<Paw[]>([]);
  const last = useRef({ x: -999, y: -999, id: 0, side: 1 });

  const onMove = (e: PointerEvent<HTMLElement>) => {
    e.currentTarget.dataset.idle = "false";
    track(e);
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const l = last.current;
    if (Math.hypot(x - l.x, y - l.y) < 70) return;
    const rot = (Math.atan2(y - l.y, x - l.x) * 180) / Math.PI + 90;
    l.x = x; l.y = y; l.side *= -1;
    const id = ++l.id;
    setPaws((p) => [...p.slice(-9), { id, x: x + l.side * 12, y, r: rot }]);
    window.setTimeout(() => setPaws((p) => p.filter((q) => q.id !== id)), 1600);
  };

  return (
    <section id="inicio" data-idle="true" className="hero relative isolate overflow-hidden" onPointerMove={onMove}>
      <div className="lantern -z-10" />
      <div className="halo -z-10" />
      {paws.map((p) => (
        <PawPrint key={p.id} className="paw-trail size-7" style={vars({ left: p.x, top: p.y, "--r": `${p.r}deg` })} />
      ))}

      <div className="relative z-10 mx-auto grid min-h-svh max-w-6xl items-center gap-12 px-5 pt-32 pb-16 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <Badge variant="outline" className="enter mb-6 gap-2 rounded-full px-3 py-1 text-muted-foreground" style={vars({ "--i": 0 })}>
            <span className="size-2 rounded-full bg-primary" /> Un lugar para sentirse en casa
          </Badge>

          <h1 aria-label={`${L1} ${L2}`} className="text-[clamp(3.2rem,9vw,7.5rem)] leading-[0.95] font-light tracking-tighter">
            <span aria-hidden="true">
              <span>{L1.slice(0, n)}<span className="opacity-0">{L1.slice(n)}</span>{n < L1.length && <i className="caret" />}</span>
              <br />
              <em className="font-light text-primary">{L2.slice(0, n2)}<span className="opacity-0">{L2.slice(n2)}</span>{n >= L1.length && <i className="caret" />}</em>
            </span>
          </h1>

          <p className="enter mt-8 max-w-md text-lg leading-relaxed text-muted-foreground" style={vars({ "--i": 5 })}>
            Medicina veterinaria con ciencia, sensibilidad y mucho corazón. Mueve el cursor: dejarás huellas y la luz de Lúmina descubrirá las suyas.
          </p>

          <div className="enter mt-8 flex flex-wrap items-center gap-4" style={vars({ "--i": 6 })}>
            <Magnetic>
              <Button size="lg" className="rounded-full" onClick={() => go("cita")}><CalendarDays /> Agendar una cita</Button>
            </Magnetic>
            <Button size="lg" variant="ghost" className="rounded-full" onClick={() => go("servicios")}>Explorar servicios</Button>
          </div>

          <div className="enter mt-12 flex items-center gap-4" style={vars({ "--i": 7 })}>
            <div className="flex -space-x-3">
              {[["photo-1552053831-71594a27632d", "Golden"], ["photo-1514888286974-6c03e2ca1dba", "Gato"], ["photo-1543466835-00a7907e9de1", "Perro"]].map(([id, alt]) => (
                <Avatar key={id} className="size-11 border-2 border-background">
                  <AvatarImage src={`https://images.unsplash.com/${id}?auto=format&fit=crop&w=100&q=80`} alt={alt} />
                  <AvatarFallback>{alt[0]}</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Cuidado que se siente.</strong><br />Cada paciente es parte de la familia.
            </p>
          </div>
        </div>

        <div className="enter relative mx-auto w-full max-w-md" style={vars({ "--i": 3 })}>
          <div className="arch aspect-[4/5] overflow-hidden border-4 border-primary/30 shadow-[0_0_120px_-20px_rgba(232,245,184,0.35)]">
            <img src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1000&q=85" alt="Dos perros disfrutando juntos al aire libre" className="size-full object-cover" />
          </div>
          <div className="float absolute -right-3 bottom-10 flex h-36 w-28 flex-col items-center justify-center gap-1 rounded-t-full rounded-b-2xl border-4 border-background bg-primary text-primary-foreground">
            <span className="ring" style={{ animationDelay: "0s" }} />
            <span className="ring" style={{ animationDelay: "1.3s" }} />
            <Heart className="beat size-6" fill="currentColor" />
            <span className="text-[9px] font-bold tracking-wider">ELLOS SON</span>
            <strong className="font-display text-2xl">TODO</strong>
            <span className="text-[8px] font-bold tracking-wider">PARA NOSOTROS</span>
          </div>
        </div>
      </div>
    </section>
  );
}