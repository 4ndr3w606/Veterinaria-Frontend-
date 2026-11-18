# Contrato de reservas para el frontend

El modo local sigue disponible sin configurar VITE_API_URL. Cuando se configura una API, el frontend usa estos endpoints. El backend debe asociar las reservas a la sesión autenticada; el cliente no envía el correo del usuario como autoridad. El cliente envía cookies de sesión (credentials: include), por lo que una API en otro origen debe permitir credenciales en CORS.

## Listar mis reservas

GET /api/bookings

Respuesta 200:

    {
      "bookings": [
        {
          "id": "booking-id",
          "pet": "Milo",
          "species": "Perro",
          "service": "Consulta",
          "date": "2026-11-20",
          "time": "10:00"
        }
      ]
    }

La API devuelve únicamente reservas del usuario autenticado.

## Consultar disponibilidad

GET /api/bookings/availability?date=2026-11-20

Respuesta 200:

    {
      "date": "2026-11-20",
      "unavailableSlots": ["10:00", "14:00"]
    }

La respuesta solo incluye franjas ordinarias ocupadas. Las emergencias usan Atención Inmediata y no reservan una franja ordinaria. Este endpoint debe permitir consultar disponibilidad antes del inicio de sesión.

## Crear una reserva

POST /api/bookings

Cuerpo:

    {
      "pet": "Milo",
      "species": "Perro",
      "service": "Consulta",
      "date": "2026-11-20",
      "time": "10:00"
    }

Respuesta 201: objeto de reserva creado con id generado por el servidor. Para emergencias, el cuerpo incluye service: Emergencia y reason: texto; reason no se envía para servicios ordinarios. El backend debe validar los campos y comprobar la franja de forma atómica. Si otro usuario la reservó primero, responde 409:

    {
      "error": {
        "code": "SLOT_UNAVAILABLE",
        "message": "Ese horario ya está ocupado."
      }
    }

Errores de validación usan 422; sesión ausente usa 401.

## Cancelar una reserva

DELETE /api/bookings/{id}

Respuesta 204 sin cuerpo. El backend debe verificar que la reserva pertenezca a la sesión autenticada. Una reserva inexistente o ajena responde 404.


## Sincronización del frontend

- Al iniciar sesión, el frontend carga las reservas del usuario.
- Después de crear o cancelar una reserva, vuelve a pedir la lista al backend.
- Al volver a la pestaña y con el botón «Actualizar», consulta nuevamente las reservas.
- La disponibilidad se vuelve a consultar cuando cambia la lista de reservas.
- No hay sondeo continuo ni actualización en tiempo real; los cambios hechos desde otra sesión aparecen al volver a la pestaña o actualizar manualmente.

La URL exclusiva de reservas se configura con VITE_BOOKINGS_API_URL. Si no se define, se usa VITE_API_URL; si ninguna está configurada, se conserva el modo local. No se copian reservas remotas al almacenamiento local: el backend sigue siendo la fuente de verdad.
## Alcance

Este repositorio implementa el cliente y el modo local. Los endpoints anteriores son el contrato para el backend futuro; el servidor de ejemplo actual todavía no los implementa. El inicio de sesión actual también es de demostración y no crea una sesión del backend: la integración remota de reservas requiere conectar primero la autenticación real para establecer la cookie.
