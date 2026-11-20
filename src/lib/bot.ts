/** Guía local: información, búsqueda y consulta. Las compras y reservas se hacen en sus formularios. */
import type { Booking, BotReply, Product } from "./types";
import { FREE_SHIPPING, SERVICES, SHIPPING_COST, SLOTS, money } from "./constants.ts";

export type BotCtx = {
  products: Product[];
  userName: string | null;
  /** Solo las citas de la cuenta conectada, proporcionadas por StoreProvider. */
  bookings: Booking[];
};

export const DEFAULT_CHIPS = ["Agendar una cita", "Mis citas", "Ver la tienda", "Mi carrito"];
const norm = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const STOP = new Set("anade anadir agrega agregar quiero comprar busco necesito para unos unas favor precio cuanto cuesta producto productos tienda hola tienes tienen muestrame ver".split(" "));
const bullet = (product: Product) => `• ${product.name} — ${money(product.price)}`;

function findProducts(text: string, products: Product[]): Product[] {
  const words = text.split(/[^a-z0-9]+/).filter((word) => word.length >= 4 && !STOP.has(word));
  const scored = products.map((product) => {
    const name = norm(`${product.name} ${product.cat}`);
    const score = words.filter((word) => name.includes(word) || (word.endsWith("s") && name.includes(word.slice(0, -1)))).length;
    return { product, score };
  });
  const best = Math.max(0, ...scored.map(({ score }) => score));
  return scored.filter(({ score }) => score > 0 && score === best).map(({ product }) => product);
}

const CATEGORIES: [RegExp, string][] = [
  [/alimento|comida|croqueta|snack/, "Alimento"],
  [/juguete|pelota|raton|cuerda|rascador/, "Juguetes"],
  [/descanso|cama|dormir/, "Descanso"],
  [/paseo|collar|arnes|transportadora/, "Paseo"],
  [/higiene|shampoo|cepillo|bano/, "Higiene"],
  [/salud|dental/, "Salud"],
];

export function botReply(input: string, ctx: BotCtx): BotReply {
  const text = norm(input);
  const firstName = ctx.userName?.trim().split(/\s+/)[0];
  if (/emergenci|urgenci|urgente|envenen|intoxic|atropell|convuls|sangr|no respira|ahog|se desmay|veneno/.test(text)) {
    return { text: "Si tu mascota está en peligro, acude ahora a la clínica veterinaria más cercana. No esperes una respuesta del chat ni una reserva en esta web.", chips: ["Horarios"] };
  }
  if (/vomit|diarrea|cojea|no come|\btos\b|fiebre|dolor|herida|pulga|garrapata|alergia|enferm|sintoma|decaid/.test(text)) {
    return { text: "Por chat no puedo diagnosticar ni indicar tratamientos. Un veterinario debe valorar a tu mascota; si la situación es grave, acude a urgencias.", chips: ["Agendar una cita", "Horarios"] };
  }
  if (/mis citas|mi cita|citas que tengo|tengo (una )?cita|ver mis citas/.test(text)) {
    if (!ctx.userName) return { text: "Inicia sesión para consultar tus citas.", action: "openAuth" };
    if (!ctx.bookings.length) return { text: "Aún no tienes citas guardadas en tu cuenta.", chips: ["Agendar una cita"] };
    return { text: `Estas son tus citas:\n${ctx.bookings.map((booking) => `• ${booking.pet} (${booking.species}) · ${booking.service} — ${booking.date} ${booking.time}`).join("\n")}`, chips: ["Agendar una cita"] };
  }
  if (/\b(cita|citas|reserv\w*|agend\w*|turno|consulta)\b/.test(text)) {
    return { text: "Elige servicio, día y hora en el formulario de reservas. Para confirmar necesitas iniciar sesión.", action: "goBooking" };
  }
  if (/horario|a que hora|abren|cierran|abierto|atienden|dias de atencion/.test(text)) {
    return { text: `Atendemos de lunes a sábado. El horario exacto está por confirmar; el formulario ofrece franjas de ${SLOTS[0]} a ${SLOTS.at(-1)}.`, chips: ["Agendar una cita", "Servicios"] };
  }
  if (/donde (estan|queda|se ubican)|direccion|ubicacion|como llego|\bsede\b/.test(text)) {
    return { text: "La dirección exacta todavía no está publicada en esta web; aparece «Tu ciudad, Colombia».", chips: ["Horarios"] };
  }
  if (/carrito|cesta|mi pedido|mi compra|cuanto llevo|finalizar|pagar|checkout/.test(text)) {
    return { text: "En tu carrito puedes revisar los productos, las cantidades y el total.", action: "openCart" };
  }
  if (/envio|domicilio|despacho|entrega/.test(text)) {
    return { text: `El envío es gratis en pedidos desde ${money(FREE_SHIPPING)}. Para pedidos menores cuesta ${money(SHIPPING_COST)}, y también puedes recogerlo gratis en la clínica. Los datos de entrega se piden al finalizar la compra.`, chips: ["Ver la tienda", "Mi carrito"] };
  }
  if (/servicio|vacun|desparasit|bano|corte|peluquer|chequeo|que hacen|que ofrecen/.test(text) && !/shampoo|cepillo/.test(text)) {
    return { text: `Servicios disponibles:\n${[...SERVICES, "Emergencia"].map((service) => `• ${service}`).join("\n")}`, chips: ["Agendar una cita", "Horarios"] };
  }
  if (/ver la tienda|ir a la tienda|abre la tienda|ir a tienda|catalogo/.test(text)) {
    return { text: "En la tienda puedes buscar y añadir los productos que elijas.", action: "goShop" };
  }
  if (/cuenta|sesion|registr|login|entrar|ingresar|iniciar/.test(text)) {
    return ctx.userName
      ? { text: `Has iniciado sesión como ${firstName}.`, chips: ["Mis citas", "Mi carrito"] }
      : { text: "Te abro el acceso para entrar o crear tu cuenta.", action: "openAuth" };
  }
  const pet = /\b(perro|perros|cachorro|can)\b/.test(text) ? "Perro" : /\b(gato|gatos|gatito|felino)\b/.test(text) ? "Gato" : null;
  const category = CATEGORIES.find(([pattern]) => pattern.test(text))?.[1];
  const products = ctx.products.filter((product) => !pet || product.pet === pet || product.pet === "Todos");
  const found = findProducts(text, products);
  const generic = /tienda|producto|recomiend|sugier|regalo|que (venden|tienen|hay)/.test(text);
  const matches = found.length ? found : generic || category || pet ? products.filter((product) => !category || product.cat === category) : [];
  if (matches.length) {
    return { text: `${matches.slice(0, 4).map(bullet).join("\n")}\nPuedes ver los detalles y añadir productos desde la tienda.`, chips: ["Ver la tienda", "Mi carrito"] };
  }
  if (generic || category || pet || /precio|cuesta|cuanto vale|anadir|anade|agrega|busco/.test(text)) {
    return { text: "No encontré productos para esa búsqueda. Prueba con otro nombre o revisa el catálogo en la tienda.", chips: ["Ver la tienda"] };
  }
  if (/\b(gracias|thanks)\b/.test(text)) return { text: "¡Con gusto! 🐾", chips: DEFAULT_CHIPS };
  if (/\b(adios|chao|hasta luego|nos vemos)\b/.test(text)) return { text: "¡Hasta pronto! Un abrazo para tu peludo 🐾" };
  if (/\b(hola|buenas|hey|saludos)\b/.test(text)) return { text: `¡Hola${firstName ? `, ${firstName}` : ""}! Soy Luma 🐶. ¿En qué te ayudo?`, chips: DEFAULT_CHIPS };
  return { text: "Soy Luma, la guía de Lúmina. Puedo informarte sobre servicios y horarios, buscar productos, mostrar tus citas y abrir reservas, tienda o carrito.", chips: DEFAULT_CHIPS };
}