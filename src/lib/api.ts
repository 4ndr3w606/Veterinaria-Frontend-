/**
 * Acceso a los datos del frontend.
 *
 * Sin VITE_API_URL, catálogo, pedidos y reservas funcionan en modo local.
 * Con VITE_API_URL, las operaciones remotas usan la misma API y sesión autenticada.
 * El chatbot conserva su respuesta local y solo consulta la API para fallbacks.
 */
import seed from "@/data/products.json";
import { EMERGENCY_TIME } from "@/lib/constants";
import { getLocalStorageItem, setLocalStorageItem } from "@/lib/safeStorage";
import type {
  Booking,
  BookingAvailability,
  BookingInput,
  BotReply,
  ChatTurn,
  OrderInput,
  OrderResult,
  Product,
} from "@/lib/types";

const BASE = String(import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
const catalog = seed as unknown as Product[];
const BOOKINGS_KEY = "lumina:bookings";

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(BASE + path, {
      ...init,
      signal: ctrl.signal,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      const error = payload?.error;
      throw new ApiError(
        typeof error?.message === "string" ? error.message : "Error de la API (HTTP " + res.status + ").",
        res.status,
        typeof error?.code === "string" ? error.code : undefined,
      );
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

function readLocalBookings(): Booking[] {
  try {
    const value: unknown = JSON.parse(getLocalStorageItem(BOOKINGS_KEY) ?? "[]");
    if (!Array.isArray(value)) return [];
    return value.filter(
      (item): item is Booking =>
        item !== null &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        typeof item.email === "string" &&
        typeof item.pet === "string" &&
        typeof item.species === "string" &&
        typeof item.service === "string" &&
        typeof item.date === "string" &&
        typeof item.time === "string",
    );
  } catch {
    return [];
  }
}

function saveLocalBookings(bookings: Booking[]) {
  setLocalStorageItem(BOOKINGS_KEY, JSON.stringify(bookings));
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

    const total = order.items.reduce((sum, line) => sum + (catalog.find((product) => product.id === line.id)?.price ?? 0) * line.qty, 0);
    const result: OrderResult = { id: crypto.randomUUID().slice(0, 8).toUpperCase(), total, createdAt: new Date().toISOString() };
    try {
      const list = JSON.parse(getLocalStorageItem("lumina:orders") ?? "[]") as unknown[];
      list.push({ ...result, ...order });
      setLocalStorageItem("lumina:orders", JSON.stringify(list));
    } catch {
      // El pedido de demostración se acepta aunque el navegador no permita persistirlo.
    }
    return result;
  },

  async getBookings(ownerEmail: string): Promise<Booking[]> {
    if (BASE) {
      const data = await http<{ bookings: Booking[] }>("/api/bookings");
      return data.bookings;
    }
    return readLocalBookings().filter((booking) => booking.email === ownerEmail);
  },

  async getBookingAvailability(date: string): Promise<BookingAvailability> {
    if (BASE) {
      return http<BookingAvailability>("/api/bookings/availability?date=" + encodeURIComponent(date));
    }
    const unavailableSlots = Array.from(
      new Set(
        readLocalBookings()
          .filter((booking) => booking.date === date && booking.time !== EMERGENCY_TIME)
          .map((booking) => booking.time),
      ),
    );
    return { date, unavailableSlots };
  },

  async createBooking(input: BookingInput, ownerEmail: string): Promise<Booking> {
    if (BASE) {
      return http<Booking>("/api/bookings", { method: "POST", body: JSON.stringify(input) });
    }
    const bookings = readLocalBookings();
    const conflict = input.time !== EMERGENCY_TIME &&
      bookings.some((booking) => booking.date === input.date && booking.time === input.time);
    if (conflict) throw new ApiError("Ese horario ya está ocupado.", 409, "SLOT_UNAVAILABLE");

    const booking: Booking = { ...input, id: crypto.randomUUID(), email: ownerEmail };
    saveLocalBookings([...bookings, booking]);
    return booking;
  },

  async cancelBooking(id: string, ownerEmail: string): Promise<void> {
    if (BASE) {
      await http<void>("/api/bookings/" + encodeURIComponent(id), { method: "DELETE" });
      return;
    }
    const bookings = readLocalBookings();
    const exists = bookings.some((booking) => booking.id === id && booking.email === ownerEmail);
    if (!exists) throw new ApiError("No encontramos esa cita.", 404, "BOOKING_NOT_FOUND");
    saveLocalBookings(bookings.filter((booking) => booking.id !== id));
  },

  /** Solo se consulta si hay API remota y el bot local no sabe qué responder. */
  chat(message: string, history: ChatTurn[]): Promise<BotReply> {
    return http<BotReply>("/api/chat", { method: "POST", body: JSON.stringify({ message, history }) });
  },
};
