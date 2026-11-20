import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarDays, LogOut, Package, PawPrint, UserRound, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountBar } from "@/components/layout/AccountBar";
import { Footer } from "@/components/layout/Footer";
import { ProfilePanel } from "@/components/account/ProfilePanel";
import { OrdersPanel } from "@/components/account/OrdersPanel";
import { BookingsPanel } from "@/components/account/BookingsPanel";
import { localDate, petsFrom, splitBookings } from "@/lib/account";
import { api } from "@/lib/api";
import { money } from "@/lib/constants";
import { useStore } from "@/lib/store";
import type { OrderRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "perfil", label: "Mi perfil", icon: UserRound },
  { id: "compras", label: "Compras", icon: Package },
  { id: "citas", label: "Citas", icon: CalendarDays },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function Account() {
  const { user, logout, setAuthOpen, products, add, setCartOpen, bookings, bookingsLoading, bookingsError, cancel, refreshBookings } = useStore();
  const { hash } = useLocation();
  const navigate = useNavigate();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const email = user?.email ?? null;
  // Hora de referencia para el estado de los pedidos y la separación de citas; se fija al abrir la página.
  const [now] = useState(() => Date.now());

  const tab: TabId = TABS.find((t) => "#" + t.id === hash)?.id ?? "perfil";
  const selectTab = (id: TabId, focus = false) => {
    navigate({ hash: id }, { replace: true });
    if (focus) tabRefs.current[TABS.findIndex((t) => t.id === id)]?.focus();
  };

  // Pedidos de la cuenta. «loading» se deriva: la respuesta guardada es de otra cuenta o aún no llega.
  const [ordersState, setOrdersState] = useState<{ email: string | null; orders: OrderRecord[]; error: string | null }>({ email: null, orders: [], error: null });
  useEffect(() => {
    if (!email) return;
    let active = true;
    api.getOrders(email)
      .then((orders) => { if (active) setOrdersState({ email, orders, error: null }); })
      .catch(() => { if (active) setOrdersState({ email, orders: [], error: "No pudimos cargar tus compras. Inténtalo de nuevo más tarde." }); });
    return () => { active = false; };
  }, [email]);
  const ordersLoading = email !== null && ordersState.email !== email;

  useLayoutEffect(() => {
    const previous = document.title;
    document.title = "Mi cuenta | Lúmina Animal Care";
    return () => { document.title = previous; };
  }, []);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, []);

  const orders = ordersState.email === email ? ordersState.orders : [];
  const { upcoming, past } = splitBookings(bookings, localDate(new Date(now)));
  const pets = petsFrom(bookings);
  const spent = orders.reduce((sum, order) => sum + order.total, 0);

  const reorder = (order: OrderRecord) => {
    for (const line of order.items) if (products.some((product) => product.id === line.id)) add(line.id, line.qty);
    setCartOpen(true);
  };

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const next = e.key === "ArrowRight" ? index + 1 : e.key === "ArrowLeft" ? index - 1 : e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1 : null;
    if (next === null) return;
    e.preventDefault();
    selectTab(TABS[(next + TABS.length) % TABS.length].id, true);
  };

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-background/80 px-5 py-3 backdrop-blur-md">
        <Link to="/" className="group flex items-center gap-2 text-sm hover:text-primary">
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" /> Inicio
        </Link>
        <span className="hidden font-display text-xl text-primary italic sm:block">Lúmina</span>
        <AccountBar>
          <Link to="/tienda" className="hidden rounded-full px-3 py-2 text-sm hover:text-primary sm:block">Tienda</Link>
        </AccountBar>
      </header>

      <main className="px-5 pt-10 pb-24">
        {!user ? (
          <div className="enter mx-auto max-w-md py-20 text-center">
            <span className="float mx-auto flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground"><PawPrint className="size-7" /></span>
            <h1 className="mt-6 text-4xl font-light">Tu cuenta Lúmina</h1>
            <p className="mt-3 text-muted-foreground">Entra para ver tus datos, tus compras y el historial de citas de tus mascotas.</p>
            <Button size="lg" className="mt-8 rounded-full" aria-haspopup="dialog" onClick={() => setAuthOpen(true)}>Entrar o crear cuenta</Button>          </div>
        ) : (
          <div className="mx-auto max-w-6xl">
            <section className="enter flex flex-wrap items-center justify-between gap-6" aria-labelledby="acc-title">
              <div className="flex min-w-0 items-center gap-4">
                <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary font-display text-2xl text-primary-foreground" aria-hidden="true">
                  {user.name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]?.toUpperCase()).join("")}
                </span>
                <div className="min-w-0">
                  <p className="text-xs tracking-[0.3em] text-muted-foreground">MI CUENTA</p>
                  <h1 id="acc-title" className="mt-1 truncate text-[clamp(2rem,6vw,3.5rem)] leading-tight font-light">
                    Hola, <em className="text-primary">{user.name.trim().split(/\s+/)[0]}</em>
                  </h1>
                  <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <Button type="button" variant="outline" className="rounded-full" onClick={logout}><LogOut /> Cerrar sesión</Button>
            </section>

            <div className="enter mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4" style={{ "--i": 1 } as React.CSSProperties}>
              <Stat icon={<Package className="size-5" />} label="Compras" value={ordersLoading ? "…" : String(orders.length)} />
              <Stat icon={<Wallet className="size-5" />} label="Total comprado" value={ordersLoading ? "…" : money(spent)} />
              <Stat icon={<CalendarDays className="size-5" />} label="Próximas citas" value={String(upcoming.length)} />
              <Stat icon={<PawPrint className="size-5" />} label="Mascotas" value={String(pets.length)} />
            </div>

            <div role="tablist" aria-label="Secciones de mi cuenta" className="mt-8 flex gap-1 overflow-x-auto rounded-full border bg-card p-1.5 sm:w-fit">
              {TABS.map(({ id, label, icon: Icon }, i) => (
                <button key={id} ref={(el) => { tabRefs.current[i] = el; }} type="button" role="tab" id={`tab-${id}`}
                  aria-selected={tab === id} aria-controls={`panel-${id}`} tabIndex={tab === id ? 0 : -1}
                  onClick={() => selectTab(id)} onKeyDown={(e) => onTabKey(e, i)}
                  className={cn("flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2.5 text-sm whitespace-nowrap transition-colors sm:flex-none sm:px-5",
                    tab === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                  <Icon className="hidden size-4 sm:block" aria-hidden="true" /> {label}
                </button>
              ))}
            </div>

            <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} tabIndex={0} className="mt-6 outline-none" key={tab}>
              <div className="enter">
                {tab === "perfil" && <ProfilePanel user={user} pets={pets} />}
                {tab === "compras" && <OrdersPanel orders={orders} products={products} loading={ordersLoading} error={ordersState.error} now={now} onReorder={reorder} />}
                {tab === "citas" && <BookingsPanel upcoming={upcoming} past={past} loading={bookingsLoading} error={bookingsError} onCancel={cancel} onRefresh={() => void refreshBookings()} />}
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-3xl bg-card p-4 ring-1 ring-border sm:p-5">
      <span className="text-primary" aria-hidden="true">{icon}</span>
      <p className="mt-3 truncate font-display text-2xl sm:text-3xl">{value}</p>
      <p className="text-xs text-muted-foreground sm:text-sm">{label}</p>
    </div>
  );
}
