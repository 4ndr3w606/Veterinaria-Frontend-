# Lúmina Animal Care

Sitio web de una clínica veterinaria: presentación de servicios, reserva de citas, tienda de productos para mascotas,
biblioteca de especies basada en Wikipedia y un asistente virtual (Luma).

## Páginas

| Ruta | Contenido |
|---|---|
| `/` | Inicio: presentación, servicios, estadísticas, ubicación, reseñas, preguntas frecuentes y formulario de citas (incluye la opción de emergencia). |
| `/tienda` | Catálogo con filtros, vista rápida, favoritos y carrito. |
| `/finalizar-compra` | Formulario de compra simulado: datos de contacto, entrega (domicilio o recogida), método de pago y confirmación ([detalles](docs/checkout.md)). |
| `/mi-cuenta` | Información del usuario, compras realizadas e historial de citas de la cuenta ([detalles](docs/account.md)). |
| `/especies` | Buscador de animales en Wikipedia en español, con fotografía y créditos de Wikimedia Commons. |

En todas las páginas están disponibles Luma, el acceso a la cuenta y el carrito.

## Tecnologías

React 19, TypeScript, Vite, Tailwind CSS 4, componentes shadcn/ui (Base UI), GSAP para animaciones y React Router.

## Requisitos

- Node.js 23.6 o superior. Los tests importan archivos `.ts` directamente, lo que requiere que Node pueda leer TypeScript sin compilar.
- npm.

## Puesta en marcha

```bash
npm install
npm run dev
```

La web queda en `http://localhost:5173`. Sin configuración adicional funciona en **modo local**: el catálogo sale de
`src/data/products.json` y los pedidos y reservas se guardan en el navegador.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo de Vite. |
| `npm run build` | Comprueba tipos y genera la versión de producción en `dist/`. |
| `npm run preview` | Sirve la versión de producción generada. |
| `npm run lint` | Revisa el código con ESLint. |
| `npm run typecheck` | Comprueba los tipos de TypeScript sin generar archivos. |
| `npm test` | Ejecuta los tests de `tests/` con el runner nativo de Node. |
| `npm run format` | Formatea los archivos `.ts` y `.tsx` con Prettier. |
| `npm run api` | Arranca la API de ejemplo en `http://localhost:3001` (ver [server/README.md](server/README.md)). |

## Conexión con un backend

Copia `.env.example` como `.env` y define las variables que necesites:

- `VITE_API_URL`: API general (catálogo, pedidos y reservas).
- `VITE_BOOKINGS_API_URL`: API solo para reservas. Si no se define, se usa `VITE_API_URL`.

Si ninguna está definida, la web sigue en modo local. La API de ejemplo de `server/` implementa catálogo y pedidos,
pero **no** los endpoints de reservas; su contrato está en [docs/booking-api-contract.md](docs/booking-api-contract.md).

Limitaciones actuales:

- Las cuentas son de demostración: viven en memoria del navegador. La sesión iniciada (solo nombre y correo, nunca la contraseña) se recuerda en `sessionStorage`, así que sobrevive a recargar la pestaña pero no a cerrarla. Tras cerrar sesión y recargar, hay que volver a crear la cuenta; el carrito, los pedidos y las citas se recuperan con el mismo correo.
- La compra es simulada: no hay pasarela de pagos ni cobros. El costo de envío ($12.000) es un valor de demostración.
- Luma responde con reglas locales (`src/lib/bot.ts`); no usa ningún servicio externo ni modelo de IA.

## Estructura

```
src/
  pages/            Páginas de cada ruta (Home, Shop, Checkout, Account, Species)
  components/
    sections/       Bloques de la página de inicio, autenticación y carrito
    shop/           Piezas de la tienda
    animals/        Biblioteca de especies
    checkout/       Campos, resumen y confirmación del formulario de compra
    account/        Paneles de perfil, compras y citas de «Mi cuenta»
    chat/           Panel de Luma
    animations/     Efectos reutilizables
    layout/         Navbar, Footer, Logo y barra de cuenta
    ui/             Componentes base de shadcn/ui
  lib/
    store.tsx       StoreProvider: reúne los hooks de lib/store/
    store/          Estado de cuenta, catálogo, carrito, favoritos y reservas
    api.ts          Cliente HTTP y modo local
    apiValidation.ts Validación de las respuestas de la API
    checkout.ts     Validación y reglas del formulario de compra
    account.ts      Estados simulados de pedidos, citas y mascotas de «Mi cuenta»
    bot.ts          Lógica de Luma
    wikipedia.ts    Búsqueda y fichas de Wikipedia
  data/             Catálogo de productos, especies sugeridas y textos del sitio
server/             API de ejemplo sin dependencias
tests/              Tests de Luma, del formulario de compra, de «Mi cuenta» y de la integración con Wikipedia
docs/               Decisiones de diseño y contratos de la API
```

## Documentación

- [Formulario de compra](docs/checkout.md)
- [Mi cuenta](docs/account.md)
- [Contrato de reservas](docs/booking-api-contract.md)
- [Validación de respuestas de la API](docs/api-response-validation.md)
- [Responsabilidades del store](docs/store-responsibilities.md)
- [Biblioteca animal](docs/animal-library.md)
- [Diseño de la página de especies](docs/species-design-review.md)
- [Luma y animaciones](docs/chat-and-animation-review.md)
- [Barras de cuenta y carrito](docs/account-cart-bars.md)
