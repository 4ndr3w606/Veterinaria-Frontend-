import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Reveal } from "@/components/animations/Reveal";
import { Tilt } from "@/components/animations/Tilt";
import { services } from "@/data/siteData";
import { go } from "@/lib/utils";

export function Services() {
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