/**
 * Cerebro de Luma, el chatbot de la web. Funciona sin servidor: lee el catálogo, la cesta y las citas
 * de quien está usando la web, y puede pedirle a la interfaz que haga cosas (añadir al carrito, abrir la
 * cesta, llevar a la tienda o al formulario de citas) mediante "actions".
 *
 * Para añadir una respuesta nueva, agrega un bloque en botReply() antes del "fallback" del final.
 * Si usas una API (VITE_API_URL), este bot responde primero (así conserva las acciones sobre la cesta y las
 * citas) y solo cuando no entiende (`fallback: true`) se le pregunta al servidor en POST /api/chat.
 */
import type { Booking, BotReply, Product } from "./types";
import { FREE_SHIPPING, SERVICES, SLOTS, money } from "./constants.ts";

export type BotCtx = {
  products: Product[];
  cart: Record<number, number>;
  total: number;
  /** Nombre de quien inició sesión (o null si es invitado). */
  userName: string | null;
  /** Solo las citas de quien está conectado. */
  bookings: Booking[];
};

export const DEFAULT_CHIPS = ["Agendar una cita", "Horarios", "Ver la tienda", "Mi carrito"];

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

const STOP = new Set([
  "anade", "anadir", "agrega", "agregar", "mete", "quiero", "compro", "comprar", "llevo", "dame", "carrito", "cesta",
  "precio", "cuesta", "cuanto", "vale", "sale", "para", "unos", "unas", "algo", "favor", "tienen", "tiene", "tienda",
  "producto", "productos", "hola", "buenas", "necesito", "busco", "cual", "cuales", "ver", "esta", "este",
]);

/** Productos cuyo nombre/categoría coincide mejor con lo escrito (varios si hay empate). */
function findProducts(t: string, products: Product[]): Product[] {
  const toks = t.split(/[^a-z0-9]+/).filter((w) => w.length >= 4 && !STOP.has(w));
  if (!toks.length) return [];
  let top = 0;
  let found: Product[] = [];
  for (const p of products) {
    const hay = norm(`${p.name} ${p.cat}`);
    const score = toks.filter((w) => hay.includes(w) || (w.endsWith("s") && hay.includes(w.slice(0, -1)))).length;
    if (score > top) { top = score; found = [p]; }
    else if (score === top && score > 0) found.push(p);
  }
  return found;
}

const NUM_WORDS: Record<string, number> = { dos: 2, tres: 3, cuatro: 4, cinco: 5 };
function qtyOf(t: string): number {
  const digits = t.match(/\b(\d{1,2})\b/);
  if (digits) return Math.min(10, Math.max(1, Number(digits[1])));
  const word = t.match(/\b(dos|tres|cuatro|cinco)\b/);
  return word ? NUM_WORDS[word[1]] : 1;
}

const shippingLine = (total: number) =>
  total >= FREE_SHIPPING ? "¡Ya tienes envío gratis!" : `Te faltan ${money(FREE_SHIPPING - total)} para el envío gratis.`;

const bullet = (p: Product) => `• ${p.name} — ${money(p.price)}`;

const CATS: [RegExp, string][] = [
  [/alimento|comida|croqueta|snack/, "Alimento"],
  [/juguete|pelota|raton|cuerda|rascador/, "Juguetes"],
  [/descanso|cama|dormir/, "Descanso"],
  [/paseo|collar|arnes|transportadora/, "Paseo"],
  [/higiene|shampoo|cepillo|bano/, "Higiene"],
  [/salud|dental/, "Salud"],
];

export function botReply(input: string, ctx: BotCtx): BotReply {
  const t = norm(input);
  const first = ctx.userName?.split(" ")[0] ?? null;
  const found = findProducts(t, ctx.products);

  // 1) Urgencias: siempre tienen prioridad.
  if (/emergenci|urgenci|urgente|envenen|intoxic|atropell|convuls|sangr|no respira|ahog|se desmay|veneno/.test(t)) {
    return {
      text: "Si tu mascota está en peligro, llévala ahora mismo a la clínica veterinaria más cercana: no esperes.\nEn el formulario de citas puedes elegir «Emergencia» para dejar registrada una atención inmediata.",
      // Sin "actions": el aviso debe poder leerse; la persona decide cuándo ir al formulario.
      chips: ["Agendar una cita", "Horarios"],
    };
  }

  // 2) Síntomas: no se diagnostica por chat.
  if (/vomit|diarrea|cojea|no come|\btos\b|fiebre|dolor|herida|pulga|garrapata|alergia|enferm|sintoma|decaid/.test(t)) {
    return {
      text: "Entiendo la preocupación. Por chat no puedo diagnosticar: lo más seguro es que lo vea un veterinario. Puedes reservar una consulta; y si empeora o es grave, acude a urgencias de inmediato.",
      chips: ["Agendar una cita", "Horarios"],
    };
  }

  // 3) Mis citas
  if (/mis citas|mi cita|citas que tengo|tengo (una )?cita|ver mis citas/.test(t)) {
    if (!ctx.userName) return { text: "Para ver tus citas necesitas iniciar sesión.", chips: ["Iniciar sesión"], actions: [{ type: "openAuth" }] };
    if (!ctx.bookings.length) return { text: "Aún no tienes citas guardadas. ¿Reservamos una?", chips: ["Agendar una cita"] };
    const lines = ctx.bookings.map((b) => `• ${b.pet} (${b.species}) · ${b.service} — ${b.date} ${b.time}`);
    return { text: `Estas son tus citas:\n${lines.join("\n")}`, chips: ["Agendar una cita", "Horarios"] };
  }

  // 4) Reservar cita
  if (/\b(cita|citas|reserv\w*|agend\w*|turno|consulta)\b/.test(t)) {
    return {
      text: `Reservar es fácil: elige servicio, día y hora (franjas de ${SLOTS[0]} a 17:00).${ctx.userName ? "" : "\nPara confirmar la cita necesitas iniciar sesión."}\nTe llevo al formulario.`,
      chips: ctx.userName ? ["Servicios", "Horarios"] : ["Iniciar sesión", "Servicios"],
      actions: [{ type: "goBooking" }],
    };
  }

  // 5) Horarios y ubicación
  if (/horario|a que hora|abren|cierran|abierto|atienden|dias de atencion/.test(t)) {
    return {
      text: `Atendemos de lunes a sábado. El horario exacto aún está por confirmar; las citas se reservan en franjas de ${SLOTS[0]} a 17:00.`,
      chips: ["Agendar una cita", "Servicios"],
    };
  }
  if (/donde (estan|queda|se ubican)|direccion|ubicacion|como llego|\bsede\b/.test(t)) {
    return { text: "La dirección exacta todavía no está publicada en esta web (aparece «Tu ciudad, Colombia»). Pronto la actualizaremos.", chips: ["Horarios", "Agendar una cita"] };
  }

  // 6) Añadir productos a la cesta
  if (/\b(anade|anadir|agrega|agregar|mete|quiero|compro|comprar|llevo|dame)\b/.test(t) && found.length) {
    if (found.length > 1) {
      return {
        text: `Encontré varias opciones, ¿cuál quieres?\n${found.slice(0, 4).map(bullet).join("\n")}${found.length > 4 ? `\n…y ${found.length - 4} más en la tienda.` : ""}`,
        chips: found.slice(0, 4).map((p) => `Añade ${p.name}`),
      };
    }
    const p = found[0];
    const qty = qtyOf(t);
    return {
      text: `¡Listo! Añadí ${qty} × ${p.name} (${money(p.price * qty)}) a tu cesta.\n${shippingLine(ctx.total + p.price * qty)}`,
      chips: ["Ver mi carrito", "Ver la tienda"],
      actions: [{ type: "add", id: p.id, qty }],
    };
  }

  // 7) Precios
  if (/cuanto (cuesta|vale|sale|cuestan)|precio|\bvale\b|cuesta/.test(t)) {
    if (found.length) {
      return {
        text: found.slice(0, 4).map(bullet).join("\n"),
        chips: found.slice(0, 3).map((p) => `Añade ${p.name}`),
      };
    }
    return { text: "¿De qué producto quieres saber el precio? Dime el nombre (por ejemplo «cama nido») o mira la tienda.", chips: ["Ver la tienda"] };
  }

  // 8) Carrito
  if (/carrito|cesta|mi pedido|mi compra|cuanto llevo|finalizar|pagar|checkout/.test(t)) {
    const lines = ctx.products.filter((p) => ctx.cart[p.id]).map((p) => `• ${ctx.cart[p.id]} × ${p.name} — ${money(p.price * ctx.cart[p.id])}`);
    if (!lines.length) return { text: "Tu cesta está vacía. ¿Te muestro la tienda?", chips: ["Ver la tienda"] };
    return {
      text: `Esto llevas en tu cesta:\n${lines.join("\n")}\nTotal: ${money(ctx.total)}. ${shippingLine(ctx.total)}`,
      chips: ["Ver la tienda"],
      actions: [{ type: "openCart" }],
    };
  }

  // 9) Envíos
  if (/envio|domicilio|despacho|entrega/.test(t)) {
    return { text: `El envío es gratis en pedidos desde ${money(FREE_SHIPPING)}. El costo de pedidos menores aún no está definido en esta versión de la web.`, chips: ["Ver la tienda", "Mi carrito"] };
  }

  // 10) Servicios
  if (/servicio|vacun|desparasit|bano|corte|peluquer|chequeo|que hacen|que ofrecen/.test(t) && !/shampoo|cepillo/.test(t)) {
    return {
      text: `Ofrecemos:\n${[...SERVICES, "Emergencia"].map((s) => `• ${s}`).join("\n")}\nTambién medicina preventiva y cuidado especializado.`,
      chips: ["Agendar una cita", "Horarios"],
    };
  }

  // 11) Tienda: categorías, mascotas y recomendaciones
  const pet = /\b(perro|perros|cachorro|can)\b/.test(t) ? "Perro" : /\b(gato|gatos|gatito|felino)\b/.test(t) ? "Gato" : null;
  const cat = CATS.find(([re]) => re.test(t))?.[1] ?? null;
  if (/ver la tienda|ir a la tienda|abre la tienda|llevame|catalogo|ir a tienda/.test(t)) {
    return { text: "¡Vamos a la tienda! 🐾", chips: ["Mi carrito"], actions: [{ type: "goShop" }] };
  }
  const generic = /tienda|producto|recomiend|sugier|regalo|que (venden|tienen|hay)/.test(t);
  // Si el mensaje nombra UN producto concreto, se responde con ese producto (bloque 15) y no con la categoría entera.
  if (generic || ((cat || (pet && /comprar|necesito|busco/.test(t))) && found.length !== 1)) {
    const list = ctx.products.filter((p) => (!cat || p.cat === cat) && (!pet || p.pet === pet || p.pet === "Todos"));
    if (list.length) {
      return {
        text: `${cat ? `En ${cat.toLowerCase()}` : "Te sugiero"}${pet ? ` para ${pet === "Perro" ? "perros" : "gatos"}` : ""}:\n${list.slice(0, 4).map(bullet).join("\n")}${list.length > 4 ? `\n…y ${list.length - 4} más en la tienda.` : ""}`,
        chips: ["Ver la tienda", ...list.slice(0, 2).map((p) => `Añade ${p.name}`)],
      };
    }
  }

  // 12) Cuenta
  if (/cuenta|sesion|registr|login|entrar|ingresar|iniciar/.test(t)) {
    if (ctx.userName) return { text: `Ya iniciaste sesión como ${first}. Tu cesta y tus favoritos son solo tuyos.`, chips: ["Mi carrito", "Mis citas"] };
    return { text: "Te abro el acceso para que entres o crees tu cuenta.", actions: [{ type: "openAuth" }] };
  }

  // 13) Identidad y ayuda
  if (/quien eres|como te llamas|tu nombre|que eres|eres un bot|eres real|eres humana/.test(t)) {
    return { text: "Soy Luma 🐶, la asistente virtual de Lúmina. Soy un programa: no puedo diagnosticar ni reemplazar a un veterinario, pero sí ayudarte con citas, servicios y la tienda.", chips: DEFAULT_CHIPS };
  }
  if (/ayuda|que puedes|que sabes|opciones|\bmenu\b/.test(t)) {
    return { text: "Puedo:\n• Reservar o revisar tus citas\n• Contarte horarios y servicios\n• Buscar productos, decirte precios y añadirlos a tu cesta\n• Llevarte a la tienda o a tu carrito", chips: DEFAULT_CHIPS };
  }

  // 14) Cortesía
  if (/\b(gracias|thanks)\b/.test(t)) return { text: "¡Con gusto! 🐾 Si necesitas algo más, aquí estoy.", chips: DEFAULT_CHIPS };
  if (/\b(adios|chao|hasta luego|nos vemos)\b/.test(t)) return { text: "¡Hasta pronto! Un abrazo para tu peludo 🐾" };
  if (/\b(hola|buenas|buenos dias|buenas tardes|buenas noches|hey|saludos)\b/.test(t)) {
    return { text: `¡Guau, hola${first ? ` ${first}` : ""}! 🐶 ¿En qué te ayudo?`, chips: DEFAULT_CHIPS };
  }

  // 15) Solo el nombre de un producto
  if (found.length === 1) {
    const p = found[0];
    return { text: `${p.name} — ${money(p.price)}\n${p.desc}`, chips: [`Añade ${p.name}`, "Ver la tienda"] };
  }

  // Fallback
  return { text: "No estoy segura de haberte entendido 🐾. Puedo ayudarte con citas, horarios, servicios y la tienda.", chips: DEFAULT_CHIPS, fallback: true };
}
