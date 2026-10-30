import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

import { Reveal } from "@/components/animations/Reveal";
import { Tilt } from "@/components/animations/Tilt";
import { reviews } from "@/data/siteData";

export function Reviews() {
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