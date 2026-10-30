import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import {
  ArrowUpRight, CalendarDays, Check, ChevronDown, Clock3, Heart, HeartPulse,
  MapPin, Menu, PawPrint, ShieldCheck, Stethoscope,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

/* ---------- Datos ---------- */
const links = [
  ["Nuestra esencia", "nosotros"], ["Servicios", "servicios"],
  ["Tu visita", "visita"], ["Historias", "historias"],
] as const;

const services = [
  { icon: Stethoscope, title: "Medicina preventiva", text: "Chequeos completos para que cada nueva aventura empiece con salud." },
  { icon: HeartPulse, title: "Cuidado especializado", text: "Diagnósticos precisos y atención diseñada alrededor de cada paciente." },
  { icon: ShieldCheck, title: "Vacunación y bienestar", text: "Protección y seguimiento en cada etapa de su vida." },
];

const stats = [
  [2000, "+", "patitas atendidas"], [98, "%", "de familias que vuelven"], [12, "", "años cuidando con calma"],
] as const;

const steps = [
  ["Reservas", "Eliges día y hora. Nos cuentas cómo está tu peludo."],
  ["Lo conocemos", "Empezamos con calma: primero olfatea, luego lo revisamos."],
  ["Te explicamos", "Sales con un plan claro y con todas tus dudas resueltas."],
];

const reviews = [
  { name: "Valentina R.", pet: "Milo · Golden", initials: "VR", quote: "Por primera vez sentí que escuchaban a mi perro tanto como a mí." },
  { name: "Andrés M.", pet: "Nala · Gata rescatada", initials: "AM", quote: "El equipo explica todo con una tranquilidad que te hace sentir en casa." },
  { name: "Camila P.", pet: "Bruno · Mestizo", initials: "CP", quote: "Aquí la medicina y el amor por los animales van juntos." },
];

const faqs = [
  ["¿Necesito cita previa?", "Sí. Así cada paciente tiene su tiempo y evitamos esperas largas."],
  ["¿Mi mascota tiene miedo, qué hago?", "Avísanos al reservar. Adaptamos el ritmo y la consulta a su carácter."],
  ["¿Atienden gatos y perros?", "Sí, atendemos ambos, con espacios y tiempos pensados para cada uno."],
];

/* ---------- Utilidades ---------- */
const vars = (o: Record<string, string | number>) => o as CSSProperties;
const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

const track = (e: PointerEvent<HTMLElement>) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
};

/* ---------- Hooks ---------- */
function useInView<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([en]) => {
      if (en.isIntersecting) { setSeen(true); io.disconnect(); }
    }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, seen] as const;
}

function useTyped(total: number, speed = 75, delay = 700) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setN(total); return; }
    let i = 0;
    let iv = 0;
    const t = window.setTimeout(() => {
      iv = window.setInterval(() => { i++; setN(i); if (i >= total) clearInterval(iv); }, speed);
    }, delay);
    return () => { clearTimeout(t); clearInterval(iv); };
  }, [total, speed, delay]);
  return n;
}

/* ---------- Componentes de animación ---------- */
function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const [ref, seen] = useInView<HTMLDivElement>(0.15);
  return (
    <div ref={ref} className={`reveal ${seen ? "is-in" : ""} ${className}`} style={vars({ "--d": `${delay}ms` })}>
      {children}
    </div>
  );
}

function Tilt({ children }: { children: ReactNode }) {
  return (
    <div
      className="tilt h-full"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const s = e.currentTarget.style;
        s.setProperty("--ry", `${((e.clientX - r.left) / r.width - 0.5) * 14}deg`);
        s.setProperty("--rx", `${(0.5 - (e.clientY - r.top) / r.height) * 14}deg`);
        s.setProperty("--mx", `${e.clientX - r.left}px`);
        s.setProperty("--my", `${e.clientY - r.top}px`);
      }}
      onPointerLeave={(e) => { e.currentTarget.style.setProperty("--rx", "0deg"); e.currentTarget.style.setProperty("--ry", "0deg"); }}
    >
      {children}
    </div>
  );
}

function Magnetic({ children, className = "inline-block" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`magnetic p-3 -m-3 ${className}`}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) * 0.3;
        const y = (e.clientY - (r.top + r.height / 2)) * 0.3;
        e.currentTarget.style.transform = `translate(${x}px, ${y}px)`;
      }}
      onPointerLeave={(e) => { e.currentTarget.style.transform = ""; }}
    >
      {children}
    </span>
  );
}

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [ref, seen] = useInView<HTMLSpanElement>(0.4);
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!seen) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / 2200);
      setV(Math.round(to * (1 - Math.pow(1 - k, 4))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, to]);
  return <span ref={ref}>{v.toLocaleString("es-CO")}{suffix}</span>;
}

function ScrollBar() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const on = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setP(h > 0 ? window.scrollY / h : 0);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-1" aria-hidden="true">
      <div className="h-full bg-gradient-to-r from-accent to-primary" style={{ width: `${p * 100}%` }} />
      <PawPrint className="absolute top-1.5 size-5 rotate-90 text-primary" style={{ left: `calc(${p * 100}% - 10px)`, opacity: p > 0.005 ? 1 : 0 }} />
    </div>
  );
}

/* Luma: mascota que mueve la cola, parpadea y te mira */
function Mascot() {
  const ref = useRef<HTMLDivElement>(null);
  const [say, setSay] = useState<string | null>(null);
  const [hop, setHop] = useState(false);

  useEffect(() => {
    const on = (e: globalThis.PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height * 0.45);
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, d / 220) * 3.6;
      el.style.setProperty("--ex", `${(dx / d) * k}px`);
      el.style.setProperty("--ey", `${(dy / d) * k}px`);
    };
    window.addEventListener("pointermove", on);
    const a = window.setTimeout(() => setSay("¡Hola! Soy Luma"), 2400);
    const b = window.setTimeout(() => setSay(null), 6000);
    return () => { window.removeEventListener("pointermove", on); clearTimeout(a); clearTimeout(b); };
  }, []);

  const bark = () => {
    setSay("¡Guau!"); setHop(true);
    window.setTimeout(() => setHop(false), 650);
    window.setTimeout(() => setSay(null), 1500);
  };

  return (
    <div ref={ref} className="fixed bottom-2 left-3 z-40">
      {say && (
        <span className="bubble absolute -top-8 left-14 whitespace-nowrap rounded-full bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">
          {say}
        </span>
      )}
      <button onClick={bark} aria-label="Saludar a Luma" className={`luma block ${hop ? "hop" : ""}`}>
        <svg viewBox="0 0 130 120" className="size-24 drop-shadow-xl sm:size-28">
          <path className="luma-tail" d="M92 96 C112 90 118 70 108 56" stroke="#d99a78" strokeWidth="10" strokeLinecap="round" fill="none" />
          <ellipse cx="62" cy="100" rx="30" ry="20" fill="#f2b99a" />
          <ellipse cx="36" cy="46" rx="11" ry="21" fill="#d99a78" transform="rotate(20 36 46)" />
          <ellipse cx="88" cy="46" rx="11" ry="21" fill="#d99a78" transform="rotate(-20 88 46)" />
          <circle cx="62" cy="58" r="30" fill="#f2b99a" />
          <ellipse cx="62" cy="71" rx="16" ry="12" fill="#f1ecdf" />
          {[50, 74].map((cx) => (
            <g key={cx} className="luma-eye">
              <circle cx={cx} cy="54" r="8" fill="#fff" />
              <circle className="luma-pupil" cx={cx} cy="54" r="4.2" fill="#0e1f1b" />
            </g>
          ))}
          <ellipse cx="62" cy="65" rx="5" ry="3.5" fill="#0e1f1b" />
          <path d="M55 74 Q62 81 69 74" stroke="#0e1f1b" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path className="luma-tongue" d="M59 77 q3 9 7 0 z" fill="#e5736a" />
        </svg>
      </button>
    </div>
  );
}

/* ---------- Secciones ---------- */
function Logo() {
  return (
    <span className="flex items-center gap-3">
      <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <PawPrint className="size-5" />
      </span>
      <span className="font-display text-xl font-semibold tracking-tight">Lúmina Animal Care</span>
    </span>
  );
}

function Navbar() {
  return (
    <header className="fixed inset-x-0 top-4 z-50 px-4">
      <nav className="mx-auto flex max-w-5xl items-center justify-between rounded-full border bg-background/70 py-2 pr-2 pl-4 backdrop-blur-xl">
        <button onClick={() => go("inicio")} aria-label="Volver al inicio"><Logo /></button>
        <div className="hidden items-center gap-1 md:flex">
          {links.map(([label, id]) => (
            <Button key={id} variant="ghost" className="rounded-full text-muted-foreground hover:text-primary" onClick={() => go(id)}>{label}</Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:block">
            <Magnetic>
              <Button className="rounded-full" onClick={() => go("cita")}>Reserva una visita <ArrowUpRight /></Button>
            </Magnetic>
          </span>
          <Sheet>
            <SheetTrigger render={<Button variant="outline" size="icon" className="rounded-full md:hidden" aria-label="Abrir menú"><Menu /></Button>} />
            <SheetContent side="right" className="w-72 gap-2 p-6">
              <SheetTitle className="mb-4">Menú</SheetTitle>
              {[...links, ["Reservar cita", "cita"] as const].map(([label, id]) => (
                <SheetClose key={id} render={<Button variant="ghost" className="justify-start text-base" onClick={() => go(id)}>{label}</Button>} />
              ))}
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}

type Paw = { id: number; x: number; y: number; r: number };
const L1 = "Pequeñas patas.";
const L2 = "Grandes historias.";

function Hero() {
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

function Marquee() {
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

function About() {
  return (
    <section id="nosotros" className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-28 lg:grid-cols-2">
      <Reveal>
        <div className="arch aspect-[4/5] max-h-[520px] overflow-hidden">
          <img src="https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=1000&q=85" alt="Veterinaria cuidando de un perro" className="size-full object-cover transition-transform duration-1000 hover:scale-105" />
        </div>
      </Reveal>
      <Reveal delay={200}>
        <h2 className="text-5xl leading-tight font-light tracking-tight md:text-6xl">La salud importa. <em className="text-primary">El vínculo, también.</em></h2>
        <p className="mt-6 max-w-lg leading-8 text-muted-foreground">
          Sabemos que no es «solo una mascota». Es quien te espera en la puerta y convierte los días normales en recuerdos. Por eso unimos medicina de calidad con un trato humano y respetuoso.
        </p>
        <Separator className="my-8" />
        <div className="grid grid-cols-2 gap-6">
          <div><HeartPulse className="mb-3 text-primary" /><h3 className="font-semibold">Nuestro enfoque</h3><p className="mt-1 text-sm text-muted-foreground">Prevención y cuidado individual.</p></div>
          <div><ShieldCheck className="mb-3 text-primary" /><h3 className="font-semibold">Nuestro compromiso</h3><p className="mt-1 text-sm text-muted-foreground">Transparencia en cada decisión.</p></div>
        </div>
      </Reveal>
    </section>
  );
}

function Stats() {
  return (
    <section className="border-y bg-card/40 px-5 py-20">
      <div className="mx-auto grid max-w-6xl gap-10 text-center md:grid-cols-3">
        {stats.map(([n, suffix, label], i) => (
          <Reveal key={label} delay={i * 150}>
            <p className="font-display text-7xl font-light text-primary"><Counter to={n} suffix={suffix} /></p>
            <p className="mt-2 text-muted-foreground">{label}</p>
          </Reveal>
        ))}
      </div>
      <p className="mt-8 text-center text-xs text-muted-foreground">Cifras de ejemplo para la maqueta.</p>
    </section>
  );
}

function Services() {
  return (
    <section id="servicios" className="bg-card/60 px-5 py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h2 className="max-w-2xl text-5xl leading-tight font-light tracking-tight md:text-6xl">Todo lo que necesitan. <em className="text-primary">Todo lo que merecen.</em></h2>
        </Reveal>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {services.map(({ icon: Icon, title, text }, i) => (
            <Reveal key={title} delay={i * 150} className="h-full">
              <Tilt>
                <Card className="glow-card h-full rounded-3xl bg-card">
                  <CardHeader>
                    <span className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-secondary text-primary"><Icon /></span>
                    <CardTitle className="font-display text-2xl font-medium">{title}</CardTitle>
                    <CardDescription className="leading-7">{text}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="link" className="h-auto p-0" onClick={() => go("cita")}>Más información <ArrowUpRight /></Button>
                  </CardContent>
                </Card>
              </Tilt>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Visit() {
  const [ref, seen] = useInView<HTMLOListElement>(0.3);
  return (
    <section id="visita" className="mx-auto max-w-6xl px-5 py-28">
      <Reveal>
        <h2 className="text-5xl leading-tight font-light tracking-tight md:text-6xl">Menos miedo. <em className="text-primary">Más confianza.</em></h2>
      </Reveal>
      <ol ref={ref} className={`relative mt-16 grid gap-12 md:grid-cols-3 md:gap-8 ${seen ? "is-in" : ""}`}>
        <span className="tl-line" aria-hidden="true" />
        <span className="tl-dot hidden md:block" aria-hidden="true" />
        {steps.map(([title, text], i) => (
          <li key={title} className="relative pl-16 md:pt-16 md:pl-0" style={vars({ "--i": i })}>
            <span className="tl-node">{i + 1}</span>
            <div className="tl-text">
              <h3 className="text-xl font-medium">{title}</h3>
              <p className="mt-2 max-w-xs text-sm leading-7 text-muted-foreground">{text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Reviews() {
  return (
    <section id="historias" className="bg-card/60 px-5 py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h2 className="text-5xl leading-tight font-light tracking-tight md:text-6xl">Ellos no dicen gracias. <em className="text-primary">Sus familias sí.</em></h2>
        </Reveal>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {reviews.map((r, i) => (
            <Reveal key={r.name} delay={i * 150} className="h-full">
              <Tilt>
                <Card className="glow-card h-full rounded-3xl">
                  <CardContent className="flex h-full flex-col justify-between gap-8">
                    <p className="font-display text-xl leading-8 italic">“{r.quote}”</p>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-11"><AvatarFallback className="bg-secondary text-primary">{r.initials}</AvatarFallback></Avatar>
                      <div><p className="text-sm font-bold">{r.name}</p><p className="text-xs text-muted-foreground">{r.pet}</p></div>
                    </div>
                  </CardContent>
                </Card>
              </Tilt>
            </Reveal>
          ))}
        </div>
        <p className="mt-5 text-xs text-muted-foreground">Testimonios de ejemplo para la maqueta.</p>
      </div>
    </section>
  );
}

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mt-8 max-w-md">
      {faqs.map(([q, a], i) => (
        <div key={q}>
          <Separator />
          <Button variant="ghost" className="h-auto w-full justify-between rounded-none px-0 py-4 text-left text-base font-medium hover:bg-transparent hover:text-primary" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
            {q}
            <ChevronDown className={`transition-transform duration-300 ${open === i ? "rotate-180" : ""}`} />
          </Button>
          <div className={`grid transition-all duration-300 ${open === i ? "grid-rows-[1fr] pb-4" : "grid-rows-[0fr]"}`}>
            <p className="overflow-hidden text-sm leading-7 text-muted-foreground">{a}</p>
          </div>
        </div>
      ))}
      <Separator />
    </div>
  );
}

function Booking() {
  const [sent, setSent] = useState(false);
  return (
    <section id="cita" className="mx-auto grid max-w-6xl gap-12 px-5 py-28 lg:grid-cols-2">
      <Reveal className="self-center">
        <h2 className="text-5xl leading-tight font-light tracking-tight md:text-7xl">Cuidarlos bien <em className="text-primary">lo cambia todo.</em></h2>
        <p className="mt-6 max-w-md leading-8 text-muted-foreground">Déjanos tus datos y te contactamos para confirmar la visita.</p>
        <Faq />
      </Reveal>
      <Reveal delay={200}>
        <Card className="rounded-3xl bg-card p-2">
          <CardContent className="p-6">
            {sent ? (
              <div className="py-10 text-center">
                <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check /></span>
                <h3 className="mt-5 text-2xl">¡Listo, ya te tenemos cerca!</h3>
                <p className="mt-2 text-sm text-muted-foreground">Es una demostración: aún no se envían datos.</p>
                <Button variant="link" onClick={() => setSent(false)}>Volver al formulario</Button>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
                <h3 className="text-2xl">Reserva tu visita</h3>
                <div className="space-y-2"><Label htmlFor="pet">Nombre de tu mascota</Label><Input id="pet" required placeholder="Milo" className="h-12 rounded-xl" /></div>
                <div className="space-y-2"><Label htmlFor="email">Tu correo</Label><Input id="email" type="email" required placeholder="hola@correo.com" className="h-12 rounded-xl" /></div>
                <Magnetic className="block">
                  <Button type="submit" size="lg" className="w-full rounded-full">Quiero agendar <ArrowUpRight /></Button>
                </Magnetic>
                <p className="text-center text-xs text-muted-foreground">Formulario de demostración.</p>
              </form>
            )}
          </CardContent>
        </Card>
      </Reveal>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mx-auto max-w-6xl px-5 pb-32">
      <Separator />
      <div className="grid gap-8 py-12 md:grid-cols-3">
        <div><Logo /><p className="mt-4 max-w-xs text-sm text-muted-foreground">Medicina veterinaria con propósito. Su mundo también es el nuestro.</p></div>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p className="font-bold text-foreground">Encuéntranos</p>
          <p className="flex gap-2"><MapPin className="size-4 text-primary" /> Tu ciudad, Colombia</p>
          <p className="flex gap-2"><Clock3 className="size-4 text-primary" /> Lunes a sábado · Horario por confirmar</p>
        </div>
        <div><Button variant="outline" className="rounded-full" onClick={() => go("inicio")}>Volver al inicio <ArrowUpRight /></Button></div>
      </div>
      <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Lúmina Animal Care. Hecho con ciencia, cuidado y corazón.</p>
    </footer>
  );
}

export default function App() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <ScrollBar />
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <About />
        <Stats />
        <Services />
        <Visit />
        <Reviews />
        <Booking />
      </main>
      <Footer />
      <Mascot />
    </div>
  );
}
