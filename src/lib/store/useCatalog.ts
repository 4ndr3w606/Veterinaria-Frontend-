import { useEffect, useState } from "react";
import seed from "@/data/products.json";
import { api } from "@/lib/api";
import type { Product } from "@/lib/types";

export const PRODUCTS = seed as unknown as Product[];

export function useCatalog() {
  const [products, setProducts] = useState<Product[]>(api.remote ? [] : PRODUCTS);
  const [loading, setLoading] = useState(api.remote);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (!api.remote) return;
    let active = true;
    api.getProducts()
      .then((list) => { if (active) setProducts(list); })
      .catch(() => {
        if (active) {
          setProducts(PRODUCTS);
          setApiError("No se pudo conectar con la API: mostrando el catálogo local.");
        }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return { products, loading, apiError };
}
