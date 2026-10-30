import { Counter } from "@/components/animations/Counter";
import { Reveal } from "@/components/animations/Reveal";
import { stats } from "@/data/siteData";

export function Stats() {
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