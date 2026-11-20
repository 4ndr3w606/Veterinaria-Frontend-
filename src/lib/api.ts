/**
 * Acceso a los datos del frontend.
 *
 * Sin VITE_API_URL ni VITE_BOOKINGS_API_URL, catálogo, pedidos y reservas funcionan en modo local.
 * VITE_BOOKINGS_API_URL permite conectar reservas de forma independiente; si no está definido,
 * se reutiliza VITE_API_URL.
 */
import seed from "@/data/products.json";
import {
  isBooking,
  isBookingAvailability,
  isBookingsResponse,
  isEmptyResponse,
  isOrderResult,
  isOrdersResponse,
  isProductsResponse,
  isRecord,
} from "@/lib/apiValidation";
import { shippingCost } from "@/lib/checkout";
import { EMERGENCY_TIME } from "@/lib/constants";
import { getLocalStorageItem, setLocalStorageItem } from "@/lib/safeStorage";
import type {
  Booking,
  BookingAvailability,
  BookingInput,
  OrderInput,
  OrderRecord,
  OrderResult,
  Product,
} from "@/lib/types";

const BASE = String(import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
const BOOKINGS_BASE = String(import.meta.env.VITE_BOOKINGS_API_URL ?? BASE).replace(/\/+$/, "");
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

function invalidResponse(status: number) {
  return new ApiError(
    "La API devolvió datos con un formato inesperado.",
    status,
    "INVALID_API_RESPONSE",
  );
}

async function http<T>(
  path: string,
  validate: (value: unknown) => value is T,
  init?: RequestInit,
  base = BASE,
): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(base + path, {
      ...init,
      signal: ctrl.signal,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
    if (!res.ok) {
      const payload: unknown = await res.json().catch(() => null);
      const error = isRecord(payload) ? payload.error : undefined;
      const message = typeof error === "string" ? error : isRecord(error) ? error.message : undefined;
      const code = isRecord(error) ? error.code : undefined;
      throw new ApiError(
        typeof message === "string" && message.trim() ? message : "Error de la API (HTTP " + res.status + ").",
        res.status,
        typeof code === "string" ? code : undefined,
      );
    }

    let payload: unknown;
    try {
      payload = res.status === 204 ? undefined : await res.json();
    } catch (error) {
      if (error instanceof SyntaxError) throw invalidResponse(res.status);
      throw error;
    }
    if (!validate(payload)) throw invalidResponse(res.status);
    return payload;
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

type LocalOrder = OrderRecord & { email: string | null };

/** Pedidos guardados en modo local. Se descartan uno a uno los registros antiguos o dañados. */
function readLocalOrders(): LocalOrder[] {
  try {
    const value: unknown = JSON.parse(getLocalStorageItem("lumina:orders") ?? "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((order): order is LocalOrder =>
      isOrdersResponse({ orders: [order] }) && (order.email === null || typeof order.email === "string"));
  } catch {
    return [];
  }
}

function saveLocalBookings(bookings: Booking[]) {
  setLocalStorageItem(BOOKINGS_KEY, JSON.stringify(bookings));
}

export const api = {
  /** true cuando hay una API general configurada en VITE_API_URL. */
  remote: BASE !== "",

  async getProducts(): Promise<Product[]> {
    if (!BASE) return catalog;
    const data = await http("/api/products", isProductsResponse);
    return data.products;
  },

  async createOrder(order: OrderInput): Promise<OrderResult> {
    if (BASE) return http("/api/orders", isOrderResult, { method: "POST", body: JSON.stringify(order) });

    // Simulación: una breve espera imita la latencia de red y del procesamiento del pago.
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const subtotal = order.items.reduce(
      (sum, line) => sum + (catalog.find((product) => product.id === line.id)?.price ?? 0) * line.qty,
      0,
    );
    const result: OrderResult = {
      id: crypto.randomUUID().slice(0, 8).toUpperCase(),
      total: subtotal + shippingCost(subtotal, order.delivery.method),
      createdAt: new Date().toISOString(),
    };
    try {
      const list = JSON.parse(getLocalStorageItem("lumina:orders") ?? "[]") as unknown[];
      // No se guardan nombre, documento, teléfono ni dirección en el navegador: solo el resumen del pedido.
      list.push({ ...result, email: order.email, items: order.items, delivery: order.delivery.method, payment: order.payment });
      setLocalStorageItem("lumina:orders", JSON.stringify(list));
    } catch {
      // El pedido de demostración se acepta aunque el navegador no permita persistirlo.
    }
    return result;
  },

  /** Pedidos de la cuenta, del más reciente al más antiguo. */
  async getOrders(ownerEmail: string): Promise<OrderRecord[]> {
    const list = BASE
      ? (await http("/api/orders", isOrdersResponse)).orders
      : readLocalOrders().filter((order) => order.email === ownerEmail);
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async getBookings(ownerEmail: string): Promise<Booking[]> {
    if (BOOKINGS_BASE) {
      const data = await http("/api/bookings", isBookingsResponse, undefined, BOOKINGS_BASE);
      return data.bookings;
    }
    return readLocalBookings().filter((booking) => booking.email === ownerEmail);
  },

  async getBookingAvailability(date: string): Promise<BookingAvailability> {
    if (BOOKINGS_BASE) {
      return http(
        "/api/bookings/availability?date=" + encodeURIComponent(date),
        (value): value is BookingAvailability => isBookingAvailability(value) && value.date === date,
        undefined,
        BOOKINGS_BASE,
      );
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
    if (BOOKINGS_BASE) {
      return http(
        "/api/bookings",
        isBooking,
        { method: "POST", body: JSON.stringify(input) },
        BOOKINGS_BASE,
      );
    }
    const bookings = readLocalBookings();
    const conflict =
      input.time !== EMERGENCY_TIME &&
      bookings.some((booking) => booking.date === input.date && booking.time === input.time);
    if (conflict) throw new ApiError("Ese horario ya está ocupado.", 409, "SLOT_UNAVAILABLE");

    const booking: Booking = { ...input, id: crypto.randomUUID(), email: ownerEmail };
    saveLocalBookings([...bookings, booking]);
    return booking;
  },

  async cancelBooking(id: string, ownerEmail: string): Promise<void> {
    if (BOOKINGS_BASE) {
      await http(
        "/api/bookings/" + encodeURIComponent(id),
        isEmptyResponse,
        { method: "DELETE" },
        BOOKINGS_BASE,
      );
      return;
    }
    const bookings = readLocalBookings();
    const exists = bookings.some((booking) => booking.id === id && booking.email === ownerEmail);
    if (!exists) throw new ApiError("No encontramos esa cita.", 404, "BOOKING_NOT_FOUND");
    saveLocalBookings(bookings.filter((booking) => booking.id !== id));
  },


};