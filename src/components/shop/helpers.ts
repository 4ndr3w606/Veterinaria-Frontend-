import type { Pet, Product } from "@/lib/types";

export type PetFilter = "Todos" | Pet;

/** Opciones del selector de mascota de la tienda. */
export const PET_FILTERS: { value: PetFilter; label: string }[] = [
  { value: "Todos", label: "Todos" },
  { value: "Perro", label: "Perros" },
  { value: "Gato", label: "Gatos" },
];

/** Un producto "para todos" aparece tanto en perros como en gatos. */
export const matchesPet = (p: Product, pet: PetFilter) => pet === "Todos" || p.pet === pet || p.pet === "Todos";

export const petLabel = (p: Product) => (p.pet === "Perro" ? "Perros" : p.pet === "Gato" ? "Gatos" : "Perros y gatos");

export const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
