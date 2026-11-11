/**
 * Capa de API de la web.
 *
 * - SIN configurar nada funciona en "modo local": el catálogo sale de src/data/products.json,
 *   los pedidos se guardan en localStorage y el chat lo responde el bot del navegador (src/lib/bot.ts).
 * - Para usar un servidor real, crea un archivo .env con:   VITE_API_URL=http://localhost:3001
 *   y arranca el servidor de ejemplo con:                   npm run api
 *
 * Contrato que debe cumplir tu servidor (ver server/README.md):
 *   GET  /api/products  -> { products: Product[] }
 *   POST /api/orders    -> { id, total, createdAt }      (body: { email, items: [{ id, qty }] })
 *   POST /api/chat      -> { text, chips?, actions? }    (body: { message, history })
 */
import seed from "@/data/products.json";
import type { BotReply, ChatTurn, OrderInput, OrderResult, Product } from "@/lib/types";

const BASE = String(import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
const catalog = seed as unknown as Product[];

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(BASE + path, {
      ...init,
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  /** true cuando hay una API configurada en VITE_API_URL. */
  remote: BASE !== "",

  async getProducts(): Promise<Product[]> {
    if (!BASE) return catalog;
    const data = await http<{ products: Product[] }>("/api/products");
    return data.products;
  },

  async createOrder(order: OrderInput): Promise<OrderResult> {
    if (BASE) return http<OrderResult>("/api/orders", { method: "POST", body: JSON.stringify(order) });

    // Modo local: calcula el total y guarda el pedido en el navegador.
    const total = order.items.reduce((sum, l) => sum + (catalog.find((p) => p.id === l.id)?.price ?? 0) * l.qty, 0);
    const result: OrderResult = { id: crypto.randomUUID().slice(0, 8).toUpperCase(), total, createdAt: new Date().toISOString() };
    try {
      const list = JSON.parse(localStorage.getItem("lumina:orders") ?? "[]") as unknown[];
      list.push({ ...result, ...order });
      localStorage.setItem("lumina:orders", JSON.stringify(list));
    } catch {
      /* si localStorage no está disponible, el pedido igual se considera recibido en la demo */
    }
    return result;
  },

  /** Solo se usa si hay API remota y el bot local (src/lib/bot.ts) no supo qué responder. */
  chat(message: string, history: ChatTurn[]): Promise<BotReply> {
    return http<BotReply>("/api/chat", { method: "POST", body: JSON.stringify({ message, history }) });
  },
};
