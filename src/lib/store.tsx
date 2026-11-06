import { createContext, useContext, useEffect, useState, type ReactNode, type MouseEvent } from "react";

export type Product = { id: number; name: string; cat: string; price: number; image: string; desc: string; featured?: boolean };
export type Booking = { id: string; email: string; pet: string; species: string; service: string; date: string; time: string };
type Account = { name: string; email: string; pass: string };

export const PRODUCTS: Product[] = [
  { id: 1, name: "Croquetas Dog Chow", cat: "Alimento", price: 23550, image: "/productos/croquetas_perro.jpg", desc: "Proteína real, sin colorantes." },
  { id: 2, name: "Snacks de zanahoria", cat: "Alimento", price: 18000, image: "/productos/zanahoria.jpg", desc: "Crujientes y horneados." },
  { id: 3, name: "Pelota interactiva para gatos", cat: "Juguetes", price: 16200, image: "/productos/pelota_interactiva.jpg", desc: "Brilla en la oscuridad." },
  { id: 4, name: "Ratón de catnip", cat: "Juguetes", price: 12000, image: "/productos/raton.jpg", desc: "Para gatos cazadores." },
  { id: 5, featured: true, name: "Cama nido", cat: "Descanso", price: 135000, image: "/productos/cama_nido.jpg", desc: "Felpa suave, lavable." },
  { id: 6, name: "Collar reflectivo", cat: "Paseo", price: 32000, image: "/productos/collar.jpg", desc: "Visible de noche." },
  { id: 7, name: "Shampoo de avena", cat: "Higiene", price: 28000, image: "/productos/shampoo.jpg", desc: "Piel sensible." },
  { id: 8, name: "Cepillo suave", cat: "Higiene", price: 21000, image: "/productos/cepillo_suave.jpg", desc: "Sin enredos ni tirones." },
];
export const FREE_SHIPPING = 150000;
export const SERVICES = ["Consulta", "Vacunación", "Baño y corte", "Desparasitación"];
export const SLOTS = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];
export const money = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

/** Pasa el cursor a --mx/--my para que .glow-card se ilumine */
export const glow = (e: MouseEvent<HTMLElement>) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
};

const read = <T,>(k: string, d: T): T => { try { return (JSON.parse(localStorage.getItem(k) ?? "") as T) ?? d; } catch { return d; } };

type Ctx = {
  user: Account | null; cart: Record<number, number>; count: number; total: number; bookings: Booking[];
  authOpen: boolean; cartOpen: boolean; setAuthOpen: (v: boolean) => void; setCartOpen: (v: boolean) => void;
  login: (email: string, pass: string) => string | null; register: (name: string, email: string, pass: string) => string | null; logout: () => void;
  add: (id: number) => void; setQty: (id: number, q: number) => void; checkout: () => void;
  book: (b: Omit<Booking, "id" | "email">) => string | null; cancel: (id: string) => void;
};
const C = createContext<Ctx>(null!);
export const useStore = () => useContext(C);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>(() => read("lumina:accounts", []));
  const [user, setUser] = useState<Account | null>(() => read("lumina:user", null));
  const [cart, setCart] = useState<Record<number, number>>(() => read("lumina:cart", {}));
  const [bookings, setBookings] = useState<Booking[]>(() => read("lumina:bookings", []));
  const [authOpen, setAuthOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => { localStorage.setItem("lumina:accounts", JSON.stringify(accounts)); }, [accounts]);
  useEffect(() => { localStorage.setItem("lumina:user", JSON.stringify(user)); }, [user]);
  useEffect(() => { localStorage.setItem("lumina:cart", JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem("lumina:bookings", JSON.stringify(bookings)); }, [bookings]);

  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const total = PRODUCTS.reduce((s, p) => s + p.price * (cart[p.id] ?? 0), 0);

  const value: Ctx = {
    user, cart, count, total, bookings, authOpen, cartOpen, setAuthOpen, setCartOpen,
    // DEMO: contraseñas en localStorage. En producción usa un backend (Supabase, Firebase, etc.).
    register: (name, email, pass) => {
      if (accounts.some((a) => a.email === email)) return "Ese correo ya tiene cuenta. Inicia sesión.";
      if (pass.length < 6) return "La contraseña necesita al menos 6 caracteres.";
      const a = { name, email, pass };
      setAccounts([...accounts, a]); setUser(a); return null;
    },
    login: (email, pass) => {
      const a = accounts.find((x) => x.email === email && x.pass === pass);
      if (!a) return "Correo o contraseña incorrectos.";
      setUser(a); return null;
    },
    logout: () => setUser(null),
    add: (id) => setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 })),
    setQty: (id, q) => setCart((c) => { const n = { ...c }; if (q <= 0) delete n[id]; else n[id] = q; return n; }),
    checkout: () => setCart({}),
    book: (b) => {
      if (!user) return "Inicia sesión para reservar.";
      if (bookings.some((x) => x.date === b.date && x.time === b.time)) return "Ese horario ya está ocupado.";
      setBookings([...bookings, { ...b, id: crypto.randomUUID(), email: user.email }]); return null;
    },
    cancel: (id) => setBookings((l) => l.filter((x) => x.id !== id)),
  };
  return <C.Provider value={value}>{children}</C.Provider>;
}