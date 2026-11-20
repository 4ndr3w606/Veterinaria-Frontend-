import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY_CHECKOUT, addBusinessDays, normalizePhone, shippingCost, toOrderDetails, validateCheckout,
} from "../src/lib/checkout.ts";
import { FREE_SHIPPING, SHIPPING_COST } from "../src/lib/constants.ts";

const valid = {
  ...EMPTY_CHECKOUT,
  name: "Ana  Prueba", email: "Ana@Correo.com", phone: "+57 300 123 4567", docType: "CC", docNumber: "1075123456",
  delivery: "domicilio", department: "Huila", city: "Neiva", address: "Calle 10 # 5-20", neighborhood: "Centro",
  payment: "contraentrega", consent: true,
};

test("un formulario completo no tiene errores", () => {
  assert.deepEqual(validateCheckout(valid), {});
});

test("el formulario vacío marca todos los obligatorios y ninguno opcional", () => {
  const errors = validateCheckout(EMPTY_CHECKOUT);
  assert.deepEqual(Object.keys(errors).sort(), ["address", "city", "consent", "department", "docNumber", "email", "name", "neighborhood", "phone"].sort());
});

test("recoger en la clínica no exige dirección", () => {
  const form = { ...valid, delivery: "recoger", department: "", city: "", address: "", neighborhood: "" };
  assert.deepEqual(validateCheckout(form), {});
  const details = toOrderDetails(form);
  assert.equal(details.delivery.method, "recoger");
  assert.equal("address" in details.delivery, false);
});

test("valida celular colombiano, documento, correo y dirección", () => {
  assert.ok(validateCheckout({ ...valid, phone: "6012345678" }).phone);
  assert.ok(validateCheckout({ ...valid, phone: "30012345" }).phone);
  assert.equal(validateCheckout({ ...valid, phone: "300-123-4567" }).phone, undefined);
  assert.ok(validateCheckout({ ...valid, docNumber: "1.075.123" }).docNumber);
  assert.equal(validateCheckout({ ...valid, docType: "PA", docNumber: "AB123456" }).docNumber, undefined);
  assert.ok(validateCheckout({ ...valid, email: "ana@correo" }).email);
  assert.ok(validateCheckout({ ...valid, name: "Ana" }).name);
  assert.ok(validateCheckout({ ...valid, address: "Calle sin número" }).address);
  assert.ok(validateCheckout({ ...valid, department: "Narnia" }).department);
  assert.ok(validateCheckout({ ...valid, notes: "x".repeat(201) }).notes);
});

test("normaliza teléfono y limpia los datos enviados", () => {
  assert.equal(normalizePhone("+57 (300) 123-4567"), "3001234567");
  assert.equal(normalizePhone("573001234567"), "3001234567");
  const details = toOrderDetails({ ...valid, addressExtra: "  " });
  assert.equal(details.customer.name, "Ana Prueba");
  assert.equal(details.customer.email, "ana@correo.com");
  assert.equal(details.customer.phone, "3001234567");
  assert.equal(details.delivery.addressExtra, undefined);
});

test("calcula el envío según subtotal y método", () => {
  assert.equal(shippingCost(FREE_SHIPPING - 1, "domicilio"), SHIPPING_COST);
  assert.equal(shippingCost(FREE_SHIPPING, "domicilio"), 0);
  assert.equal(shippingCost(10000, "recoger"), 0);
});

test("los días hábiles saltan los domingos", () => {
  const saturday = new Date(2026, 10, 21);
  assert.equal(addBusinessDays(saturday, 1).getDate(), 23);
  assert.equal(addBusinessDays(new Date(2026, 10, 19), 2).getDate(), 21);
});
