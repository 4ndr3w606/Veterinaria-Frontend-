import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronDown, Lock, ShieldCheck, ShoppingBag, Store, Truck } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AccountBar } from "@/components/layout/AccountBar";
import { Footer } from "@/components/layout/Footer";
import { Choice, Field, SelectWrap, controlClass, describedBy } from "@/components/checkout/fields";
import { OrderSummary, type SummaryLine } from "@/components/checkout/OrderSummary";
import { OrderConfirmation, type ConfirmedOrder } from "@/components/checkout/OrderConfirmation";
import {
  DELIVERY_METHODS, DEPARTMENTS, DOC_TYPES, EMPTY_CHECKOUT, FIELD_ORDER, LIMITS, PAYMENT_METHODS,
  readCheckoutDraft, saveCheckoutDraft, shippingCost, toOrderDetails, validateCheckout, type CheckoutField, type CheckoutForm,
} from "@/lib/checkout";
import { money } from "@/lib/constants";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const id = (field: CheckoutField) => `co-${field}`;

export default function Checkout() {
  const { cart, products, user, checkout, setCartOpen } = useStore();
  const [form, setForm] = useState<CheckoutForm>(() => readCheckoutDraft() ?? { ...EMPTY_CHECKOUT, name: user?.name ?? "", email: user?.email ?? "" });
  const [seenUser, setSeenUser] = useState(user);
  const [touched, setTouched] = useState<Set<CheckoutField>>(() => new Set());
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<ConfirmedOrder | null>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    const previous = document.title;
    document.title = "Finalizar compra | Lúmina Animal Care";
    return () => { document.title = previous; };
  }, []);

  useEffect(() => { if (!confirmed) saveCheckoutDraft(form); }, [form, confirmed]);

  // Si alguien entra a su cuenta durante la compra, completa los campos que sigan vacíos.
  if (user !== seenUser) {
    setSeenUser(user);
    if (user) setForm((current) => ({ ...current, name: current.name || user.name, email: current.email || user.email }));
  }

  const lines: SummaryLine[] = products.filter((p) => cart[p.id]).map((product) => ({ product, qty: cart[product.id] }));
  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.qty, 0);
  const units = lines.reduce((sum, line) => sum + line.qty, 0);
  const shipping = shippingCost(subtotal, form.delivery);
  const errors = validateCheckout(form);
  const errorCount = Object.keys(errors).length;
  const show = (field: CheckoutField) => (submitted || touched.has(field) ? errors[field] : undefined);
  const home = form.delivery === "domicilio";

  const set = <K extends CheckoutField>(field: K, value: CheckoutForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError(null);
  };
  const blur = (field: CheckoutField) => () => setTouched((current) => new Set(current).add(field));

  /** Props comunes de los campos de texto. */
  const text = (field: CheckoutField, hint?: string) => ({
    id: id(field),
    name: field,
    value: String(form[field]),
    onChange: (e: { target: { value: string } }) => set(field, e.target.value as never),
    onBlur: blur(field),
    "aria-invalid": show(field) ? true : undefined,
    "aria-describedby": describedBy(id(field), show(field), hint),
  });

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    setSubmitted(true);
    setError(null);
    const first = FIELD_ORDER.find((field) => errors[field]);
    if (first) {
      const target = document.getElementById(id(first)) ?? document.querySelector<HTMLElement>(`[name="${first}"]:checked`);
      // Centrado para que la cabecera fija no tape el campo.
      target?.scrollIntoView({ block: "center", behavior: "smooth" });
      target?.focus({ preventScroll: true });
      return;
    }
    const details = toOrderDetails(form);
    const snapshot = { lines, subtotal, shipping };
    setBusy(true);
    const result = await checkout(details);
    setBusy(false);
    if ("error" in result) {
      setError(result.error);
      requestAnimationFrame(() => alertRef.current?.focus());
      return;
    }
    saveCheckoutDraft(null);
    setConfirmed({ order: result.order, details, ...snapshot });
  };

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-background/80 px-5 py-3 backdrop-blur-md">
        <Link to="/tienda" className="group flex items-center gap-2 text-sm hover:text-primary">
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" /> Tienda
        </Link>
        <span className="hidden font-display text-xl text-primary italic sm:block">Lúmina</span>
        <AccountBar showGreeting />
      </header>

      <main className="px-5 pt-10 pb-24">
        {confirmed ? (
          <OrderConfirmation confirmed={confirmed} />
        ) : lines.length === 0 ? (
          <div className="enter mx-auto max-w-md py-20 text-center">
            <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-muted text-primary"><ShoppingBag className="size-7" /></span>
            <h1 className="mt-6 text-4xl font-light">Tu cesta está vacía</h1>
            <p className="mt-3 text-muted-foreground">Añade productos en la tienda para finalizar una compra.</p>
            <Link to="/tienda" className={buttonVariants({ size: "lg", className: "mt-8 rounded-full" })}>Ir a la tienda</Link>
          </div>
        ) : (
          <div className="mx-auto max-w-6xl">
            <div className="enter">
              <p className="text-xs tracking-[0.3em] text-muted-foreground">FINALIZAR COMPRA</p>
              <h1 className="mt-3 text-[clamp(2.5rem,7vw,4.5rem)] leading-none font-light">Ya casi <em className="text-primary">es suyo.</em></h1>
              <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                Compra de demostración: no se pedirán datos bancarios ni se realizará ningún cobro.
              </p>
            </div>

            <details className="group mt-8 rounded-3xl bg-card ring-1 ring-border lg:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-2 text-sm">
                  <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
                  Resumen ({units} {units === 1 ? "producto" : "productos"})
                </span>
                <span className="font-display text-xl text-primary">{money(subtotal + shipping)}</span>
              </summary>
              <div className="px-5 pb-5">
                <OrderSummary lines={lines} subtotal={subtotal} shipping={shipping} delivery={form.delivery} onEditCart={() => setCartOpen(true)} />
              </div>
            </details>

            <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
              <form noValidate onSubmit={(e) => void submit(e)} className="space-y-6" aria-describedby="co-required">
                <p id="co-required" className="sr-only">Todos los campos son obligatorios salvo los marcados como opcionales.</p>

                <section className="rounded-3xl bg-card p-6 ring-1 ring-border sm:p-8" aria-labelledby="co-s1">
                  <h2 id="co-s1" className="font-display text-2xl"><span className="text-primary">1.</span> Tus datos</h2>
                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <Field id={id("name")} label="Nombre y apellido" error={show("name")} className="sm:col-span-2">
                      <Input {...text("name")} autoComplete="name" maxLength={LIMITS.name} className="h-12 rounded-xl" />
                    </Field>
                    <Field id={id("email")} label="Correo" error={show("email")}>
                      <Input {...text("email")} type="email" autoComplete="email" inputMode="email" maxLength={LIMITS.email} className="h-12 rounded-xl" />
                    </Field>
                    <Field id={id("phone")} label="Celular" error={show("phone")} hint="Para coordinar la entrega.">
                      <div className="relative">
                        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">+57</span>
                        <Input {...text("phone", "Para coordinar la entrega.")} type="tel" autoComplete="tel-national" inputMode="tel" maxLength={16} placeholder="300 123 4567" className="h-12 rounded-xl pl-12" />
                      </div>
                    </Field>
                    <Field id={id("docType")} label="Tipo de documento" error={show("docType")}>
                      <SelectWrap>
                        <select {...text("docType")} className={cn(controlClass, "h-12 appearance-none pr-9 [&>option]:bg-card")}>
                          {DOC_TYPES.map((doc) => <option key={doc.value} value={doc.value}>{doc.label}</option>)}
                        </select>
                      </SelectWrap>
                    </Field>
                    <Field id={id("docNumber")} label="Número de documento" error={show("docNumber")} hint="Lo pide la transportadora.">
                      <Input {...text("docNumber", "Lo pide la transportadora.")} inputMode={form.docType === "CC" || form.docType === "NIT" ? "numeric" : "text"} maxLength={LIMITS.docNumber} className="h-12 rounded-xl" />
                    </Field>
                  </div>
                </section>

                <section className="rounded-3xl bg-card p-6 ring-1 ring-border sm:p-8" aria-labelledby="co-s2">
                  <h2 id="co-s2" className="font-display text-2xl"><span className="text-primary">2.</span> Entrega</h2>
                  <fieldset className="mt-6">
                    <legend className="sr-only">Cómo quieres recibir tu pedido</legend>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {DELIVERY_METHODS.map((method, i) => (
                        <Choice key={method.value} id={i === 0 ? id("delivery") : undefined} name="delivery" value={method.value}
                          checked={form.delivery === method.value} label={method.label}
                          detail={method.value === "domicilio" ? (shippingCost(subtotal, "domicilio") === 0 ? `${method.detail} · Gratis` : `${method.detail} · ${money(shippingCost(subtotal, "domicilio"))}`) : method.detail}
                          icon={method.value === "domicilio" ? <Truck className="size-5" /> : <Store className="size-5" />}
                          onChange={(value) => set("delivery", value as CheckoutForm["delivery"])} />
                      ))}
                    </div>
                  </fieldset>

                  {home ? (
                    <div className="enter mt-6 grid gap-5 sm:grid-cols-2">
                      <Field id={id("department")} label="Departamento" error={show("department")}>
                        <SelectWrap>
                          <select {...text("department")} autoComplete="address-level1" className={cn(controlClass, "h-12 appearance-none pr-9 [&>option]:bg-card", !form.department && "text-muted-foreground")}>
                            <option value="" disabled>Elige uno</option>
                            {DEPARTMENTS.map((name) => <option key={name} value={name} className="text-foreground">{name}</option>)}
                          </select>
                        </SelectWrap>
                      </Field>
                      <Field id={id("city")} label="Ciudad o municipio" error={show("city")}>
                        <Input {...text("city")} autoComplete="address-level2" maxLength={LIMITS.city} className="h-12 rounded-xl" />
                      </Field>
                      <Field id={id("address")} label="Dirección" error={show("address")} hint="Por ejemplo: Calle 10 # 5-20." className="sm:col-span-2">
                        <Input {...text("address", "Por ejemplo: Calle 10 # 5-20.")} autoComplete="address-line1" maxLength={LIMITS.address} className="h-12 rounded-xl" />
                      </Field>
                      <Field id={id("neighborhood")} label="Barrio" error={show("neighborhood")}>
                        <Input {...text("neighborhood")} maxLength={LIMITS.neighborhood} className="h-12 rounded-xl" />
                      </Field>
                      <Field id={id("addressExtra")} label="Apartamento, torre o casa" optional error={show("addressExtra")}>
                        <Input {...text("addressExtra")} autoComplete="address-line2" maxLength={LIMITS.addressExtra} className="h-12 rounded-xl" />
                      </Field>
                    </div>
                  ) : (
                    <p className="enter mt-6 rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
                      Recoge tu pedido en Lúmina Animal Care (Tu ciudad, Colombia) de lunes a sábado. Te avisaremos cuando esté listo; lleva tu número de pedido y tu documento.
                    </p>
                  )}

                  <Field id={id("notes")} label={home ? "Indicaciones para la entrega" : "Notas para la clínica"} optional error={show("notes")} className="mt-5"
                    hint={`${form.notes.length}/${LIMITS.notes}`}>
                    <textarea {...text("notes", `${form.notes.length}/${LIMITS.notes}`)} rows={3} maxLength={LIMITS.notes}
                      placeholder={home ? "Ej.: dejar en portería, timbre dañado…" : "Ej.: quien recoge si no eres tú"} className={cn(controlClass, "resize-none py-3")} />
                  </Field>
                </section>

                <section className="rounded-3xl bg-card p-6 ring-1 ring-border sm:p-8" aria-labelledby="co-s3">
                  <h2 id="co-s3" className="font-display text-2xl"><span className="text-primary">3.</span> Pago</h2>
                  <fieldset className="mt-6">
                    <legend className="sr-only">Método de pago</legend>
                    <div className="grid gap-3">
                      {PAYMENT_METHODS.map((method, i) => (
                        <Choice key={method.value} id={i === 0 ? id("payment") : undefined} name="payment" value={method.value}
                          checked={form.payment === method.value}
                          label={method.value === "contraentrega" && !home ? "Pago en la clínica" : method.label}
                          detail={method.value === "contraentrega" && !home ? "Efectivo o datáfono al recoger" : method.detail}
                          onChange={(value) => set("payment", value as CheckoutForm["payment"])} />
                      ))}
                    </div>
                  </fieldset>
                  {form.payment !== "contraentrega" && (
                    <p className="enter mt-4 flex items-start gap-2 rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
                      <Lock className="mt-0.5 size-4 shrink-0 text-primary" />
                      En la versión final te llevaremos a una pasarela de pagos segura para completar el pago. En esta demostración no se piden datos bancarios.
                    </p>
                  )}

                  <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm">
                    <input id={id("consent")} type="checkbox" checked={form.consent} onChange={(e) => set("consent", e.target.checked)} onBlur={blur("consent")}
                      aria-invalid={show("consent") ? true : undefined} aria-describedby={describedBy(id("consent"), show("consent"))}
                      className="mt-0.5 size-4 shrink-0 accent-primary" />
                    <span>Autorizo el tratamiento de mis datos personales para gestionar este pedido y su entrega.</span>
                  </label>
                  {show("consent") && <p id={`${id("consent")}-error`} className="bubble mt-2 text-sm text-destructive">{show("consent")}</p>}
                </section>

                <div ref={alertRef} tabIndex={-1} role="alert" className="outline-none">
                  {error && <p className="bubble rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}
                  {!error && submitted && errorCount > 0 && (
                    <p className="text-sm text-destructive">Revisa {errorCount === 1 ? "el campo marcado" : `los ${errorCount} campos marcados`} antes de confirmar.</p>
                  )}
                </div>

                <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Link to="/tienda" className={buttonVariants({ variant: "ghost", size: "lg", className: "rounded-full" })}>Seguir comprando</Link>
                  <Button type="submit" size="lg" disabled={busy} aria-busy={busy} className="h-12 rounded-full px-8 text-base">
                    <Lock /> {busy ? "Procesando pedido…" : `Confirmar pedido · ${money(subtotal + shipping)}`}
                  </Button>
                </div>
              </form>

              <aside className="hidden lg:block" aria-labelledby="co-summary">
                <div className="sticky top-24 rounded-3xl bg-card p-6 ring-1 ring-border">
                  <h2 id="co-summary" className="mb-5 font-display text-2xl">Tu pedido</h2>
                  <OrderSummary lines={lines} subtotal={subtotal} shipping={shipping} delivery={form.delivery} onEditCart={() => setCartOpen(true)} />
                </div>
              </aside>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
