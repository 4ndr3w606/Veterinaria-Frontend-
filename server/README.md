# API de ejemplo de Lúmina

Servidor sin dependencias (solo Node 20 o superior). No necesitas instalar nada nuevo.

## Cómo usarla

1. En una terminal: `npm run api` → queda en `http://localhost:3001`.
2. En la raíz del proyecto crea un archivo `.env` con:

   ```
   VITE_API_URL=http://localhost:3001
   ```

3. En otra terminal: `npm run dev`. Reinicia `npm run dev` si ya estaba abierto (Vite lee el `.env` al arrancar).

Si **no** creas el `.env`, la web funciona igual en "modo local" (catálogo desde `src/data/products.json`, pedidos
guardados en el navegador y chat resuelto por `src/lib/bot.ts`). Si la API está configurada pero no responde, la tienda
muestra el catálogo local y avisa.

## Endpoints

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/api/health` | Comprueba que el servidor responde. |
| GET | `/api/products?cat=&pet=&q=` | Lista de productos (filtros opcionales). Responde `{ products }`. |
| GET | `/api/products/:id` | Un producto. |
| POST | `/api/orders` | Crea un pedido. Body: `{ "email": "a@b.com" \| null, "items": [{ "id": 1, "qty": 2 }] }`. El **total lo calcula el servidor** con los precios del catálogo. Responde `{ id, total, createdAt }`. |
| POST | `/api/chat` | Body: `{ "message": "...", "history": [] }`. Responde `{ text, chips?, actions? }`. |

Los pedidos se guardan en `server/data/orders.json` (carpeta ignorada por git).

## Para pasar a producción

- Reemplaza las zonas marcadas con `BD:` en `server.mjs` por tu base de datos.
- Define `CORS_ORIGIN` con el dominio de tu web (varios, separados por coma).
- Para que el chat use un modelo de IA, edita la función `answer()`. La clave del modelo va en variables de entorno
  **del servidor**; nunca la pongas en `src/` ni en un `VITE_...`, porque cualquiera puede leerla desde el navegador.
- Las cuentas siguen siendo de demostración (en `localStorage`). Antes de publicar, la autenticación debe pasar al servidor.
