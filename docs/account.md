# Mi cuenta

Página `/mi-cuenta` con la información del usuario, sus compras y el historial de citas. Es una **interfaz simulada**: las cuentas son de demostración y no hay backend.

## Acceso

- Con sesión iniciada, el botón de cuenta de la barra superior muestra las iniciales y lleva a `/mi-cuenta`. **Cerrar sesión** está dentro de esa página (antes ese botón cerraba la sesión directamente).
- Sin sesión, el botón sigue abriendo el formulario de acceso, y `/mi-cuenta` muestra una invitación para entrar o crear cuenta.

## Contenido

- **Cabecera:** iniciales, saludo, correo y cuatro indicadores: compras, total comprado, próximas citas y mascotas.
- **Mi perfil:** nombre y correo, más las mascotas reconocidas por las citas (especie, número de citas y la más reciente).
- **Compras:** pedidos de la cuenta, del más reciente al más antiguo, con su estado, el detalle de productos, la entrega y el pago, y el botón **Volver a comprar**, que añade los productos a la cesta.
- **Citas:** próximas citas, que se pueden cancelar con confirmación, e historial de citas atendidas.

Las pestañas se reflejan en la URL (`#perfil`, `#compras`, `#citas`) y se recorren con las flechas, Inicio y Fin.

## Qué es simulado

- **Estado del pedido:** se calcula según el tiempo transcurrido desde la compra: recibido (< 1 h), preparando (< 24 h), en camino o listo para recoger (< 72 h) y entregado.
- **Sin datos de ejemplo:** la página muestra solo lo que la cuenta ha hecho. Una cuenta nueva ve mensajes de «aún no tienes compras» o «no tienes citas próximas». El historial de citas se llena cuando pasa la fecha de una cita reservada, porque el formulario no permite reservar fechas pasadas.
- **Datos personales:** solo se muestran el nombre y el correo de la cuenta. Teléfono, documento y direcciones no se guardan (ver [checkout.md](checkout.md#privacidad)).

Los pedidos y citas reales salen de `lumina:orders` y `lumina:bookings`, filtrados por el correo de la cuenta. Las compras hechas como invitado no aparecen.

## Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `src/pages/Account.tsx` | Página, pestañas, indicadores y carga de pedidos. |
| `src/components/account/` | Paneles de perfil, compras y citas, y piezas compartidas (estados, estados vacíos, fechas). |
| `src/lib/account.ts` | Estado simulado del pedido, separación de citas y lista de mascotas. Sin React, para poder probarlo con `node --test`. |
| `tests/account.test.mjs` | Pruebas de esa lógica. |

## Contrato para el backend

`GET /api/orders` debe devolver los pedidos de la sesión autenticada:

    {
      "orders": [
        { "id": "A1B2C3D4", "total": 35550, "createdAt": "2026-11-19T15:00:00.000Z",
          "items": [{ "id": 1, "qty": 1 }], "delivery": "domicilio", "payment": "pse" }
      ]
    }

Lo ideal es que el backend informe también el estado real del pedido (`status`) para reemplazar el cálculo simulado, y que ofrezca endpoints para editar el perfil, cambiar la contraseña y guardar direcciones. El servidor de ejemplo de `server/` no implementa `GET /api/orders` porque no tiene sesiones: sin autenticación expondría los pedidos de cualquiera.
