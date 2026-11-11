import { createContext, useContext, useEffect, useState, type ReactNode, type MouseEvent } from "react";
import seed from "@/data/products.json";
import { api } from "@/lib/api";
import { FREE_SHIPPING, SERVICES, SLOTS, money } from "@/lib/constants";
import type { Account, Booking, Cart, Product } from "@/lib/types";

export type { Booking, Product };
export { FREE_SHIPPING, SERVICES, SLOTS, money };

/** Catálogo local (semilla). Con VITE_API_URL configurado, el catálogo se carga desde tu API. */
export const PRODUCTS = seed as unknown as Product[];

/** Clave del carrito/favoritos de quien no ha iniciado sesión. */
const GUEST = "guest";
const EMPTY_CART: Cart = {};
const NO_WISHES: number[] = [];

/** Pasa el cursor a --mx/--my para que .glow-card se ilumine */
export const glow = (e: MouseEvent<HTMLElement>) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
};

const read = <T,>(k: string, d: T): T => { try { return (JSON.parse(localStorage.getItem(k) ?? "") as T) ?? d; } catch { return d; } };

type Ctx = {
  user: Account | null;
  /** Identificador de quien usa la web: el correo de la cuenta o "guest". */
  userKey: string;
  products: Product[]; loading: boolean; apiError: string | null;
  cart: Cart; count: number; total: number; bookings: Booking[]; wishes: number[];
  authOpen: boolean; cartOpen: boolean; setAuthOpen: (v: boolean) => void; setCartOpen: (v: boolean) => void;
  login: (email: string, pass: string) => string | null; register: (name: string, email: string, pass: string) => string | null; logout: () => void;
  add: (id: number, qty?: number) => void; setQty: (id: number, q: number) => void;
  /** Devuelve un mensaje de error, o null si el pedido se registró. */
  checkout: () => Promise<string | null>;
  toggleWish: (id: number) => void;
  book: (b: Omit<Booking, "id" | "email">) => string | null; cancel: (id: string) => void;
};
const C = createContext<Ctx>(null!);
export const useStore = () => useContext(C);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>(() => read("lumina:accounts", []));
  const [user, setUser] = useState<Account | null>(() => read("lumina:user", null));
  // Un carrito (y una lista de favoritos) POR CUENTA, más uno aparte para invitados.
  const [carts, setCarts] = useState<Record<string, Cart>>(() => read<Record<string, Cart>>("lumina:carts", {}));
  const [allWishes, setAllWishes] = useState<Record<string, number[]>>(() => read<Record<string, number[]>>("lumina:wishes", {}));
  const [bookings, setBookings] = useState<Booking[]>(() => read("lumina:bookings", []));
  const [authOpen, setAuthOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>(api.remote ? [] : PRODUCTS);
  const [loading, setLoading] = useState(api.remote);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => { localStorage.setItem("lumina:accounts", JSON.stringify(accounts)); }, [accounts]);
  useEffect(() => { localStorage.setItem("lumina:user", JSON.stringify(user)); }, [user]);
  useEffect(() => { localStorage.setItem("lumina:carts", JSON.stringify(carts)); }, [carts]);
  useEffect(() => { localStorage.setItem("lumina:wishes", JSON.stringify(allWishes)); }, [allWishes]);
  useEffect(() => { localStorage.setItem("lumina:bookings", JSON.stringify(bookings)); }, [bookings]);

  // El carrito de versiones anteriores era uno solo para todos: se descarta para que no se "filtre" a otras cuentas.
  useEffect(() => { localStorage.removeItem("lumina:cart"); }, []);

  // Catálogo desde la API (solo si VITE_API_URL está configurado).
  useEffect(() => {
    if (!api.remote) return;
    let off = false;
    api.getProducts()
      .then((list) => { if (!off) setProducts(list); })
      .catch(() => { if (!off) { setProducts(PRODUCTS); setApiError("No se pudo conectar con la API: mostrando el catálogo local."); } })
      .finally(() => { if (!off) setLoading(false); });
    return () => { off = true; };
  }, []);

  const userKey = user?.email ?? GUEST;
  const cart: Cart = carts[userKey] ?? EMPTY_CART;
  const wishes: number[] = allWishes[userKey] ?? NO_WISHES;
  const updateCart = (fn: (c: Cart) => Cart) => setCarts((all) => ({ ...all, [userKey]: fn(all[userKey] ?? {}) }));

  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const total = products.reduce((s, p) => s + p.price * (cart[p.id] ?? 0), 0);

  const value: Ctx = {
    user, userKey, products, loading, apiError, cart, count, total, bookings, wishes, authOpen, cartOpen, setAuthOpen, setCartOpen,
    // DEMO: contraseñas en localStorage. En producción usa un backend (Supabase, Firebase, etc.).
    // El correo se compara sin mayúsculas ni espacios: "Ana@x.com" y "ana@x.com" son la misma cuenta (y el mismo carrito).
    register: (name, email, pass) => {
      const mail = email.trim().toLowerCase();
      if (accounts.some((a) => a.email.toLowerCase() === mail)) return "Ese correo ya tiene cuenta. Inicia sesión.";
      if (pass.length < 6) return "La contraseña necesita al menos 6 caracteres.";
      const a = { name, email: mail, pass };
      setAccounts([...accounts, a]); setUser(a); return null;
    },
    login: (email, pass) => {
      const mail = email.trim().toLowerCase();
      const a = accounts.find((x) => x.email.toLowerCase() === mail && x.pass === pass);
      if (!a) return "Correo o contraseña incorrectos.";
      setUser(a); return null;
    },
    logout: () => setUser(null),
    add: (id, qty = 1) => updateCart((c) => ({ ...c, [id]: Math.min(99, (c[id] ?? 0) + qty) })),
    setQty: (id, q) => updateCart((c) => { const n = { ...c }; if (q <= 0) delete n[id]; else n[id] = Math.min(99, q); return n; }),
    checkout: async () => {
      const key = userKey;
      const items = Object.entries(cart)
        .map(([id, qty]) => ({ id: Number(id), qty }))
        .filter((l) => l.qty > 0 && products.some((p) => p.id === l.id));
      if (!items.length) return "Tu cesta está vacía.";
      try {
        await api.createOrder({ email: user?.email ?? null, items });
        setCarts((all) => ({ ...all, [key]: {} }));
        return null;
      } catch {
        return "No pudimos registrar el pedido. Inténtalo de nuevo.";
      }
    },
    toggleWish: (id) => setAllWishes((all) => {
      const cur = all[userKey] ?? [];
      return { ...all, [userKey]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] };
    }),
    book: (b) => {
      if (!user) return "Inicia sesión para reservar.";
      if (bookings.some((x) => x.date === b.date && x.time === b.time)) return "Ese horario ya está ocupado.";
      setBookings([...bookings, { ...b, id: crypto.randomUUID(), email: user.email }]); return null;
    },
    cancel: (id) => setBookings((l) => l.filter((x) => x.id !== id)),
  };
  return <C.Provider value={value}>{children}</C.Provider>;
}
