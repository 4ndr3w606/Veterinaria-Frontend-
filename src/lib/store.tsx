import { createContext, useContext, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/store/useAuth";
import { useBookings } from "@/lib/store/useBookings";
import { useCart } from "@/lib/store/useCart";
import { useCatalog } from "@/lib/store/useCatalog";
import { useWishes } from "@/lib/store/useWishes";

export type { Booking, Product } from "@/lib/types";
export { FREE_SHIPPING, SERVICES, SLOTS, money } from "@/lib/constants";
export { PRODUCTS } from "@/lib/store/useCatalog";
export { glow } from "@/lib/glow";

type StoreState =
  ReturnType<typeof useAuth> &
  ReturnType<typeof useCatalog> &
  ReturnType<typeof useCart> &
  ReturnType<typeof useWishes> &
  Omit<ReturnType<typeof useBookings>, "setBookingUser"> & {
    authOpen: boolean;
    cartOpen: boolean;
    setAuthOpen: (open: boolean) => void;
    setCartOpen: (open: boolean) => void;
  };

const StoreContext = createContext<StoreState>(null!);
export const useStore = () => useContext(StoreContext);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { setBookingUser, ...bookings } = useBookings();
  const auth = useAuth(setBookingUser);
  const catalog = useCatalog();
  const cart = useCart(auth.userKey, catalog.products, auth.user?.email ?? null);
  const wishes = useWishes(auth.userKey);
  const [authOpen, setAuthOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const value: StoreState = {
    ...auth,
    ...catalog,
    ...cart,
    ...wishes,
    ...bookings,
    authOpen,
    cartOpen,
    setAuthOpen,
    setCartOpen,
  };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
