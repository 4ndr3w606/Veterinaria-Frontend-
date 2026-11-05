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
  `rounded-full border px-4 py-2 text-sm transition-all duration-300 ${
    off
      ? "cursor-not-allowed line-through opacity-30"
      : on
      ? "scale-105 bg-primary text-primary-foreground shadow-[0_0_18px_rgba(232,245,184,.35)]"
      : "hover:border-primary hover:text-primary"
  }`;

const ALL_SERVICES = [...SERVICES, "Emergencia"];

export function Booking() {
  const { user, setAuthOpen, bookings, book, cancel } = useStore();
  const [sent, setSent] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  
  const today = new Date().toISOString().split("T")[0];

  const [service, setService] = useState(ALL_SERVICES[0]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [species, setSpecies] = useState("Perro");
  
  const [customSpecies, setCustomSpecies] = useState("");
  const [emergencyReason, setEmergencyReason] = useState("");

  const mine = bookings
    .filter((b) => b.email === user?.email)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    
  const taken = (t: string) => bookings.some((b) => b.date === date && b.time === t);

  const handleServiceChange = (selectedService: string) => {
    setService(selectedService);
    if (selectedService === "Emergencia") {
      setDate(today);
      setTime("Inmediata"); // Asigna hora de atención inmediata
    } else {
      setTime("");
    }
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return setAuthOpen(true);
    
    // Si no es emergencia, validar que haya elegido fecha y hora
    if (service !== "Emergencia" && (!date || !time)) {
      return setErr("Elige una fecha y una hora.");
    }
    
    if (species === "Otro" && !customSpecies.trim()) {
      return setErr("Por favor especifica el tipo de animal.");
    }
    
    if (service === "Emergencia" && !emergencyReason.trim()) {
      return setErr("Por favor ingresa el motivo de la emergencia.");
    }

    const formData = new FormData(e.currentTarget);
    const pet = String(formData.get("pet"));

    const finalSpecies = species === "Otro" ? customSpecies.trim() : species;
    const finalService =
      service === "Emergencia"
        ? `Emergencia: ${emergencyReason.trim()}`
        : service;
    const finalTime = service === "Emergencia" ? "Atención Inmediata" : time;

    const r = book({
      pet,
      species: finalSpecies,
      service: finalService,
      date: service === "Emergencia" ? today : date,
      time: finalTime,
    });

    setErr(r);
    if (!r) {
      setSent(pet);
      setTime("");
      setCustomSpecies("");
      setEmergencyReason("");
    }
  };

  return (
    <section id="cita" className="mx-auto grid max-w-6xl gap-12 px-5 py-28 lg:grid-cols-2">
      <Reveal className="self-center">
        <h2 className="text-5xl leading-tight font-light tracking-tight md:text-7xl">
          Cuidarlos bien <em className="text-primary">lo cambia todo.</em>
        </h2>
        <p className="mt-6 max-w-md leading-8 text-muted-foreground">
          Elige servicio, día y hora. Tu cita queda guardada en tu cuenta.
        </p>
        <Faq />
      </Reveal>

      <Reveal delay={200}>
        <Card className="rounded-3xl bg-card p-2">
          <CardContent className="p-6">
            {sent ? (
              <div className="bubble py-10 text-center">
                <span className="ring-wrap relative mx-auto flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <span className="ring" />
                  <Check />
                </span>
                <h3 className="mt-5 text-2xl">¡{sent} ya tiene cita!</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  La encuentras abajo en «Mis citas».
                </p>
                <Button variant="link" onClick={() => setSent(null)}>
                  Reservar otra
                </Button>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={submit}>
                <h3 className="text-2xl">Reserva tu visita</h3>
                
                {/* Nombre de la mascota */}
                <div className="space-y-2">
                  <Label htmlFor="pet">Nombre de tu mascota</Label>
                  <Input
                    id="pet"
                    name="pet"
                    required
                    placeholder="Milo"
                    className="h-12 rounded-xl"
                  />
                </div>

                {/* Selección de Especie */}
                <div className="space-y-2">
                  <Label>Tipo de mascota</Label>
                  <div className="flex gap-2">
                    {["Perro", "Gato", "Otro"].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setSpecies(s)}
                        className={chip(species === s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  {species === "Otro" && (
                    <div className="bubble pt-2">
                      <Label htmlFor="customSpecies">¿Qué animal es?</Label>
                      <Input
                        id="customSpecies"
                        value={customSpecies}
                        onChange={(e) => setCustomSpecies(e.target.value)}
                        required
                        placeholder="Ej: Conejo, Hurón, Loro..."
                        className="mt-1 h-12 rounded-xl"
                      />
                    </div>
                  )}
                </div>

                {/* Selección de Servicio */}
                <div className="space-y-2">
                  <Label>Servicio</Label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_SERVICES.map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => handleServiceChange(s)}
                        className={
                          chip(service === s, false) +
                          (s === "Emergencia" && service === s
                            ? " border-destructive bg-destructive text-white shadow-[0_0_18px_rgba(229,115,106,.4)]"
                            : "")
                        }
                      >
                        {s === "Emergencia" ? "🚨 Emergencia" : s}
                      </button>
                    ))}
                  </div>

                  {service === "Emergencia" && (
                    <div className="bubble pt-2">
                      <Label htmlFor="emergencyReason" className="font-medium text-destructive">
                        Motivo de la emergencia
                      </Label>
                      <Input
                        id="emergencyReason"
                        value={emergencyReason}
                        onChange={(e) => setEmergencyReason(e.target.value)}
                        required
                        placeholder="Describe brevemente la emergencia..."
                        className="mt-1 h-12 rounded-xl border-destructive/50 focus-visible:ring-destructive"
                      />
                    </div>
                  )}
                </div>

                {/* Fecha */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="date">Fecha</Label>
                    {service === "Emergencia" && (
                      <span className="text-xs font-semibold text-destructive">
                        * Asignada para hoy (Urgencia)
                      </span>
                    )}
                  </div>
                  <Input
                    id="date"
                    type="date"
                    min={today}
                    value={date}
                    disabled={service === "Emergencia"}
                    onChange={(e) => {
                      setDate(e.target.value);
                      setTime("");
                    }}
                    className="h-12 rounded-xl disabled:opacity-80"
                  />
                </div>

                {/* Horarios disponibles: Solo se muestra si NO es Emergencia */}
                {service !== "Emergencia" && date && (
                  <div key={date} className="bubble space-y-2">
                    <Label>Hora</Label>
                    <div className="flex flex-wrap gap-2">
                      {SLOTS.map((t) => (
                        <button
                          type="button"
                          key={t}
                          disabled={taken(t)}
                          onClick={() => setTime(t)}
                          className={chip(time === t, taken(t))}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Errores */}
                {err && (
                  <p role="alert" className="bubble text-sm text-destructive">
                    {err}
                  </p>
                )}

                {/* Botón Submit */}
                <Magnetic className="block">
                  <Button
                    type="submit"
                    size="lg"
                    className={`w-full rounded-full ${
                      service === "Emergencia" ? "bg-destructive text-white hover:bg-destructive/90" : ""
                    }`}
                  >
                    {user
                      ? service === "Emergencia"
                        ? "Confirmar Emergencia Inmediata"
                        : "Confirmar cita"
                      : "Entra para reservar"}{" "}
                    <ArrowUpRight />
                  </Button>
                </Magnetic>
              </form>
            )}

            {/* Mis Citas */}
            {mine.length > 0 && (
              <div className="mt-8 border-t pt-6">
                <h4 className="font-display text-xl">Mis citas</h4>
                <ul className="mt-3 space-y-2">
                  {mine.map((b) => (
                    <li
                      key={b.id}
                      className="bubble flex items-center justify-between rounded-2xl bg-muted px-4 py-3 text-sm"
                    >
                      <span>
                        <b className="font-medium text-primary">{b.pet}</b> ({b.species}) · {b.service}
                        <br />
                        <span className="text-muted-foreground">
                          {b.date} — {b.time}
                        </span>
                      </span>
                      <button
                        onClick={() => cancel(b.id)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Cancelar cita"
                      >
                        <Trash2 className="size-4" />
                      </button>
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