import type { DeliveryMethod, OrderDetails, PaymentMethod } from "@/lib/checkout";

export type Pet = "Perro" | "Gato" | "Todos";

export type Product = {
  id: number;
  name: string;
  cat: string;
  /** Para qué mascota es el producto (sirve para el filtro de la tienda). */
  pet: Pet;
  price: number;
  image: string;
  desc: string;
  featured?: boolean;
  /** Etiqueta opcional sobre la imagen ("Nuevo", etc.). */
  tag?: string;
};

export type BookingInput = { pet: string; species: string; service: string; date: string; time: string; reason?: string };
export type Booking = BookingInput & { id: string; email?: string };
export type BookingAvailability = { date: string; unavailableSlots: string[] };
export type Account = { name: string; email: string; pass: string };
export type User = Pick<Account, "name" | "email">;

/** Carrito: id de producto -> cantidad. */
export type Cart = Record<number, number>;

export type OrderLine = { id: number; qty: number };
/**
 * El cliente envía ids, cantidades y los datos de entrega; el total (productos + envío) lo calcula el servidor.
 * `email` es la cuenta que compra (null para invitados); el correo de contacto va en `customer`.
 */
export type OrderInput = { email: string | null; items: OrderLine[] } & OrderDetails;
export type OrderResult = { id: string; total: number; createdAt: string };
/** Pedido tal como aparece en «Mi cuenta». Sin datos personales: solo el resumen. */
export type OrderRecord = OrderResult & {
  items: OrderLine[];
  delivery: DeliveryMethod;
  payment: PaymentMethod;
};

/** Luma solo abre secciones; no modifica compras ni reservas. */
export type BotAction = "openCart" | "openAuth" | "goShop" | "goBooking";
export type BotReply = { text: string; chips?: string[]; action?: BotAction };