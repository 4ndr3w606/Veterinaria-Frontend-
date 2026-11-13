/** Envío gratis a partir de este valor (COP). */
export const FREE_SHIPPING = 150000;

export const SERVICES = ["Consulta", "Vacunación", "Baño y corte", "Desparasitación"];
export const SLOTS = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];

/** Emoji de cada categoría: se usa cuando un producto aún no tiene foto. */
export const CAT_EMOJI: Record<string, string> = {
  Alimento: "🍖",
  Juguetes: "🎾",
  Descanso: "🛏️",
  Paseo: "🦮",
  Higiene: "🧴",
  Salud: "🩺",
};

export const money = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

export const EMERGENCY_TIME = "Atención Inmediata"
