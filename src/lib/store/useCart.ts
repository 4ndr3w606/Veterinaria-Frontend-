import { useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { readLocalStorageJson, removeLocalStorageItem, setLocalStorageItem } from "@/lib/safeStorage";
import type { Cart, Product } from "@/lib/types";

const EMPTY_CART: Cart = {};

export function useCart(userKey: string, products: Product[], email: string | null) {
  const [carts, setCarts] = useState<Record<string, Cart>>(
    () => readLocalStorageJson("lumina:carts", {}),
  );
  useEffect(() => { setLocalStorageItem("lumina:carts", JSON.stringify(carts)); }, [carts]);
  // Descarta el carrito antiguo que se compartía entre todas las cuentas.
  useEffect(() => { removeLocalStorageItem("lumina:cart"); }, []);

  const cart = carts[userKey] ?? EMPTY_CART;
  const count = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  const total = products.reduce((sum, product) => sum + product.price * (cart[product.id] ?? 0), 0);

  function updateCart(update: (current: Cart) => Cart) {
    setCarts((all) => ({ ...all, [userKey]: update(all[userKey] ?? {}) }));
  }

  function add(id: number, qty = 1) {
    updateCart((current) => ({ ...current, [id]: Math.min(99, (current[id] ?? 0) + qty) }));
  }

  function setQty(id: number, quantity: number) {
    updateCart((current) => {
      const next = { ...current };
      if (quantity <= 0) delete next[id];
      else next[id] = Math.min(99, quantity);
      return next;
    });
  }

  async function checkout(): Promise<string | null> {
    // Conserva la cuenta de origen si el usuario cambia durante el envío.
    const key = userKey;
    const items = Object.entries(cart)
      .map(([id, qty]) => ({ id: Number(id), qty }))
      .filter((line) => line.qty > 0 && products.some((product) => product.id === line.id));
    if (!items.length) return "Tu cesta está vacía.";

    try {
      await api.createOrder({ email, items });
      setCarts((all) => ({ ...all, [key]: {} }));
      return null;
    } catch (error) {
      if (error instanceof ApiError && error.code === "INVALID_API_RESPONSE") {
        return "No pudimos confirmar la respuesta del pedido. Comprueba si se registró antes de volver a enviarlo.";
      }
      return "No pudimos registrar el pedido. Inténtalo de nuevo.";
    }
  }

  return { cart, count, total, add, setQty, checkout };
}
