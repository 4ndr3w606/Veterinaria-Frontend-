# Responsabilidades del estado del frontend

StoreProvider compone los hooks, conecta los cambios de sesión con las reservas y publica el contexto useStore. También mantiene los dos estados de apertura de la interfaz: authOpen y cartOpen.

| Módulo | Responsabilidad |
| --- | --- |
| src/lib/store/useAuth.ts | Cuentas de demostración en memoria, normalización del correo, registro, acceso y salida. Notifica los cambios de sesión mediante un callback. |
| src/lib/store/useCatalog.ts | Catálogo inicial, carga desde la API, estado de carga y catálogo local ante un fallo. |
| src/lib/store/useCart.ts | Carrito por cuenta o invitado, persistencia, cantidades, totales y envío de pedidos con los datos del formulario de compra (`checkout(details)`). |
| src/lib/store/useWishes.ts | Favoritos por cuenta o invitado y persistencia. |
| src/lib/store/useBookings.ts | Reservas, cambios de propietario, consulta de disponibilidad, creación, cancelación, refresco y errores. |
| src/lib/safeStorage.ts | Acceso tolerante a fallos al almacenamiento del navegador y lectura de JSON. |
| src/lib/glow.ts | Coordenadas del efecto visual de las tarjetas. |

## Compatibilidad

Los componentes conservan useStore y sus propiedades públicas. Los exports PRODUCTS, glow, money, FREE_SHIPPING, SERVICES, SLOTS y los tipos Booking/Product siguen disponibles desde src/lib/store.tsx.

El callback de sesión centraliza el reinicio de las reservas y la invalidación de solicitudes anteriores. Una respuesta pendiente de otra cuenta no puede reemplazar los datos del usuario actual. Los pedidos conservan el propietario del carrito que inició la compra aunque la cuenta cambie antes de recibir la respuesta.

Se mantiene un único contexto compartido. La separación organiza responsabilidades; no introduce suscripciones independientes ni promete reducir los renders de los consumidores.

La autenticación sigue siendo de demostración y la integración del backend conserva el contrato existente. No se añadieron dependencias.

## Comprobación de la extracción

Se compararon el proveedor original y el nuevo en el navegador con React y StrictMode reales, usando una API simulada. Pasaron 71 comprobaciones que incluyeron 32 estados equivalentes y el catálogo de respaldo, además de los cambios de cuenta con peticiones pendientes. También pasaron ESLint y la compilación de producción. Los archivos temporales de esta comparación se retiraron al terminar.
