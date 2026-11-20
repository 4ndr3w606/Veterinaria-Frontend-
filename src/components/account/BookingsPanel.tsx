import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, CalendarClock, RefreshCw } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState, StatusPill, longDate, shortDate } from "@/components/account/shared";
import { EMERGENCY_TIME } from "@/lib/constants";
import type { Booking } from "@/lib/types";

type Props = {
  upcoming: Booking[];
  past: Booking[];
  loading: boolean;
  error: string | null;
  onCancel: (id: string) => Promise<string | null>;
  onRefresh: () => void;
};

const bookLink = <Link to="/#cita" className={buttonVariants({ className: "rounded-full" })}>Reservar una cita</Link>;

export function BookingsPanel({ upcoming, past, loading, error, onCancel, onRefresh }: Props) {
  return (
    <div className="space-y-10">
      <section aria-labelledby="bk-upcoming">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 id="bk-upcoming" className="font-display text-2xl">Próximas citas</h3>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" className="rounded-full" onClick={onRefresh} disabled={loading}>
              <RefreshCw className={loading ? "animate-spin" : undefined} /> Actualizar
            </Button>
            <Link to="/#cita" className={buttonVariants({ size: "sm", className: "rounded-full" })}>Nueva cita</Link>
          </div>
        </div>
        {error && <p role="alert" className="mb-4 rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}
        {loading && upcoming.length === 0 ? (
          <p role="status" className="py-6 text-center text-muted-foreground">Cargando tus citas…</p>
        ) : upcoming.length === 0 ? (
          <EmptyState icon={<CalendarClock className="size-6" />} title="No tienes citas próximas"
            text="Reserva una consulta, vacunación, baño o desparasitación y aparecerá aquí." action={bookLink} />
        ) : (
          <ul className="space-y-3">{upcoming.map((booking) => <UpcomingCard key={booking.id} booking={booking} onCancel={onCancel} />)}</ul>
        )}
      </section>

      <section aria-labelledby="bk-history">
        <h3 id="bk-history" className="mb-4 font-display text-2xl">Historial</h3>
        {past.length === 0 ? (
          <EmptyState icon={<CalendarCheck className="size-6" />} title="Sin citas anteriores" text="Las citas atendidas aparecerán aquí." />
        ) : (
          <ol className="relative space-y-3 border-l border-border pl-6">
            {past.map((booking) => (
              <li key={booking.id} className="relative rounded-2xl bg-card p-4 ring-1 ring-border">
                <span className="absolute top-6 -left-[31px] size-3 rounded-full border-2 border-background bg-primary" aria-hidden="true" />
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium">{booking.service} · {booking.pet}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{shortDate(booking.date)} · {booking.time} · {booking.species}</p>
                  </div>
                  <StatusPill tone="done">Atendida</StatusPill>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function UpcomingCard({ booking, onCancel }: { booking: Booking; onCancel: (id: string) => Promise<string | null> }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const emergency = booking.time === EMERGENCY_TIME;

  const cancel = async () => {
    setBusy(true);
    const result = await onCancel(booking.id);
    setBusy(false);
    setError(result);
    if (result) setConfirming(false);
  };

  return (
    <li className="rounded-3xl bg-card p-5 ring-1 ring-border">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-display text-xl">
            {booking.pet} <span className="font-sans text-sm text-muted-foreground">({booking.species})</span>
          </p>
          <p className="mt-1 text-sm">{booking.service}</p>
          <p className="mt-1 text-sm text-muted-foreground first-letter:uppercase">{longDate(booking.date)} · {booking.time}</p>
          {booking.reason && <p className="mt-1 text-sm text-muted-foreground">Motivo: {booking.reason}</p>}
        </div>
        <StatusPill tone={emergency ? "danger" : "default"}>{emergency ? "Emergencia" : "Confirmada"}</StatusPill>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {confirming ? (
          <>
            <span className="text-sm">¿Cancelar esta cita?</span>
            <Button type="button" size="sm" variant="destructive" className="rounded-full" disabled={busy} onClick={() => void cancel()}>
              {busy ? "Cancelando…" : "Sí, cancelar"}
            </Button>
            <Button type="button" size="sm" variant="ghost" className="rounded-full" disabled={busy} onClick={() => setConfirming(false)}>No</Button>
          </>
        ) : (
          <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={() => setConfirming(true)}>Cancelar cita</Button>
        )}
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
    </li>
  );
}
