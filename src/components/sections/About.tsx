import { HeartPulse, ShieldCheck } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Reveal } from "@/components/animations/Reveal";

export function About() {
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