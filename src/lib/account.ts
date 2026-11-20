// Lógica de «Mi cuenta»: estados simulados de pedidos, historial de citas y mascotas.
// Sin React ni alias "@/" para poder probarla con node --test.
import type { DeliveryMethod } from "./checkout.ts";
import type { Booking, OrderRecord } from "./types.ts";

const HOUR = 60 * 60 * 1000;

export const ORDER_STEPS: Record<DeliveryMethod, string[]> = {
  domicilio: ["Recibido", "Preparando", "En camino", "Entregado"],
  recoger: ["Recibido", "Preparando", "Listo para recoger", "Entregado"],
};

/**
 * Estado simulado según el tiempo transcurrido: no hay transportadora ni backend que lo informe.
 * Recibido < 1 h, preparando < 24 h, en camino o listo < 72 h, después entregado.
 */
export function orderStatus(order: Pick<OrderRecord, "createdAt" | "delivery">, now = Date.now()) {
  const hours = (now - Date.parse(order.createdAt)) / HOUR;
  const step = hours < 1 ? 0 : hours < 24 ? 1 : hours < 72 ? 2 : 3;
  const steps = ORDER_STEPS[order.delivery];
  return { step, label: steps[step], steps, done: step === steps.length - 1 };
}

/** Fecha local en formato YYYY-MM-DD (toISOString usaría UTC y puede cambiar de día). */
export function localDate(date: Date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

/** Próximas (de hoy en adelante, la más cercana primero) e historial (la más reciente primero). */
export function splitBookings<T extends Booking>(bookings: T[], today: string) {
  const key = (booking: Booking) => booking.date + " " + booking.time;
  return {
    upcoming: bookings.filter((booking) => booking.date >= today).sort((a, b) => key(a).localeCompare(key(b))),
    past: bookings.filter((booking) => booking.date < today).sort((a, b) => key(b).localeCompare(key(a))),
  };
}

/** Mascotas que aparecen en las citas, con su número de visitas y la más reciente. */
export function petsFrom(bookings: Booking[]) {
  const pets = new Map<string, { name: string; species: string; visits: number; last: string }>();
  for (const booking of bookings) {
    const key = booking.pet.trim().toLocaleLowerCase("es") + "|" + booking.species;
    const current = pets.get(key);
    if (!current) pets.set(key, { name: booking.pet.trim(), species: booking.species, visits: 1, last: booking.date });
    else {
      current.visits += 1;
      if (booking.date > current.last) current.last = booking.date;
    }
  }
  return [...pets.values()].sort((a, b) => b.last.localeCompare(a.last));
}
