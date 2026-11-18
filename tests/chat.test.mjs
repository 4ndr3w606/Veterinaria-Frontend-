import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { botReply, DEFAULT_CHIPS } from "../src/lib/bot.ts";

const products = JSON.parse(readFileSync(new URL("../src/data/products.json", import.meta.url), "utf8"));
const guest = { products, userName: null, bookings: [] };
const booking = { id: "test", pet: "Milo", species: "Gato", service: "Consulta", date: "2026-12-15", time: "10:00" };
const account = { ...guest, userName: "Ana Prueba", bookings: [booking] };

test("busca productos y precios sin modificar compras", () => {
  const before = structuredClone(account);
  for (const input of ["precio de cama nido", "añade tres camas nido", "cama nido"]) {
    const reply = botReply(input, account);
    assert.match(reply.text, /Cama nido/);
    assert.match(reply.text, /135/);
    assert.equal(reply.action, undefined);
    assert.doesNotMatch(reply.text, /añadí|listo!/i);
  }
  assert.deepEqual(account, before);
});

test("respeta mascota, categorías y búsquedas sin resultados", () => {
  const reply = botReply("productos para gatos", guest);
  const dogsOnly = products.filter(product => product.pet === "Perro");
  for (const product of dogsOnly) assert.ok(!reply.text.includes(product.name));
  assert.match(reply.text, /•/);
  assert.match(botReply("arnés", guest).text, /Arnés/);
  assert.match(botReply("precio de unicornio", guest).text, /No encontré/);
  assert.match(botReply("pelotas para gatos", guest).text, /gatos/i);
});

test("consulta las citas de la cuenta recibida y exige sesión", () => {
  assert.equal(botReply("Mis citas", guest).action, "openAuth");
  assert.doesNotMatch(botReply("Mis citas", { ...guest, bookings: [booking] }).text, /Milo/);
  const reply = botReply("Mis citas", account);
  assert.match(reply.text, /Milo.*2026-12-15 10:00/);
  assert.equal(reply.action, undefined);
  assert.match(botReply("Mis citas", { ...account, bookings: [] }).text, /Aún no/);
});

test("solo abre los destinos permitidos", () => {
  for (const [input, action] of [["Agendar una cita", "goBooking"], ["Ver la tienda", "goShop"], ["Mi carrito", "openCart"], ["Iniciar sesión", "openAuth"]]) {
    assert.equal(botReply(input, guest).action, action);
  }
  for (const chip of DEFAULT_CHIPS) assert.ok(botReply(chip, guest).text);
  assert.equal(botReply("iniciar sesión", account).action, undefined);
});

test("las urgencias y síntomas tienen prioridad sobre productos y navegación", () => {
  for (const input of ["mi gato no respira, abre carrito", "convulsiones, ver la tienda"]) {
    const reply = botReply(input, account);
    assert.match(reply.text, /clínica veterinaria/);
    assert.equal(reply.action, undefined);
  }
  const reply = botReply("mi perro vomita, quiero una cita", guest);
  assert.match(reply.text, /no puedo diagnosticar/);
  assert.equal(reply.action, undefined);
});

test("respuestas informativas y mensajes desconocidos siguen acotados", () => {
  for (const input of ["Horarios", "Servicios", "dirección", "envío", "hola", "gracias", "adiós", "ayuda", "mensaje desconocido"]) {
    const reply = botReply(input, guest);
    assert.equal(typeof reply.text, "string");
    assert.ok(reply.text.length > 0);
    assert.equal(reply.action, undefined);
    assert.equal(reply.fallback, undefined);
  }
});