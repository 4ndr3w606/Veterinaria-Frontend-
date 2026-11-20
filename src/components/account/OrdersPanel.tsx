import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronDown, CreditCard, Package, RotateCcw, Store, Truck } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Pic } from "@/components/shop/ProductImage";
import { EmptyState, StatusPill, shortDate } from "@/components/account/shared";
import { orderStatus } from "@/lib/account";
import { PAYMENT_METHODS } from "@/lib/checkout";
import { money } from "@/lib/constants";
import type { OrderRecord, Product } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  orders: OrderRecord[];
  products: Product[];
  loading: boolean;
  error: string | null;
  now: number;
  onReorder: (order: OrderRecord) => void;
};

export function OrdersPanel({ orders, products, loading, error, now, onReorder }: Props) {
  if (loading) return <p role="status" className="py-10 text-center text-muted-foreground">Cargando tus compras…</p>;
  if (error) return <p role="alert" className="rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">{error}</p>;
  if (orders.length === 0) {
    return (
      <EmptyState icon={<Package className="size-6" />} title="Aún no tienes compras"
        text="Cuando finalices una compra con esta cuenta, aparecerá aquí con su estado."
        action={<Link to="/tienda" className={buttonVariants({ className: "rounded-full" })}>Ir a la tienda</Link>} />
    );
  }
  return (
    <ul className="space-y-4">
      {orders.map((order) => <OrderCard key={order.id} order={order} products={products} now={now} onReorder={onReorder} />)}
    </ul>
  );
}

function OrderCard({ order, products, now, onReorder }: { order: OrderRecord; products: Product[]; now: number; onReorder: (order: OrderRecord) => void }) {
  const [open, setOpen] = useState(false);
  const status = orderStatus(order, now);
  const units = order.items.reduce((sum, line) => sum + line.qty, 0);
  const lines = order.items.map((line) => ({ ...line, product: products.find((product) => product.id === line.id) }));
  const payment = PAYMENT_METHODS.find((method) => method.value === order.payment)?.label;
  const panelId = `order-${order.id}`;

  return (
    <li className="rounded-3xl bg-card p-5 ring-1 ring-border sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-sm">#{order.id}</p>
          <p className="mt-1 text-sm text-muted-foreground">{shortDate(order.createdAt)} · {units} {units === 1 ? "producto" : "productos"}</p>
        </div>
        <div className="text-right">
          <StatusPill tone={status.done ? "done" : "default"}>{status.label}</StatusPill>
          <p className="mt-2 font-display text-2xl text-primary">{money(order.total)}</p>
        </div>
      </div>

      <ol className="mt-5 grid grid-cols-4 gap-1" aria-label={`Estado del pedido: ${status.label}`}>
        {status.steps.map((step, i) => (
          <li key={step} aria-current={i === status.step ? "step" : undefined} className="min-w-0">
            <span className={cn("block h-1.5 rounded-full", i <= status.step ? "bg-primary" : "bg-muted")} />
            {/* En pantallas angostas solo queda la barra: el estado actual ya aparece en la etiqueta de arriba. */}
            <span className={cn("mt-2 hidden items-center gap-1 text-xs leading-tight sm:flex", i <= status.step ? "text-foreground" : "text-muted-foreground")}>
              {i < status.step && <Check className="size-3 shrink-0 text-primary" aria-hidden="true" />}
              {step}
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
        <button type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(!open)}
          className="flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline">
          <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden="true" />
          {open ? "Ocultar detalle" : "Ver detalle"}
        </button>
        <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => onReorder(order)}>
          <RotateCcw /> Volver a comprar
        </Button>
      </div>

      {open && (
        <div id={panelId} className="enter mt-4 space-y-4 border-t pt-4">
          <ul className="space-y-3">
            {lines.map((line) => (
              <li key={line.id} className="flex items-center gap-3 text-sm">
                {line.product ? <Pic p={line.product} className="size-12 shrink-0 rounded-xl" /> : <span className="size-12 shrink-0 rounded-xl bg-muted" />}
                <span className="min-w-0 flex-1">{line.product?.name ?? `Producto #${line.id}`} <span className="text-muted-foreground">× {line.qty}</span></span>
                {line.product && <span>{money(line.product.price * line.qty)}</span>}
              </li>
            ))}
          </ul>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="flex items-start gap-2">
              {order.delivery === "domicilio" ? <Truck className="mt-0.5 size-4 text-primary" /> : <Store className="mt-0.5 size-4 text-primary" />}
              <div><dt className="text-muted-foreground">Entrega</dt><dd>{order.delivery === "domicilio" ? "Envío a domicilio" : "Recoger en la clínica"}</dd></div>
            </div>
            <div className="flex items-start gap-2">
              <CreditCard className="mt-0.5 size-4 text-primary" />
              <div><dt className="text-muted-foreground">Pago</dt><dd>{order.payment === "contraentrega" && order.delivery === "recoger" ? "Pago en la clínica" : payment}</dd></div>
            </div>
          </dl>
        </div>
      )}
    </li>
  );
}
