import { useState } from "react";
import { ArrowUpRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Magnetic } from "@/components/animations/Magnetic";
import { Reveal } from "@/components/animations/Reveal";
import { Faq } from "@/components/sections/Faq";

export function Booking() {
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