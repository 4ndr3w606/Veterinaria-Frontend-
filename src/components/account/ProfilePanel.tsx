import { Cat, Dog, Mail, PawPrint, UserRound } from "lucide-react";
import { EmptyState, shortDate } from "@/components/account/shared";
import type { petsFrom } from "@/lib/account";
import type { User } from "@/lib/types";

type Props = { user: User; pets: ReturnType<typeof petsFrom> };

const petIcon = (species: string) =>
  species === "Perro" ? <Dog className="size-6" /> : species === "Gato" ? <Cat className="size-6" /> : <PawPrint className="size-6" />;

export function ProfilePanel({ user, pets }: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-3xl bg-card p-6 ring-1 ring-border" aria-labelledby="pf-info">
        <h3 id="pf-info" className="font-display text-2xl">Información personal</h3>
        <dl className="mt-5 space-y-4 text-sm">
          <Row icon={<UserRound className="size-4" />} label="Nombre" value={user.name} />
          <Row icon={<Mail className="size-4" />} label="Correo" value={user.email} />
        </dl>
      </section>

      <section className="rounded-3xl bg-card p-6 ring-1 ring-border" aria-labelledby="pf-pets">
        <h3 id="pf-pets" className="font-display text-2xl">Mis mascotas</h3>
        <p className="mt-1 text-sm text-muted-foreground">Las reconocemos por las citas que has reservado.</p>
        {pets.length === 0 ? (
          <div className="mt-5">
            <EmptyState icon={<PawPrint className="size-6" />} title="Aún no hay mascotas" text="Reserva la primera cita y tu mascota aparecerá aquí." />
          </div>
        ) : (
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {pets.map((pet) => (
              <li key={pet.name + pet.species} className="flex items-center gap-3 rounded-2xl bg-muted p-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground" aria-hidden="true">{petIcon(pet.species)}</span>
                <div className="min-w-0">
                  <p className="font-medium">{pet.name}</p>
                  <p className="text-xs text-muted-foreground">{pet.species} · {pet.visits} {pet.visits === 1 ? "cita" : "citas"}</p>
                  <p className="text-xs text-muted-foreground">Última: {shortDate(pet.last)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-primary" aria-hidden="true">{icon}</span>
      <div className="min-w-0">
        <dt className="text-muted-foreground">{label}</dt>
        <dd className="break-words">{value}</dd>
      </div>
    </div>
  );
}
