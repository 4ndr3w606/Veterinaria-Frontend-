// Reglas del formulario de compra. Sin React ni alias "@/" para poder probarlas con node --test.
import { FREE_SHIPPING, SHIPPING_COST } from "./constants.ts";

export type DocType = "CC" | "CE" | "PA" | "NIT";
export type DeliveryMethod = "domicilio" | "recoger";
export type PaymentMethod = "contraentrega" | "tarjeta" | "pse";

export type CheckoutForm = {
  name: string;
  email: string;
  phone: string;
  docType: DocType;
  docNumber: string;
  delivery: DeliveryMethod;
  department: string;
  city: string;
  address: string;
  neighborhood: string;
  addressExtra: string;
  notes: string;
  payment: PaymentMethod;
  consent: boolean;
};

export type CheckoutField = keyof CheckoutForm;
export type CheckoutErrors = Partial<Record<CheckoutField, string>>;

export const DOC_TYPES: { value: DocType; label: string }[] = [
  { value: "CC", label: "Cédula de ciudadanía" },
  { value: "CE", label: "Cédula de extranjería" },
  { value: "PA", label: "Pasaporte" },
  { value: "NIT", label: "NIT" },
];

export const DELIVERY_METHODS: { value: DeliveryMethod; label: string; detail: string }[] = [
  { value: "domicilio", label: "Envío a domicilio", detail: "De 2 a 4 días hábiles" },
  { value: "recoger", label: "Recoger en la clínica", detail: "Listo en 24 horas · Gratis" },
];

export const PAYMENT_METHODS: { value: PaymentMethod; label: string; detail: string }[] = [
  { value: "contraentrega", label: "Pago contra entrega", detail: "Efectivo o datáfono al recibir" },
  { value: "tarjeta", label: "Tarjeta débito o crédito", detail: "A través de la pasarela de pagos" },
  { value: "pse", label: "PSE", detail: "Débito desde tu cuenta bancaria" },
];

export const DEPARTMENTS = [
  "Amazonas", "Antioquia", "Arauca", "Atlántico", "Bogotá D. C.", "Bolívar", "Boyacá", "Caldas", "Caquetá",
  "Casanare", "Cauca", "Cesar", "Chocó", "Córdoba", "Cundinamarca", "Guainía", "Guaviare", "Huila", "La Guajira",
  "Magdalena", "Meta", "Nariño", "Norte de Santander", "Putumayo", "Quindío", "Risaralda",
  "San Andrés y Providencia", "Santander", "Sucre", "Tolima", "Valle del Cauca", "Vaupés", "Vichada",
];

export const EMPTY_CHECKOUT: CheckoutForm = {
  name: "", email: "", phone: "", docType: "CC", docNumber: "",
  delivery: "domicilio", department: "", city: "", address: "", neighborhood: "", addressExtra: "", notes: "",
  payment: "contraentrega", consent: false,
};

/** Orden en que aparecen los campos: el primero con error recibe el foco al enviar. */
export const FIELD_ORDER: CheckoutField[] = [
  "name", "email", "phone", "docType", "docNumber", "delivery", "department", "city", "address", "neighborhood",
  "addressExtra", "notes", "payment", "consent",
];

export const LIMITS = { name: 80, email: 120, docNumber: 12, city: 60, address: 100, neighborhood: 60, addressExtra: 60, notes: 200 };

/** Quita espacios, guiones, puntos y paréntesis; acepta el prefijo +57. */
export function normalizePhone(value: string) {
  const digits = value.replace(/[\s\-.()]/g, "");
  return digits.replace(/^(\+?57)(?=3\d{9}$)/, "");
}

export function shippingCost(subtotal: number, delivery: DeliveryMethod) {
  if (delivery === "recoger" || subtotal >= FREE_SHIPPING) return 0;
  return SHIPPING_COST;
}

/** Suma días hábiles (lunes a sábado, como atiende la clínica). No contempla festivos. */
export function addBusinessDays(from: Date, days: number) {
  const date = new Date(from);
  let left = days;
  while (left > 0) {
    date.setDate(date.getDate() + 1);
    if (date.getDay() !== 0) left--;
  }
  return date;
}

const DOC_RULES: Record<DocType, { pattern: RegExp; message: string }> = {
  CC: { pattern: /^\d{6,10}$/, message: "La cédula debe tener entre 6 y 10 dígitos, sin puntos." },
  CE: { pattern: /^[A-Za-z0-9]{6,12}$/, message: "Escribe entre 6 y 12 letras o números." },
  PA: { pattern: /^[A-Za-z0-9]{6,12}$/, message: "Escribe entre 6 y 12 letras o números." },
  NIT: { pattern: /^\d{9,10}$/, message: "El NIT debe tener 9 o 10 dígitos, sin guion ni dígito de verificación." },
};

/** Devuelve un mensaje por campo inválido. Un objeto vacío significa que el formulario está listo. */
export function validateCheckout(form: CheckoutForm): CheckoutErrors {
  const errors: CheckoutErrors = {};
  const name = form.name.trim();
  if (!name) errors.name = "Escribe tu nombre completo.";
  else if (name.split(/\s+/).length < 2 || name.length > LIMITS.name) errors.name = "Escribe tu nombre y apellido.";

  const email = form.email.trim();
  if (!email) errors.email = "Escribe tu correo.";
  else if (email.length > LIMITS.email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = "Revisa el correo: debe parecerse a nombre@correo.com.";

  if (!form.phone.trim()) errors.phone = "Escribe un celular de contacto.";
  else if (!/^3\d{9}$/.test(normalizePhone(form.phone))) errors.phone = "El celular debe tener 10 dígitos y empezar por 3.";

  if (!DOC_RULES[form.docType]) errors.docType = "Elige un tipo de documento.";
  else if (!form.docNumber.trim()) errors.docNumber = "Escribe tu número de documento.";
  else if (!DOC_RULES[form.docType].pattern.test(form.docNumber.trim())) errors.docNumber = DOC_RULES[form.docType].message;

  if (!DELIVERY_METHODS.some((method) => method.value === form.delivery)) errors.delivery = "Elige cómo quieres recibir tu pedido.";
  if (form.delivery === "domicilio") {
    if (!DEPARTMENTS.includes(form.department)) errors.department = "Elige el departamento.";
    if (!form.city.trim()) errors.city = "Escribe la ciudad o municipio.";
    else if (form.city.trim().length > LIMITS.city) errors.city = "El nombre es demasiado largo.";
    const address = form.address.trim();
    if (!address) errors.address = "Escribe la dirección de entrega.";
    else if (address.length < 6 || !/\d/.test(address) || address.length > LIMITS.address) errors.address = "Incluye calle o carrera y número, por ejemplo: Calle 10 # 5-20.";
    if (!form.neighborhood.trim()) errors.neighborhood = "Escribe el barrio.";
    else if (form.neighborhood.trim().length > LIMITS.neighborhood) errors.neighborhood = "El nombre es demasiado largo.";
    if (form.addressExtra.trim().length > LIMITS.addressExtra) errors.addressExtra = `Máximo ${LIMITS.addressExtra} caracteres.`;
  }
  if (form.notes.trim().length > LIMITS.notes) errors.notes = `Máximo ${LIMITS.notes} caracteres.`;

  if (!PAYMENT_METHODS.some((method) => method.value === form.payment)) errors.payment = "Elige un método de pago.";
  if (!form.consent) errors.consent = "Necesitamos tu autorización para gestionar el pedido.";
  return errors;
}

/** Datos que viajan con el pedido: limpios y sin campos de dirección cuando se recoge en la clínica. */
export function toOrderDetails(form: CheckoutForm) {
  const home = form.delivery === "domicilio";
  return {
    customer: {
      name: form.name.trim().replace(/\s+/g, " "),
      email: form.email.trim().toLowerCase(),
      phone: normalizePhone(form.phone),
      docType: form.docType,
      docNumber: form.docNumber.trim().toUpperCase(),
    },
    delivery: home
      ? {
          method: form.delivery,
          department: form.department,
          city: form.city.trim(),
          address: form.address.trim(),
          neighborhood: form.neighborhood.trim(),
          addressExtra: form.addressExtra.trim() || undefined,
          notes: form.notes.trim() || undefined,
        }
      : { method: form.delivery, notes: form.notes.trim() || undefined },
    payment: form.payment,
  };
}

export type OrderDetails = ReturnType<typeof toOrderDetails>;

// Borrador en memoria: sobrevive a ir y volver dentro de la web, pero no se guarda en el navegador
// porque incluye datos personales (documento, teléfono, dirección). Se pierde al recargar.
let draft: CheckoutForm | null = null;
export const readCheckoutDraft = () => draft;
export const saveCheckoutDraft = (form: CheckoutForm | null) => { draft = form; };
