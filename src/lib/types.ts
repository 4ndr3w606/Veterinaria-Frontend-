export type Pet = "Perro" | "Gato" | "Todos";

export type Product = {
  id: number;
  name: string;
  cat: string;
  /** Para qué mascota es el producto (sirve para el filtro de la tienda). */
  pet: Pet;
  price: number;
  image: string;
  /** GIF opcional: se reproduce al pasar el cursor por la tarjeta. */
  gif?: string;
  desc: string;
  featured?: boolean;
  /** Etiqueta opcional sobre la imagen ("Nuevo", etc.). */
  tag?: string;
};

export type Booking = { id: string; email: string; pet: string; species: string; service: string; date: string; time: string };
export type Account = { name: string; email: string; pass: string };

/** Carrito: id de producto -> cantidad. */
export type Cart = Record<number, number>;

export type OrderLine = { id: number; qty: number };
/** El cliente solo envía ids y cantidades; el total lo calcula el servidor. */
export type OrderInput = { email: string | null; items: OrderLine[] };
export type OrderResult = { id: string; total: number; createdAt: string };

/** Acciones que el chatbot puede ejecutar dentro de la web. */
export type BotAction =
  | { type: "add"; id: number; qty: number }
  | { type: "openCart" }
  | { type: "openAuth" }
  | { type: "goShop" }
  | { type: "goHome" }
  | { type: "goBooking" };

/** `fallback: true` = el bot local no entendió; si hay API, se le pregunta al servidor. */
export type BotReply = { text: string; chips?: string[]; actions?: BotAction[]; fallback?: boolean };
export type ChatTurn = { from: "bot" | "me"; text: string };
