export async function getJson(url: string, signal: AbortSignal, service = "Wikipedia") {
  const timeout = AbortSignal.timeout(10_000);
  try {
    const response = await fetch(url, {
      signal: AbortSignal.any([signal, timeout]),
      credentials: "omit",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      if (response.status === 404) throw new Error(`Esta ficha ya no está disponible en ${service}.`);
      if (response.status === 429) throw new Error(`${service} está recibiendo muchas consultas. Espera un momento y vuelve a intentarlo.`);
      throw new Error(`No pudimos conectar con ${service}. Inténtalo de nuevo en un momento.`);
    }
    return await response.json() as unknown;
  } catch (error) {
    signal.throwIfAborted();
    if (timeout.aborted) throw new Error(`${service} está tardando en responder. Vuelve a intentarlo.`, { cause: error });
    if (error instanceof TypeError) throw new Error(`No pudimos conectar con ${service}. Revisa tu conexión e inténtalo de nuevo.`, { cause: error });
    if (error instanceof SyntaxError) throw new Error(`${service} devolvió una respuesta que no pudimos leer.`, { cause: error });
    throw error;
  }
}
