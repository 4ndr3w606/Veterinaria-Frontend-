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
// Mismos valores que src/lib/constants.ts (FREE_SHIPPING y SHIPPING_COST). BD: muévelos a la configuración del servidor.
const FREE_SHIPPING = 150000;
const SHIPPING_COST = 12000;
const DELIVERY = ["domicilio", "recoger"];
const PAYMENT = ["contraentrega", "tarjeta", "pse"];

const str = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");

// Validación mínima: el formulario del frontend ya valida formatos, pero el servidor nunca debe confiar en el navegador.
function readDetails(body) {
  const c = body.customer ?? {};
  const customer = {
    name: str(c.name, 80), email: str(c.email, 120), phone: str(c.phone, 10),
    docType: str(c.docType, 3), docNumber: str(c.docNumber, 12),
  };
  if (!customer.name || !customer.email.includes("@") || !/^3\d{9}$/.test(customer.phone) || !customer.docNumber) {
    throw new HttpError(400, "Faltan datos de contacto válidos");
  }
  const d = body.delivery ?? {};
  if (!DELIVERY.includes(d.method)) throw new HttpError(400, "Método de entrega inválido");
  const delivery = { method: d.method, notes: str(d.notes, 200) || undefined };
  if (d.method === "domicilio") {
    Object.assign(delivery, {
      department: str(d.department, 40), city: str(d.city, 60), address: str(d.address, 100),
      neighborhood: str(d.neighborhood, 60), addressExtra: str(d.addressExtra, 60) || undefined,
    });
    if (!delivery.department || !delivery.city || !delivery.address || !delivery.neighborhood) {
      throw new HttpError(400, "Faltan datos de la dirección de entrega");
    }
  }
  if (!PAYMENT.includes(body.payment)) throw new HttpError(400, "Método de pago inválido");
  return { customer, delivery, payment: body.payment };
}

function createOrder(body) {
  const email = body.email == null ? null : String(body.email).trim().slice(0, 200);
  const details = readDetails(body);
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
  const shipping = details.delivery.method === "recoger" || total >= FREE_SHIPPING ? 0 : SHIPPING_COST;
  total += shipping;
  const order = { id: randomUUID().slice(0, 8).toUpperCase(), email, items: lines, shipping, total, ...details, createdAt: new Date().toISOString() };
  orders.push(order);
  saveOrders();
  return { id: order.id, total: order.total, createdAt: order.createdAt };
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

    throw new HttpError(404, "No encontrado");
  } catch (e) {
    if (e instanceof HttpError) return send(res, e.status, { error: e.message });
    console.error(e);
    send(res, 500, { error: "Error interno" });
  }
});

server.listen(PORT, () => console.log(`API de Lúmina lista en http://localhost:${PORT}  (${products.length} productos)`));
