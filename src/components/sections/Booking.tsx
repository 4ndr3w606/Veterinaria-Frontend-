import { useState } from "react";
import { ArrowUpRight, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Magnetic } from "@/components/animations/Magnetic";
import { Reveal } from "@/components/animations/Reveal";
import { Faq } from "@/components/sections/Faq";
import { SERVICES, SLOTS, useStore } from "@/lib/store.tsx";

const chip = (on: boolean, off = false) =>
  `rounded-full border px-4 py-2 text-sm transition-all duration-300 ${off ? "cursor-not-allowed line-through opacity-30" : on ? "scale-105 bg-primary text-primary-foreground shadow-[0_0_18px_rgba(232,245,184,.35)]" : "hover:border-primary hover:text-primary"}`;

export function Booking() {
  const { user, setAuthOpen, bookings, book, cancel } = useStore();
  const [sent, setSent] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [service, setService] = useState(SERVICES[0]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [species, setSpecies] = useState("Perro");
  const mine = bookings.filter((b) => b.email === user?.email).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const taken = (t: string) => bookings.some((b) => b.date === date && b.time === t);
  const today = new Date().toISOString().split("T")[0];

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return setAuthOpen(true);
    if (!date || !time) return setErr("Elige una fecha y una hora.");
    const pet = String(new FormData(e.currentTarget).get("pet"));
    const r = book({ pet, species, service, date, time });
    setErr(r);
    if (!r) { setSent(pet); setTime(""); }
  };

  return (
    <section id="cita" className="mx-auto grid max-w-6xl gap-12 px-5 py-28 lg:grid-cols-2">
      <Reveal className="self-center">
        <h2 className="text-5xl leading-tight font-light tracking-tight md:text-7xl">Cuidarlos bien <em className="text-primary">lo cambia todo.</em></h2>
        <p className="mt-6 max-w-md leading-8 text-muted-foreground">Elige servicio, día y hora. Tu cita queda guardada en tu cuenta.</p>
        <Faq />
      </Reveal>
      <Reveal delay={200}>
        <Card className="rounded-3xl bg-card p-2">
          <CardContent className="p-6">
            {sent ? (
              <div className="bubble py-10 text-center">
                <span className="ring-wrap relative mx-auto flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground"><span className="ring" /><Check /></span>
                <h3 className="mt-5 text-2xl">¡{sent} ya tiene cita!</h3>
                <p className="mt-2 text-sm text-muted-foreground">La encuentras abajo en «Mis citas».</p>
                <Button variant="link" onClick={() => setSent(null)}>Reservar otra</Button>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={submit}>
                <h3 className="text-2xl">Reserva tu visita</h3>
                <div className="space-y-2"><Label htmlFor="pet">Nombre de tu mascota</Label><Input id="pet" name="pet" required placeholder="Milo" className="h-12 rounded-xl" /></div>
                <div className="flex gap-2">{["Perro", "Gato", "Otro"].map((s) => <button type="button" key={s} onClick={() => setSpecies(s)} className={chip(species === s)}>{s}</button>)}</div>
                <div className="space-y-2"><Label>Servicio</Label><div className="flex flex-wrap gap-2">{SERVICES.map((s) => <button type="button" key={s} onClick={() => setService(s)} className={chip(service === s)}>{s}</button>)}</div></div>
                <div className="space-y-2"><Label htmlFor="date">Fecha</Label><Input id="date" type="date" min={today} value={date} onChange={(e) => { setDate(e.target.value); setTime(""); }} className="h-12 rounded-xl" /></div>
                {date && <div key={date} className="bubble space-y-2"><Label>Hora</Label><div className="flex flex-wrap gap-2">{SLOTS.map((t) => <button type="button" key={t} disabled={taken(t)} onClick={() => setTime(t)} className={chip(time === t, taken(t))}>{t}</button>)}</div></div>}
                {err && <p role="alert" className="bubble text-sm text-destructive">{err}</p>}
                <Magnetic className="block"><Button type="submit" size="lg" className="w-full rounded-full">{user ? "Confirmar cita" : "Entra para reservar"} <ArrowUpRight /></Button></Magnetic>
              </form>
            )}
            {mine.length > 0 && (
              <div className="mt-8 border-t pt-6">
                <h4 className="font-display text-xl">Mis citas</h4>
                <ul className="mt-3 space-y-2">
                  {mine.map((b) => (
                    <li key={b.id} className="bubble flex items-center justify-between rounded-2xl bg-muted px-4 py-3 text-sm">
                      <span><b className="font-medium text-primary">{b.pet}</b> · {b.service}<br /><span className="text-muted-foreground">{b.date} a las {b.time}</span></span>
                      <button onClick={() => cancel(b.id)} className="text-muted-foreground hover:text-destructive" aria-label="Cancelar cita"><Trash2 className="size-4" /></button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </Reveal>
    </section>
  );
}
