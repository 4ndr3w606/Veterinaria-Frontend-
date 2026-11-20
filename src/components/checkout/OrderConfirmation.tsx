import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CircleCheck, CreditCard, MapPin, Store } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { OrderSummary, type SummaryLine } from "@/components/checkout/OrderSummary";
import { PAYMENT_METHODS, addBusinessDays, type OrderDetails } from "@/lib/checkout";
import { money } from "@/lib/constants";
import type { OrderResult } from "@/lib/types";

export type ConfirmedOrder = {
  order: OrderResult;
  details: OrderDetails;
  lines: SummaryLine[];
  subtotal: number;
  shipping: number;
};

const day = (date: Date) => new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long" }).format(date);

export function OrderConfirmation({ confirmed }: { confirmed: ConfirmedOrder }) {
  const { order, details, lines, subtotal, shipping } = confirmed;
  const heading = useRef<HTMLHeadingElement>(null);
  const created = new Date(order.createdAt);
  const home = details.delivery.method === "domicilio";
  const payment = PAYMENT_METHODS.find((method) => method.value === details.payment);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    heading.current?.focus();
  }, []);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="enter text-center">
        <span className="beat mx-auto flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground"><CircleCheck className="size-8" /></span>
        <h1 ref={heading} tabIndex={-1} className="mt-6 text-[clamp(2.25rem,6vw,3.75rem)] leading-tight font-light outline-none">
          ¡Pedido <em className="text-primary">confirmado</em>!
        </h1>
        <p className="mt-3 text-muted-foreground">
          Gracias, {details.customer.name.split(" ")[0]}. Tu número de pedido es{" "}
          <strong className="font-mono text-foreground">#{order.id}</strong>.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Te enviaríamos la confirmación a <span className="text-foreground">{details.customer.email}</span>.
        </p>
      </div>

      <p role="note" className="enter mt-8 rounded-2xl border border-dashed border-primary/40 p-4 text-center text-sm text-muted-foreground" style={{ "--i": 1 } as React.CSSProperties}>
        Compra de demostración: no se realizó ningún cobro ni se enviará ningún producto.
      </p>

      <div className="enter mt-8 grid gap-4 sm:grid-cols-2" style={{ "--i": 2 } as React.CSSProperties}>
        <section className="rounded-3xl bg-card p-6 ring-1 ring-border" aria-labelledby="conf-delivery">
          <h2 id="conf-delivery" className="flex items-center gap-2 font-display text-xl">
            {home ? <MapPin className="size-5 text-primary" /> : <Store className="size-5 text-primary" />}
            {home ? "Envío a domicilio" : "Recoger en la clínica"}
          </h2>
          {details.delivery.method === "domicilio" ? (
            <>
              <p className="mt-3 text-sm">
                {details.delivery.address}{details.delivery.addressExtra ? `, ${details.delivery.addressExtra}` : ""}<br />
                {details.delivery.neighborhood} · {details.delivery.city}, {details.delivery.department}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Llegada estimada: entre el {day(addBusinessDays(created, 2))} y el {day(addBusinessDays(created, 4))}.
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Estará listo desde el {day(addBusinessDays(created, 1))}. Presenta tu número de pedido y tu documento en la clínica.
            </p>
          )}
          <p className="mt-3 text-sm text-muted-foreground">Contacto: {details.customer.phone.replace(/^(\d{3})(\d{3})(\d{4})$/, "$1 $2 $3")}</p>
        </section>

        <section className="rounded-3xl bg-card p-6 ring-1 ring-border" aria-labelledby="conf-payment">
          <h2 id="conf-payment" className="flex items-center gap-2 font-display text-xl"><CreditCard className="size-5 text-primary" /> Pago</h2>
          <p className="mt-3 text-sm">
            {details.payment === "contraentrega" && !home ? "Pago en la clínica al recoger" : payment?.label}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            {details.payment === "contraentrega"
              ? `Pagarás ${money(order.total)} al recibir tu pedido.`
              : "En la versión final, aquí te llevaríamos a la pasarela de pagos para completar el cobro."}
          </p>
        </section>
      </div>

      <section className="enter mt-4 rounded-3xl bg-card p-6 ring-1 ring-border" aria-labelledby="conf-items" style={{ "--i": 3 } as React.CSSProperties}>
        <h2 id="conf-items" className="mb-4 font-display text-xl">Resumen</h2>
        <OrderSummary lines={lines} subtotal={subtotal} shipping={shipping} delivery={details.delivery.method} />
        {order.total !== subtotal + shipping && (
          <p className="mt-3 text-sm text-muted-foreground">Total registrado por la tienda: {money(order.total)}.</p>
        )}
      </section>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/tienda" className={buttonVariants({ size: "lg", className: "rounded-full" })}>Seguir comprando <ArrowRight /></Link>
        <Link to="/" className={buttonVariants({ size: "lg", variant: "ghost", className: "rounded-full" })}>Volver al inicio</Link>
      </div>
    </div>
  );
}
