import { Reveal } from "@/components/animations/Reveal";
import { steps } from "@/data/siteData";
import { useInView } from "@/components/hooks/useInView";
import { vars } from "@/lib/utils";

export function Visit() {
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