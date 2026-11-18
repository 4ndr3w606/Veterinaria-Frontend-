import { EMERGENCY_TIME } from "@/lib/constants";
import type { Booking, BookingAvailability, BotAction, BotReply, OrderResult, Product } from "@/lib/types";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
const isOptionalString = (value: unknown) => value === undefined || typeof value === "string";
const isOptionalBoolean = (value: unknown) => value === undefined || typeof value === "boolean";
const isPositiveInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value > 0;
const isAmount = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

function isDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^(?!0000)\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00.000Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const isTime = (value: unknown): value is string =>
  typeof value === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);

function isTimestamp(value: unknown): value is string {
  return typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(value) &&
    isDate(value.slice(0, 10)) &&
    Number.isFinite(Date.parse(value));
}

export function isBooking(value: unknown): value is Booking {
  return isRecord(value) &&
    isText(value.id) &&
    isText(value.pet) &&
    isText(value.species) &&
    isText(value.service) &&
    isDate(value.date) &&
    (isTime(value.time) || value.time === EMERGENCY_TIME) &&
    isOptionalString(value.email) &&
    isOptionalString(value.reason);
}

export function isBookingsResponse(value: unknown): value is { bookings: Booking[] } {
  return isRecord(value) &&
    Array.isArray(value.bookings) &&
    value.bookings.every(isBooking) &&
    new Set(value.bookings.map((booking) => booking.id)).size === value.bookings.length;
}

export function isBookingAvailability(value: unknown): value is BookingAvailability {
  return isRecord(value) &&
    isDate(value.date) &&
    Array.isArray(value.unavailableSlots) &&
    value.unavailableSlots.every(isTime);
}

function isProduct(value: unknown): value is Product {
  return isRecord(value) &&
    isPositiveInteger(value.id) &&
    isText(value.name) &&
    isText(value.cat) &&
    (value.pet === "Perro" || value.pet === "Gato" || value.pet === "Todos") &&
    isAmount(value.price) &&
    typeof value.image === "string" &&
    typeof value.desc === "string" &&
    isOptionalString(value.gif) &&
    isOptionalString(value.tag) &&
    isOptionalBoolean(value.featured);
}

export function isProductsResponse(value: unknown): value is { products: Product[] } {
  return isRecord(value) &&
    Array.isArray(value.products) &&
    value.products.every(isProduct) &&
    new Set(value.products.map((product) => product.id)).size === value.products.length;
}

export function isOrderResult(value: unknown): value is OrderResult {
  return isRecord(value) &&
    isText(value.id) &&
    isAmount(value.total) &&
    isTimestamp(value.createdAt);
}

function isBotAction(value: unknown): value is BotAction {
  if (!isRecord(value)) return false;
  switch (value.type) {
    case "add":
      return isPositiveInteger(value.id) && isPositiveInteger(value.qty);
    case "openCart":
    case "openAuth":
    case "goShop":
    case "goHome":
    case "goBooking":
      return true;
    default:
      return false;
  }
}

export function isBotReply(value: unknown): value is BotReply {
  return isRecord(value) &&
    isText(value.text) &&
    (value.chips === undefined || (Array.isArray(value.chips) && value.chips.every((chip) => typeof chip === "string"))) &&
    (value.actions === undefined || (Array.isArray(value.actions) && value.actions.every(isBotAction))) &&
    isOptionalBoolean(value.fallback);
}

export const isEmptyResponse = (value: unknown): value is undefined => value === undefined;
