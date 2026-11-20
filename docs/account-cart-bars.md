# Barras de cuenta y carrito

## Resultado de la revisión

Inicio y Tienda ya compartían el estado de StoreProvider, pero tenían dos implementaciones de los controles. Esto duplicaba los manejadores de cuenta y carrito, los contadores y sus estilos. Los iconos, tamaños y etiquetas variaban según la página. Además, en Inicio los controles salían de pantalla a 320 y 768 px.

## Cambios

- `src/components/layout/AccountBar.tsx`: componente compartido para entrar, ir a «Mi cuenta» y abrir el carrito (cerrar sesión se hace desde `/mi-cuenta`; ver [account.md](account.md)). Botones de 44 px, etiquetas accesibles con el número exacto de productos y contador visual limitado a `99+`. Permite añadir el enlace de Tienda y mostrar el saludo donde corresponde.
- `src/components/layout/Navbar.tsx`: utiliza AccountBar; ajusta los espacios y los puntos de cambio del menú para que la navegación y las acciones quepan en la cabecera.
- `src/components/layout/Logo.tsx`: permite mostrar solo el símbolo en la cabecera móvil. El texto completo sigue disponible en otros usos del logo.
- `src/pages/Shop.tsx`: utiliza el mismo AccountBar, con saludo en pantallas amplias. Los nombres largos se recortan visualmente.
- `src/components/sections/Auth.tsx`: elimina la antigua barra duplicada y conserva el formulario de autenticación.

Cada ruta monta una barra. AuthModal y CartDrawer siguen montados una sola vez en App. Hay un único elemento `data-cart-target` por página para la animación al añadir productos. El estado sigue perteneciendo a StoreProvider y sus hooks; la barra solo presenta los controles. Esta modificación corresponde al frontend y utiliza la autenticación de demostración existente.

## Comprobaciones realizadas

- `npm run lint`: sin errores.
- `npm run build`: compilación de TypeScript y producción correctas.
- Inicio y Tienda en 320, 640, 768, 1024, 1280 y 1440 px: botones de cabecera dentro de la pantalla, sin solapamientos y con un solo destino del carrito.
- Apertura de cuenta mediante teclado y apertura de carrito; cierre del carrito con Escape.
- Registro y entrada con datos ficticios, cierre de sesión desde ambas páginas y nombre largo sin desplazar los botones.
- Añadir productos, cambiar cantidades y navegar entre Inicio y Tienda conservando la sesión y el contador.
- Al salir se muestra el carrito del visitante; al volver a entrar se recupera el de la cuenta.
- Menú móvil: acceso a Tienda correcto.
- Consola de navegador sin errores ni advertencias durante la comprobación.

Las verificaciones de interfaz se hicieron manualmente en el navegador local. Se retiró el producto de prueba y se cerró la sesión al terminar.

## Hallazgo separado

El contenido principal de Inicio desbordaba horizontalmente a 320 px. Resuelto en `src/components/sections/Hero.tsx`: la columna de la cuadrícula usa `minmax(0, 1fr)` en móvil, el título baja su tamaño mínimo a 2.75rem y la etiqueta superior reduce su tamaño por debajo de `sm`. Verificado en Inicio, Tienda y Especies a 320, 375, 768 y 1280 px sin elementos fuera de pantalla.