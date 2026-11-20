# Formulario de compra

El botón **Finalizar compra** de la cesta lleva a `/finalizar-compra`. Ahí se piden los datos de contacto, entrega y pago, y se muestra el resumen del pedido. La compra es **simulada**: no se piden datos bancarios ni se realiza ningún cobro.

## Flujo

1. **Tus datos:** nombre y apellido, correo, celular (10 dígitos que empiezan por 3; se acepta `+57`, espacios y guiones), tipo y número de documento. Si hay una sesión iniciada, se completan el nombre y el correo.
2. **Entrega:** envío a domicilio (departamento, ciudad o municipio, dirección, barrio y, opcionalmente, apartamento o torre) o recogida en la clínica, que no pide dirección. Las indicaciones son opcionales (máximo 200 caracteres).
3. **Pago:** contra entrega (o en la clínica al recoger), tarjeta o PSE. Para tarjeta y PSE solo se informa que la versión final llevará a una pasarela de pagos.
4. **Autorización de datos personales:** casilla obligatoria.
5. **Confirmación:** número de pedido, dirección o recogida, fecha estimada (días hábiles de lunes a sábado, sin festivos), método de pago y resumen. La cesta se vacía.

Los errores aparecen al salir de cada campo o al enviar. Al enviar con errores, el foco va al primer campo inválido y se indica cuántos campos hay que revisar.

## Envío

- Gratis desde `FREE_SHIPPING` ($150.000) o al recoger en la clínica.
- Por debajo, `SHIPPING_COST` ($12.000). **Es un valor de demostración**, definido en `src/lib/constants.ts` y repetido en `server/server.mjs`.

## Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `src/lib/checkout.ts` | Campos, listas (documentos, departamentos, métodos), validación, cálculo de envío, días hábiles y datos que se envían. Sin React, para poder probarlo con `node --test`. |
| `src/pages/Checkout.tsx` | Página, estado del formulario, envío y estados vacío y confirmado. |
| `src/components/checkout/` | Campos reutilizables, resumen del pedido y confirmación. |
| `tests/checkout.test.mjs` | Validación, normalización, envío y días hábiles. |

## Privacidad

El borrador del formulario vive solo en memoria: se conserva al ir y volver dentro de la web, pero se pierde al recargar. En modo local, `lumina:orders` guarda únicamente id, total, fecha, productos, método de entrega y método de pago; **no** guarda nombre, documento, teléfono ni dirección.

## Contrato para el backend

`POST /api/orders`

    {
      "email": "cuenta@correo.com",
      "items": [{ "id": 1, "qty": 2 }],
      "customer": { "name": "Ana Prueba", "email": "ana@correo.com", "phone": "3001234567", "docType": "CC", "docNumber": "1075123456" },
      "delivery": {
        "method": "domicilio",
        "department": "Huila", "city": "Neiva", "address": "Calle 10 # 5-20", "neighborhood": "Centro",
        "addressExtra": "Apto 301", "notes": "Dejar en portería"
      },
      "payment": "contraentrega"
    }

- `email` es la cuenta que compra (`null` para invitados). El correo de contacto va en `customer.email`.
- Con `"method": "recoger"`, `delivery` solo lleva `method` y, opcionalmente, `notes`.
- `payment`: `contraentrega`, `tarjeta` o `pse`.
- `docType`: `CC`, `CE`, `PA` o `NIT`.
- Los campos opcionales vacíos no se envían.

Respuesta `201`: `{ id, total, createdAt }`. El servidor calcula `total` como precios del catálogo más el envío y vuelve a validar todos los datos; nunca debe confiar en el navegador. Si el `total` difiere del que mostró la página, la confirmación muestra el valor registrado por la tienda.

Pendiente para producción: integrar una pasarela de pagos para tarjeta y PSE (el pedido quedaría "pendiente de pago" hasta su confirmación), enviar el correo de confirmación y asociar el pedido a la sesión autenticada.
