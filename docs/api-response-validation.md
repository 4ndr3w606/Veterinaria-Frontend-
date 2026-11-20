# Validación de respuestas de la API

El cliente trata el JSON recibido como unknown y solo lo entrega a la interfaz después de validarlo con las funciones de src/lib/apiValidation.ts. Los campos adicionales se permiten para que el backend pueda ampliar sus respuestas.

| Operación | Respuesta que acepta |
| --- | --- |
| GET /api/products | Objeto con products: array de productos completos; IDs enteros positivos únicos, precios finitos no negativos y tipos de mascota reconocidos. |
| POST /api/orders | Objeto con id no vacío, total finito no negativo y createdAt como fecha/hora ISO con zona horaria. |
| GET /api/orders | Objeto con orders: array de pedidos con id, total, createdAt, items (id y qty enteros positivos), delivery (domicilio o recoger) y payment (contraentrega, tarjeta o pse); IDs únicos. |
| GET /api/bookings | Objeto con bookings: array de reservas completas e IDs únicos. |
| POST /api/bookings | Reserva completa con id, pet, species, service, date y time. email y reason son strings opcionales. |
| GET /api/bookings/availability | Objeto con date y unavailableSlots: array de horas HH:mm. La fecha debe coincidir con la solicitada. |
| DELETE /api/bookings/{id} | HTTP 204 sin cuerpo. |

Las fechas de reserva usan YYYY-MM-DD y deben existir en el calendario. Las horas usan HH:mm de 00:00 a 23:59; una reserva de emergencia también puede usar Atención Inmediata. Ese texto no es una franja ordinaria válida en unavailableSlots. Las reglas de negocio, como disponibilidad y permisos, corresponden al backend.

Se aceptan arrays vacíos. Se rechazan campos obligatorios ausentes, valores de tipos diferentes, null donde se espera un campo opcional tipado y listas con elementos inválidos. No se convierten números escritos como texto ni se descartan silenciosamente registros incorrectos.

Un JSON inválido o una respuesta con estructura incorrecta produce ApiError con code INVALID_API_RESPONSE. Un 204 en un endpoint que debe devolver datos también se rechaza. Los errores HTTP conservan su status y aceptan tanto { error: { message, code } } como { error: "mensaje" }, formato que usa el servidor de ejemplo.

Si un POST o DELETE responde con datos inválidos, la operación podría haberse realizado en el servidor. La interfaz pide comprobar su estado antes de repetirla; no se reintenta automáticamente.

Estos cambios validan respuestas en el frontend. No implementan endpoints ni autenticación en el servidor.

El chatbot Luma funciona localmente y no consulta /api/chat. Su antigua respuesta remota ya no forma parte del contrato del cliente.
