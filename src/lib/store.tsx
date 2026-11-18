import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode, type MouseEvent } from "react";
import seed from "@/data/products.json";
import { ApiError, api } from "@/lib/api";
import { getLocalStorageItem, removeLocalStorageItem, setLocalStorageItem } from "@/lib/safeStorage";
import type { Account, Booking, BookingAvailability, BookingInput, Cart, Product, User } from "@/lib/types";
import { FREE_SHIPPING, SERVICES, SLOTS, money } from "@/lib/constants";
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

const read = <T,>(k: string, d: T): T => { try { return (JSON.parse(getLocalStorageItem(k) ?? "") as T) ?? d; } catch { return d; } };

type Ctx = {
  user: User | null;
  /** Identificador de quien usa la web: el correo de la cuenta o "guest". */
  userKey: string;
  products: Product[]; loading: boolean; apiError: string | null;
  cart: Cart; count: number; total: number; bookings: Booking[]; bookingsLoading: boolean; bookingsError: string | null; wishes: number[];
  authOpen: boolean; cartOpen: boolean; setAuthOpen: (v: boolean) => void; setCartOpen: (v: boolean) => void;
  login: (email: string, pass: string) => string | null; register: (name: string, email: string, pass: string) => string | null; logout: () => void;
  add: (id: number, qty?: number) => void; setQty: (id: number, q: number) => void;
  /** Devuelve un mensaje de error, o null si el pedido se registró. */
  checkout: () => Promise<string | null>;
  toggleWish: (id: number) => void;
  getBookingAvailability: (date: string) => Promise<BookingAvailability>;
  refreshBookings: () => Promise<void>;
  book: (booking: BookingInput) => Promise<string | null>;
  cancel: (id: string) => Promise<string | null>;
};
const C = createContext<Ctx>(null!);
export const useStore = () => useContext(C);

export function StoreProvider({ children }: { children: ReactNode }) {
  // La autenticación solo se simula en memoria; no se persisten cuentas ni contraseñas.
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [user, setUser] = useState<User | null>(null);
  // Un carrito (y una lista de favoritos) POR CUENTA, más uno aparte para invitados.
  const [carts, setCarts] = useState<Record<string, Cart>>(() => read<Record<string, Cart>>("lumina:carts", {}));
  const [allWishes, setAllWishes] = useState<Record<string, number[]>>(() => read<Record<string, number[]>>("lumina:wishes", {}));
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsOwnerEmail, setBookingsOwnerEmail] = useState<string | null>(null);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const bookingRequestId = useRef(0);
  const activeBookingEmailRef = useRef<string | null>(null);
  const lastAutomaticBookingSync = useRef(0);
  const [authOpen, setAuthOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>(api.remote ? [] : PRODUCTS);
  const [loading, setLoading] = useState(api.remote);
  const [apiError, setApiError] = useState<string | null>(null);

  // Elimina credenciales en texto plano que versiones anteriores guardaron en el navegador.
  useEffect(() => {
    removeLocalStorageItem("lumina:accounts");
    removeLocalStorageItem("lumina:user");
  }, []);
  useEffect(() => { setLocalStorageItem("lumina:carts", JSON.stringify(carts)); }, [carts]);
  useEffect(() => { setLocalStorageItem("lumina:wishes", JSON.stringify(allWishes)); }, [allWishes]);


  const fetchBookings = useCallback(async (email: string) => {
    const requestId = ++bookingRequestId.current;
    if (activeBookingEmailRef.current !== email) return;

    try {
      const list = await api.getBookings(email);
      if (requestId === bookingRequestId.current && activeBookingEmailRef.current === email) {
        setBookings(list);
        setBookingsOwnerEmail(email);
        setBookingsError(null);
      }
    } catch (error: unknown) {
      if (requestId === bookingRequestId.current && activeBookingEmailRef.current === email) {
        setBookings([]);
        setBookingsOwnerEmail(email);
        setBookingsError(error instanceof ApiError ? error.message : "No se pudieron cargar tus citas.");
      }
    } finally {
      if (requestId === bookingRequestId.current && activeBookingEmailRef.current === email) {
        setBookingsLoading(false);
      }
    }
  }, []);

  const refreshBookings = useCallback(async () => {
    const email = activeBookingEmailRef.current;
    if (!email) return;
    setBookingsLoading(true);
    setBookingsError(null);
    await fetchBookings(email);
  }, [fetchBookings]);
  useEffect(() => {
    const syncWhenActive = () => {
      if (document.visibilityState === "hidden" || !activeBookingEmailRef.current) return;
      const now = Date.now();
      if (now - lastAutomaticBookingSync.current < 1500) return;
      lastAutomaticBookingSync.current = now;
      void refreshBookings();
    };
    window.addEventListener("focus", syncWhenActive);
    document.addEventListener("visibilitychange", syncWhenActive);
    return () => {
      window.removeEventListener("focus", syncWhenActive);
      document.removeEventListener("visibilitychange", syncWhenActive);
    };
  }, [refreshBookings]);
  useEffect(() => { removeLocalStorageItem("lumina:cart"); }, []);

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

  const getBookingAvailability = useCallback((date: string) => api.getBookingAvailability(date), []);
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const total = products.reduce((s, p) => s + p.price * (cart[p.id] ?? 0), 0);

  const value: Ctx = {
    user, userKey, products, loading, apiError, cart, count, total, bookings: user && bookingsOwnerEmail === user.email ? bookings : [], bookingsLoading, bookingsError, wishes, authOpen, cartOpen, setAuthOpen, setCartOpen,
    // DEMO: cuentas válidas solo mientras esta página está abierta; la autenticación real va en el backend.
    // El correo se compara sin mayúsculas ni espacios: "Ana@x.com" y "ana@x.com" son la misma cuenta (y el mismo carrito).
    register: (name, email, pass) => {
      const mail = email.trim().toLowerCase();
      if (accounts.some((a) => a.email.toLowerCase() === mail)) return "Ese correo ya tiene cuenta. Inicia sesión.";
      if (pass.length < 6) return "La contraseña necesita al menos 6 caracteres.";
      const a = { name, email: mail, pass };
      setAccounts((current) => [...current, a]);
      activeBookingEmailRef.current = mail;
      bookingRequestId.current += 1;
      setBookings([]);
      setBookingsOwnerEmail(null);
      setBookingsLoading(true);
      setBookingsError(null);
      setUser({ name: a.name, email: a.email });
      void fetchBookings(mail);
      return null;
    },
    login: (email, pass) => {
      const mail = email.trim().toLowerCase();
      const a = accounts.find((x) => x.email.toLowerCase() === mail && x.pass === pass);
      if (!a) return "Correo o contraseña incorrectos.";
      activeBookingEmailRef.current = mail;
      bookingRequestId.current += 1;
      setBookings([]);
      setBookingsOwnerEmail(null);
      setBookingsLoading(true);
      setBookingsError(null);
      setUser({ name: a.name, email: a.email });
      void fetchBookings(mail);
      return null;
    },
    logout: () => {
      activeBookingEmailRef.current = null;
      bookingRequestId.current += 1;
      setBookings([]);
      setBookingsOwnerEmail(null);
      setBookingsLoading(false);
      setBookingsError(null);
      setUser(null);
    },
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
    getBookingAvailability,
    refreshBookings,
    book: async (booking) => {
      if (!user) return "Inicia sesión para reservar.";
      try {
        await api.createBooking(booking, user.email);
        if (activeBookingEmailRef.current === user.email) await refreshBookings();
        return null;
      } catch (error) {
        if (error instanceof ApiError && error.status === 409) return "Ese horario ya está ocupado.";
        if (error instanceof ApiError && error.status === 401) return "Tu sesión no está autorizada para reservar.";
        if (error instanceof ApiError && error.status === 422) return error.message;
        return "No pudimos registrar la cita. Inténtalo de nuevo."; 
      }
    },
    cancel: async (id) => {
      if (!user) return "Inicia sesión para cancelar."; 
      try {
        await api.cancelBooking(id, user.email);
        if (activeBookingEmailRef.current === user.email) await refreshBookings();
        return null;
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return "No encontramos esa cita.";
        if (error instanceof ApiError && error.status === 401) return "Tu sesión no está autorizada para cancelar citas.";
        return "No pudimos cancelar la cita. Inténtalo de nuevo."; 
      }
    },
  };
  return <C.Provider value={value}>{children}</C.Provider>;
}

