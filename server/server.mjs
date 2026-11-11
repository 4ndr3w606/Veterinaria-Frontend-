// Servidor de ejemplo para la web de Lúmina. Sin dependencias: solo Node 20+.
//   npm run api        (arranca en http://localhost:3001)
//
// Usa el MISMO catálogo que el frontend (src/data/products.json), así que editas los productos en un solo lugar.
// Cuando tengas una base de datos real, reemplaza las partes marcadas con "BD:" y deja las rutas igual.
import { createServer } from "node:http";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

const PORT = Number(process.env.PORT ?? 3001);
// Orígenes del frontend autorizados (separados por coma). En producción pon tu dominio.
const ALLOWED = (process.env.CORS_ORIGIN ?? "http://localhost:5173,http://127.0.0.1:5173").split(",").map((s) => s.trim());

// BD: aquí cargarías los productos desde tu base de datos.
const products = JSON.parse(readFileSync(new URL("../src/data/products.json", import.meta.url), "utf8"));

// BD: aquí guardarías los pedidos en tu base de datos. Por ahora se guardan en server/data/orders.json.
const DATA_DIR = new URL("./data/", import.meta.url);
const ORDERS_FILE = new URL("./data/orders.json", import.meta.url);
const orders = existsSync(ORDERS_FILE) ? JSON.parse(readFileSync(ORDERS_FILE, "utf8")) : [];
const saveOrders = () => {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
};

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const norm = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function send(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 100_000) throw new HttpError(413, "Solicitud demasiado grande");
  }
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    throw new HttpError(400, "JSON inválido");
  }
}

// Límite sencillo: 60 solicitudes POST por minuto y por IP.
const hits = new Map();
function limit(req) {
  const ip = req.socket.remoteAddress ?? "?";
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now > h.reset) hits.set(ip, { n: 1, reset: now + 60_000 });
  else if (++h.n > 60) throw new HttpError(429, "Demasiadas solicitudes, espera un momento");
}

// ---------- Pedidos ----------
function createOrder(body) {
  const email = body.email == null ? null : String(body.email).trim().slice(0, 200);
  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 50) {
    throw new HttpError(400, "El pedido debe tener entre 1 y 50 productos");
  }
  let total = 0;
  const lines = body.items.map((l) => {
    const qty = Number(l?.qty);
    const product = products.find((p) => p.id === Number(l?.id));
    if (!product) throw new HttpError(400, `Producto inexistente: ${l?.id}`);
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) throw new HttpError(400, "Cantidad inválida");
    // El precio SIEMPRE sale del catálogo del servidor, nunca de lo que envía el navegador.
    total += product.price * qty;
    return { id: product.id, name: product.name, price: product.price, qty };
  });
  const order = { id: randomUUID().slice(0, 8).toUpperCase(), email, items: lines, total, createdAt: new Date().toISOString() };
  orders.push(order);
  saveOrders();
  return { id: order.id, total: order.total, createdAt: order.createdAt };
}

// ---------- Chat ----------
// Punto de extensión: aquí puedes llamar a un modelo de IA. Guarda la clave en process.env (por ejemplo
// en un .env del SERVIDOR) y nunca en el frontend: todo lo que está en src/ lo puede leer cualquier visitante.
async function answer(message) {
  const t = norm(message);
  if (/emergencia|urgente|envenen|atropell|sangr|convuls|no respira/.test(t)) {
    return {
      text: "Si tu mascota está en peligro, llévala ya a la clínica veterinaria más cercana. En el formulario de citas puedes elegir «Emergencia» para atención inmediata.",
      chips: ["Agendar una cita", "Horarios"],
    };
  }
  if (/horario|abren|cierran|atienden/.test(t)) {
    return { text: "Atendemos de lunes a sábado. El horario exacto aún está por confirmar; las citas se reservan en franjas de 9:00 a 17:00." };
  }
  if (/cita|reserv|agendar/.test(t)) {
    return { text: "Puedes reservar tu cita en el formulario de la página de inicio. Elige servicio, día y hora.", actions: [{ type: "goBooking" }] };
  }
  if (/tienda|producto|comprar|catalogo/.test(t)) {
    return { text: "Tenemos alimento, juguetes, descanso, paseo, higiene y salud. Te llevo a la tienda.", actions: [{ type: "goShop" }] };
  }
  return {
    text: "Puedo ayudarte con citas, horarios, servicios y la tienda. ¿Qué necesitas?",
    chips: ["Agendar una cita", "Horarios", "Ver la tienda"],
  };
}

// ---------- Rutas ----------
const server = createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  try {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (req.method === "GET" && path === "/api/health") return send(res, 200, { ok: true });

    if (req.method === "GET" && path === "/api/products") {
      const cat = url.searchParams.get("cat");
      const pet = url.searchParams.get("pet");
      const q = norm(url.searchParams.get("q") ?? "");
      const list = products.filter(
        (p) =>
          (!cat || p.cat === cat) &&
          (!pet || p.pet === pet || p.pet === "Todos") &&
          norm(`${p.name} ${p.desc}`).includes(q),
      );
      return send(res, 200, { products: list });
    }

    const one = path.match(/^\/api\/products\/(\d+)$/);
    if (req.method === "GET" && one) {
      const p = products.find((x) => x.id === Number(one[1]));
      if (!p) throw new HttpError(404, "Producto no encontrado");
      return send(res, 200, p);
    }

    if (req.method === "POST" && path === "/api/orders") {
      limit(req);
      return send(res, 201, createOrder(await readJson(req)));
    }

    if (req.method === "POST" && path === "/api/chat") {
      limit(req);
      const body = await readJson(req);
      const message = String(body.message ?? "").trim().slice(0, 500);
      if (!message) throw new HttpError(400, "Falta el mensaje");
      return send(res, 200, await answer(message));
    }

    throw new HttpError(404, "No encontrado");
  } catch (e) {
    if (e instanceof HttpError) return send(res, e.status, { error: e.message });
    console.error(e);
    send(res, 500, { error: "Error interno" });
  }
});

server.listen(PORT, () => console.log(`API de Lúmina lista en http://localhost:${PORT}  (${products.length} productos)`));
