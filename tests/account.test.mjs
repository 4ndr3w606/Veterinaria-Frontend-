import { test } from "node:test";
import assert from "node:assert/strict";
import { localDate, orderStatus, petsFrom, splitBookings } from "../src/lib/account.ts";

const now = new Date(2026, 10, 19, 12).getTime();
const HOUR = 60 * 60 * 1000;
const at = (hoursAgo) => new Date(now - hoursAgo * HOUR).toISOString();
const booking = (id, date, time = "10:00", pet = "Milo", species = "Gato") => ({ id, pet, species, service: "Consulta", date, time });

test("el estado del pedido avanza con el tiempo y depende del tipo de entrega", () => {
  assert.equal(orderStatus({ createdAt: at(0.5), delivery: "domicilio" }, now).label, "Recibido");
  assert.equal(orderStatus({ createdAt: at(5), delivery: "domicilio" }, now).label, "Preparando");
  assert.equal(orderStatus({ createdAt: at(30), delivery: "domicilio" }, now).label, "En camino");
  assert.equal(orderStatus({ createdAt: at(30), delivery: "recoger" }, now).label, "Listo para recoger");
  const delivered = orderStatus({ createdAt: at(100), delivery: "recoger" }, now);
  assert.equal(delivered.label, "Entregado");
  assert.equal(delivered.done, true);
});

test("la fecha local no se corre a UTC por la noche", () => {
  assert.equal(localDate(new Date(2026, 10, 19, 23, 30)), "2026-11-19");
});

test("separa citas próximas e historial en el orden esperado", () => {
  const today = localDate(new Date(now));
  const { upcoming, past } = splitBookings([
    booking("a", "2026-12-01"),
    booking("b", today, "15:00"),
    booking("c", today, "09:00"),
    booking("d", "2026-10-02"),
    booking("e", "2026-11-18"),
  ], today);
  assert.deepEqual(upcoming.map((b) => b.id), ["c", "b", "a"]);
  assert.deepEqual(past.map((b) => b.id), ["e", "d"]);
  assert.deepEqual(splitBookings([], today), { upcoming: [], past: [] });
});

test("agrupa mascotas por nombre y especie", () => {
  const pets = petsFrom([
    booking("1", "2026-09-10", "10:00", "Max", "Perro"),
    booking("2", "2026-11-01", "10:00", "Luna", "Gato"),
    booking("3", "2026-12-01", "10:00", " max ", "Perro"),
    booking("4", "2026-08-01", "10:00", "Max", "Gato"),
  ]);
  // Conserva el nombre tal como apareció la primera vez; misma especie y nombre = misma mascota.
  assert.deepEqual(pets.map((p) => [p.name, p.species, p.visits, p.last]), [
    ["Max", "Perro", 2, "2026-12-01"],
    ["Luna", "Gato", 1, "2026-11-01"],
    ["Max", "Gato", 1, "2026-08-01"],
  ]);
  assert.deepEqual(petsFrom([]), []);
});
