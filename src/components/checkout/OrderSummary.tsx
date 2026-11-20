import { Pic } from "@/components/shop/ProductImage";
import { FREE_SHIPPING, money } from "@/lib/constants";
import type { DeliveryMethod } from "@/lib/checkout";
import type { Product } from "@/lib/types";

export type SummaryLine = { product: Product; qty: number };

type Props = {
  lines: SummaryLine[];
  subtotal: number;
  shipping: number;
  delivery: DeliveryMethod;
  onEditCart?: () => void;
};

export function OrderSummary({ lines, subtotal, shipping, delivery, onEditCart }: Props) {
  const missing = FREE_SHIPPING - subtotal;
  return (
    <div className="space-y-5">
      <ul className="space-y-3" aria-label="Productos del pedido">
        {lines.map(({ product, qty }) => (
          <li key={product.id} className="flex items-center gap-3">
            <span className="relative shrink-0">
              <Pic p={product} className="size-14 rounded-xl" />
              <span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground" aria-label={`${qty} unidades`}>{qty}</span>
            </span>
            <span className="min-w-0 flex-1 text-sm">{product.name}</span>
            <span className="text-sm">{money(product.price * qty)}</span>
          </li>
        ))}
      </ul>
      {onEditCart && (
        <button type="button" onClick={onEditCart} className="text-sm text-primary underline-offset-4 hover:underline">
          Editar productos
        </button>
      )}
      <dl className="space-y-2 border-t pt-4 text-sm">
        <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{money(subtotal)}</dd></div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">{delivery === "recoger" ? "Recogida en la clínica" : "Envío"}</dt>
          <dd>{shipping === 0 ? <span className="text-primary">Gratis</span> : money(shipping)}</dd>
        </div>
        {delivery === "domicilio" && missing > 0 && (
          <p className="text-xs text-muted-foreground">Añade {money(missing)} más y el envío es gratis.</p>
        )}
        <div className="flex items-baseline justify-between border-t pt-3">
          <dt>Total</dt>
          <dd key={subtotal + shipping} className="bubble font-display text-2xl text-primary">{money(subtotal + shipping)}</dd>
        </div>
      </dl>
    </div>
  );
}
