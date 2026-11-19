import { test } from "node:test";
import assert from "node:assert/strict";
import { ANIMALS, ANIMAL_GROUPS, filterAnimals } from "../src/data/animals.ts";
import { fetchWikipediaArticle, parseSummary, parseImage, parseSearchResults, searchWikipedia } from "../src/lib/wikipedia.ts";

const summary = (overrides = {}) => ({ type: "standard", lang: "es", title: "Conejo", extract: "El conejo es un mamífero.",
  content_urls: { desktop: { page: "https://es.wikipedia.org/wiki/Oryctolagus_cuniculus" } },
  originalimage: { source: "https://upload.wikimedia.org/wikipedia/commons/a/ab/Conejo.jpg" }, ...overrides });
const imageInfo = (overrides = {}) => ({ query: { pages: [{ imageinfo: [{
  thumburl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Conejo.jpg/640px-Conejo.jpg",
  descriptionurl: "https://commons.wikimedia.org/wiki/File:Conejo.jpg",
  extmetadata: { Artist: { value: '<a href="https://example.org">Autor &amp; autora</a>' }, LicenseShortName: { value: "CC BY-SA 4.0" }, LicenseUrl: { value: "https://creativecommons.org/licenses/by-sa/4.0/" } },
  ...overrides,
}] }] } });
const json = (value) => new Response(JSON.stringify(value), { headers: { "Content-Type": "application/json" } });

const claim = (id, rank = "normal") => ({ rank, mainsnak: { snaktype: "value", datavalue: { type: "wikibase-entityid", value: { id, "entity-type": "item" } } } });
function mockAnimalSearch(t, pages, entities) {
  return t.mock.method(globalThis, "fetch", async (url) => {
    const request = new URL(url);
    if (request.pathname.includes("/search/")) return json({ pages });
    if (request.hostname === "es.wikipedia.org") return json({ query: { pages: pages.map(({ id, title, item, disambiguation }) => ({ pageid: id, title, pageprops: { ...(item ? { wikibase_item: item } : {}), ...(disambiguation ? { disambiguation: "" } : {}) } })) } });
    assert.equal(request.hostname, "www.wikidata.org");
    return json({ entities: Object.fromEntries(request.searchParams.get("ids").split("|").map(id => [id, { id, claims: entities[id] ?? {} }])) });
  });
}

test("filtra homónimos, plantas y desambiguaciones sin limitarse a las sugerencias", async (t) => {
  mockAnimalSearch(t, [
    { id: 1, title: "Panthera onca", item: "Q35694" },
    { id: 2, title: "Jaguar Cars", description: "Marca con un animal en el logo", item: "Q30055" },
    { id: 3, title: "Rosa", item: "Q34687" },
    { id: 4, title: "Jaguar (desambiguación)", item: "Q999101", disambiguation: true },
    { id: 5, title: "Sin clasificación" },
  ], {
    Q35694: { P171: [claim("Q127960")] }, Q127960: { P171: [claim("Q7377")] },
    Q30055: { P31: [claim("Q786820")] }, Q34687: { P31: [claim("Q16521")], P171: [claim("Q756")] },
    Q999101: { P171: [claim("Q729")] },
  });
  const results = await searchWikipedia("jaguar filtro", "page", new AbortController().signal);
  assert.deepEqual(results.map(r => r.title), ["Panthera onca"]);
});

test("conserva razas, nombres comunes e invertebrados por sus relaciones", async (t) => {
  mockAnimalSearch(t, [
    { id: 10, title: "Gato siamés", item: "Q42604" },
    { id: 11, title: "Pez", item: "Q152" },
    { id: 12, title: "Medusa", item: "Q999112" },
  ], {
    Q42604: { P31: [claim("Q43577")] }, Q43577: { P279: [claim("Q38829")] },
    Q152: { P31: [claim("Q55983715")], P13176: [claim("Q999113")] },
    Q999113: { P171: [claim("Q729")] }, Q999112: { P171: [claim("Q729")] },
  });
  assert.deepEqual((await searchWikipedia("razas y grupos", "title", new AbortController().signal)).map(r => r.title), ["Gato siamés", "Pez", "Medusa"]);
});

test("no acepta humanos, temas sobre animales ni relaciones obsoletas y termina los ciclos", async (t) => {
  mockAnimalSearch(t, [
    { id: 20, title: "Persona", item: "Q999120" },
    { id: 21, title: "Película de animales", item: "Q999121" },
    { id: 22, title: "Clasificación antigua", item: "Q999122" },
    { id: 23, title: "Ciclo", item: "Q999123" },
  ], {
    Q999120: { P31: [claim("Q5")] }, Q5: { P279: [claim("Q729")] },
    Q999121: { P921: [claim("Q729")] },
    Q999122: { P171: [claim("Q729", "deprecated")] },
    Q999123: { P171: [claim("Q999124")] }, Q999124: { P171: [claim("Q999123")] },
  });
  assert.deepEqual(await searchWikipedia("exclusiones filtro", "page", new AbortController().signal), []);
});

test("un fallo de Wikidata no muestra resultados sin verificar y permite reintentar", async (t) => {
  const route = mockAnimalSearch(t, [{ id: 30, title: "Animal reintentable", item: "Q999130" }], { Q999130: { P171: [claim("Q729")] } });
  let failed = false;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    if (new URL(url).hostname === "www.wikidata.org" && !failed) {
      failed = true;
      return new Response("limited", { status: 429 });
    }
    return route(url, options);
  });
  const signal = new AbortController().signal;
  await assert.rejects(searchWikipedia("fallo clasificación", "page", signal), /Wikidata.*muchas consultas/);
  assert.equal((await searchWikipedia("fallo clasificación", "page", signal))[0].title, "Animal reintentable");
});

test("rechaza respuestas de clasificación incompletas o malformadas", async (t) => {
  const route = mockAnimalSearch(t, [{ id: 31, title: "Ficha por validar", item: "Q999131" }], {});
  let payload;
  let brokenHost = "es.wikipedia.org";
  t.mock.method(globalThis, "fetch", async (url, options) => {
    const request = new URL(url);
    return !request.pathname.includes("/search/") && request.hostname === brokenHost ? json(payload) : route(url, options);
  });
  const signal = new AbortController().signal;
  for (payload of [{}, { query: { pages: [] } }, { query: { pages: [{ pageid: 31, pageprops: { wikibase_item: "Q1|Q2" } }] } }]) {
    await assert.rejects(searchWikipedia("estructura clasificación", "page", signal), /verificar la clasificación/);
  }
  brokenHost = "www.wikidata.org";
  for (payload of [{ error: { code: "maxlag" } }, { entities: {} }, { entities: { Q999131: { id: "Q999131", claims: { P171: "Q729" } } } }]) {
    await assert.rejects(searchWikipedia("estructura clasificación", "page", signal), /verificar la clasificación/);
  }
});

test("abortar durante la clasificación no devuelve ni cachea la búsqueda", async (t) => {
  const route = mockAnimalSearch(t, [{ id: 32, title: "Animal cancelado", item: "Q999132" }], { Q999132: { P171: [claim("Q729")] } });
  const controller = new AbortController();
  let block = true;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    if (new URL(url).hostname === "www.wikidata.org" && block) {
      controller.abort();
      options.signal.throwIfAborted();
    }
    return route(url, options);
  });
  await assert.rejects(searchWikipedia("cancelación clasificación", "page", controller.signal), { name: "AbortError" });
  block = false;
  assert.equal((await searchWikipedia("cancelación clasificación", "page", new AbortController().signal)).length, 1);
});

test("agrupa entidades y reutiliza su clasificación hasta que vence", async (t) => {
  const mockFetch = mockAnimalSearch(t, [
    { id: 33, title: "Animal A", item: "Q999133" }, { id: 34, title: "Animal B", item: "Q999134" },
  ], { Q999133: { P171: [claim("Q729")] }, Q999134: { P171: [claim("Q729")] } });
  const signal = new AbortController().signal;
  const now = Date.now();
  await searchWikipedia("clasificación compartida", "page", signal);
  const dataRequests = () => mockFetch.mock.calls.map(call => new URL(call.arguments[0])).filter(url => url.hostname === "www.wikidata.org");
  assert.equal(dataRequests().length, 1);
  assert.deepEqual(dataRequests()[0].searchParams.get("ids").split("|").sort(), ["Q999133", "Q999134"]);
  t.mock.method(Date, "now", () => now + 6 * 60 * 1000);
  await searchWikipedia("clasificación compartida", "page", signal);
  assert.equal(dataRequests().length, 1);
  t.mock.method(Date, "now", () => now + 31 * 60 * 1000);
  await searchWikipedia("clasificación compartida", "page", signal);
  assert.equal(dataRequests().length, 2);
});

test("da prioridad a relaciones preferidas y admite datos desconocidos sin inventar una clasificación", async (t) => {
  mockAnimalSearch(t, [
    { id: 35, title: "Clasificación corregida", item: "Q999135" }, { id: 36, title: "Clasificación desconocida", item: "Q999136" },
  ], {
    Q999135: { P171: [claim("Q729"), claim("Q756", "preferred")] },
    Q999136: { P171: [{ rank: "normal", mainsnak: { snaktype: "somevalue" } }] },
  });
  assert.deepEqual(await searchWikipedia("rangos clasificación", "page", new AbortController().signal), []);
});

test("limita las consultas aunque la jerarquía no termine", async (t) => {
  const entities = Object.fromEntries(Array.from({ length: 30 }, (_, n) => [`Q${999200 + n}`, { P171: [claim(`Q${999201 + n}`)] }]));
  const mockFetch = mockAnimalSearch(t, [{ id: 40, title: "Jerarquía larga", item: "Q999200" }], entities);
  assert.deepEqual(await searchWikipedia("límite clasificación", "page", new AbortController().signal), []);
  assert.ok(mockFetch.mock.callCount() <= 14);
});

test("deja de consultar ramas alternativas cuando el animal ya está confirmado", async (t) => {
  const mockFetch = mockAnimalSearch(t, [{ id: 41, title: "Animal con varias clasificaciones", item: "Q999270" }], {
    Q999270: { P171: [claim("Q999271"), claim("Q729")] },
    Q999271: { P171: [claim("Q999272")] },
  });
  assert.equal((await searchWikipedia("ramas alternativas", "page", new AbortController().signal)).length, 1);
  assert.equal(mockFetch.mock.callCount(), 3);
});

test("busca animales fuera del catálogo y separa los filtros de búsqueda", async (t) => {
  const mockFetch = mockAnimalSearch(t, [{ id: 78157, title: "Ambystoma mexicanum", description: "especie de anfibio", item: "Q22718" }],
    { Q22718: { P171: [claim("Q10908")] } });
  const signal = new AbortController().signal;
  const results = await searchWikipedia(" ajolote ", "page", signal);
  assert.equal(results[0].title, "Ambystoma mexicanum");
  assert.equal(ANIMALS.some(animal => animal.title === results[0].title), false);
  const first = new URL(mockFetch.mock.calls[0].arguments[0]);
  assert.equal(first.pathname, "/w/rest.php/v1/search/page");
  assert.equal(first.searchParams.get("q"), "ajolote");
  assert.equal(first.searchParams.get("limit"), "20");
  const calls = mockFetch.mock.callCount();
  await searchWikipedia("AJOLOTE", "page", signal);
  assert.equal(mockFetch.mock.callCount(), calls);
  await searchWikipedia("ajolote", "title", signal);
  assert.equal(new URL(mockFetch.mock.calls[calls].arguments[0]).pathname, "/w/rest.php/v1/search/title");
  assert.ok(mockFetch.mock.calls.every(call => call.arguments[1].credentials === "omit"));
});

test("valida resultados, permite búsquedas vacías y elimina duplicados sin inyectar extractos HTML", () => {
  assert.deepEqual(parseSearchResults({ pages: [] }), []);
  for (const value of [null, {}, { pages: {} }, { pages: [{ id: 1, title: 5 }] }, { pages: [{ id: 1, title: "Caballo", description: {} }] }]) assert.throws(() => parseSearchResults(value));
  const parsed = parseSearchResults({ pages: [{ id: 1, title: "Caballo", description: null, excerpt: "<script>test</script>" }, { id: 1, title: "Caballo" }] });
  assert.deepEqual(parsed, [{ pageId: 1, name: "Caballo", title: "Caballo", description: "Artículo de Wikipedia" }]);
});

test("consulta vacía o inválida no genera solicitudes", async (t) => {
  const mockFetch = t.mock.method(globalThis, "fetch", async () => { throw new Error("No debe consultar"); });
  for (const query of ["", "  ", "a", "x".repeat(101)]) await assert.rejects(searchWikipedia(query, "page", new AbortController().signal), /2 y 100/);
  await assert.rejects(searchWikipedia("caballo", "invalid", new AbortController().signal), /tipo de búsqueda/);
  assert.equal(mockFetch.mock.callCount(), 0);
});

test("un error de búsqueda puede reintentarse y no queda en caché", async (t) => {
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => ++calls === 1 ? new Response("failed", { status: 503 }) : json({ pages: [] }));
  await assert.rejects(searchWikipedia("animal prueba error", "page", new AbortController().signal), /conectar/);
  assert.deepEqual(await searchWikipedia("animal prueba error", "page", new AbortController().signal), []);
  assert.equal(calls, 2);
});

test("abortar una búsqueda pendiente impide guardarla en caché", async (t) => {
  t.mock.method(globalThis, "fetch", (_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener("abort", () => reject(options.signal.reason), { once: true })));
  const controller = new AbortController();
  const pending = searchWikipedia("tucan prueba cancelación", "page", controller.signal);
  controller.abort();
  await assert.rejects(pending, { name: "AbortError" });
  t.mock.restoreAll();
  const mockFetch = t.mock.method(globalThis, "fetch", async () => json({ pages: [] }));
  await searchWikipedia("tucan prueba cancelación", "page", new AbortController().signal);
  assert.equal(mockFetch.mock.callCount(), 1);
});

test("la caché de búsquedas vence después de cinco minutos", async (t) => {
  const mockFetch = t.mock.method(globalThis, "fetch", async () => json({ pages: [] }));
  await searchWikipedia("tortuga prueba caché", "page", new AbortController().signal);
  const now = Date.now();
  t.mock.method(Date, "now", () => now + 6 * 60 * 1000);
  await searchWikipedia("tortuga prueba caché", "page", new AbortController().signal);
  assert.equal(mockFetch.mock.callCount(), 2);
});

test("el catálogo incluye todos los grupos, títulos únicos y búsqueda sin acentos", () => {
  assert.equal(new Set(ANIMALS.map((animal) => animal.title)).size, ANIMALS.length);
  for (const group of ANIMAL_GROUPS.slice(1)) assert.ok(filterAnimals("", group, "Todos").length);
  assert.equal(filterAnimals("  SIAMES  ", "Gatos", "Raza")[0].name, "Gato siamés");
  assert.equal(filterAnimals("cavia", "Todos", "Todos")[0].name, "Cobaya");
  assert.equal(filterAnimals("curi", "Todos", "Todos")[0].name, "Cobaya");
  assert.equal(filterAnimals("", "Aves", "Raza").length, 0);
  assert.equal(filterAnimals("unicornio", "Todos", "Todos").length, 0);
  assert.equal(filterAnimals("", "Todos", "Todos").length, ANIMALS.length);
});

test("rechaza respuestas inválidas, desambiguaciones e idioma incorrecto", () => {
  for (const value of [null, [], {}, summary({ type: "disambiguation" }), summary({ lang: "en" }), summary({ extract: " " }), summary({ title: 3 })]) {
    assert.throws(() => parseSummary(value), /ficha incompleta/);
  }
  assert.equal(parseSummary(summary({ originalimage: undefined })).original, undefined);
});

test("solo acepta enlaces y fotografías de los dominios esperados", () => {
  for (const page of ["javascript:alert(1)", "https://es.wikipedia.org.evil.test/wiki/Conejo", "https://evil.test/wiki/Conejo", "http://es.wikipedia.org/wiki/Conejo", "https://user:pass@es.wikipedia.org/wiki/Conejo"]) {
    assert.throws(() => parseSummary(summary({ content_urls: { desktop: { page } } })));
  }
  assert.equal(parseSummary(summary({ originalimage: { source: "https://evil.test/cat.jpg" } })).original, undefined);
  assert.equal(parseSummary(summary({ originalimage: { source: "https://upload.wikimedia.org/wikipedia/commons/a/ab/Cat.gif" } })).original, undefined);
  assert.throws(() => parseImage(imageInfo({ thumburl: "data:text/html,hello" })));
  assert.throws(() => parseImage(imageInfo({ extmetadata: {} })));
  assert.equal(parseImage(imageInfo()).author, "Autor & autora");
});

test("carga una ficha, obtiene sus créditos y reutiliza la caché", async (t) => {
  let calls = 0;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls++;
    assert.equal(options.credentials, "omit");
    if (calls === 1) { assert.match(url, /page\/summary\/Prueba_cache/); return json(summary()); }
    assert.match(url, /commons.wikimedia.org/);
    assert.equal(new URL(url).searchParams.get("titles"), "File:Conejo.jpg");
    return json(imageInfo());
  });
  const article = await fetchWikipediaArticle("Prueba cache", new AbortController().signal);
  assert.equal(article.imageStatus, "ready");
  assert.equal(article.image.author, "Autor & autora");
  assert.deepEqual(await fetchWikipediaArticle("Prueba cache", new AbortController().signal), article);
  assert.equal(calls, 2);
  await assert.rejects(fetchWikipediaArticle("Prueba cache", AbortSignal.abort()), { name: "AbortError" });
});

test("una ficha sin imagen conserva el resumen y no consulta Commons", async (t) => {
  const mockFetch = t.mock.method(globalThis, "fetch", async () => json(summary({ originalimage: undefined })));
  const article = await fetchWikipediaArticle("Prueba sin imagen", new AbortController().signal);
  assert.equal(article.imageStatus, "missing");
  assert.ok(article.extract);
  assert.equal(mockFetch.mock.callCount(), 1);
});

test("obtiene el archivo correcto cuando originalimage contiene una miniatura", async (t) => {
  t.mock.method(globalThis, "fetch", async (url) => {
    if (url.includes("page/summary/")) return json(summary({ originalimage: { source: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Conejo.jpg/3840px-Conejo.jpg?utm_source=api" } }));
    assert.equal(new URL(url).searchParams.get("titles"), "File:Conejo.jpg");
    return json(imageInfo());
  });
  assert.equal((await fetchWikipediaArticle("Prueba miniatura original", new AbortController().signal)).imageStatus, "ready");
});

test("la caché vence y vuelve a consultar Wikipedia", async (t) => {
  const mockFetch = t.mock.method(globalThis, "fetch", async () => json(summary({ originalimage: undefined })));
  const now = Date.now();
  await fetchWikipediaArticle("Prueba vencimiento", new AbortController().signal);
  t.mock.method(Date, "now", () => now + 31 * 60 * 1000);
  await fetchWikipediaArticle("Prueba vencimiento", new AbortController().signal);
  assert.equal(mockFetch.mock.callCount(), 2);
});

test("un fallo de imagen conserva el texto y permite reintentar sin cachear el fallo", async (t) => {
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    calls++;
    if (calls % 2) return json(summary());
    return calls === 2 ? new Response("Unavailable", { status: 503 }) : json(imageInfo());
  });
  const failed = await fetchWikipediaArticle("Prueba parcial", new AbortController().signal);
  assert.equal(failed.imageStatus, "error");
  assert.ok(failed.extract);
  assert.equal(failed.image, undefined);
  const retried = await fetchWikipediaArticle("Prueba parcial", new AbortController().signal);
  assert.equal(retried.imageStatus, "ready");
  assert.equal(calls, 4);
});

test("traduce HTTP, red y JSON inválido a errores comprensibles", async (t) => {
  for (const [status, pattern] of [[404, /no está disponible/], [429, /muchas consultas/], [503, /No pudimos conectar/]]) {
    t.mock.method(globalThis, "fetch", async () => new Response("failure", { status }));
    await assert.rejects(fetchWikipediaArticle(`Prueba HTTP ${status}`, new AbortController().signal), pattern);
    t.mock.restoreAll();
  }
  t.mock.method(globalThis, "fetch", async () => { throw new TypeError("Failed to fetch"); });
  await assert.rejects(fetchWikipediaArticle("Prueba red", new AbortController().signal), /Revisa tu conexión/);
  t.mock.restoreAll();
  t.mock.method(globalThis, "fetch", async () => new Response("<html>error</html>"));
  await assert.rejects(fetchWikipediaArticle("Prueba JSON", new AbortController().signal), /no pudimos leer/);
});

test("cancela consultas pendientes sin devolver ni cachear resultados anteriores", async (t) => {
  t.mock.method(globalThis, "fetch", (_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener("abort", () => reject(options.signal.reason), { once: true });
  }));
  const controller = new AbortController();
  const pending = fetchWikipediaArticle("Prueba cancelación", controller.signal);
  controller.abort();
  await assert.rejects(pending, { name: "AbortError" });
  t.mock.restoreAll();
  const nextFetch = t.mock.method(globalThis, "fetch", async () => json(summary({ originalimage: undefined })));
  await fetchWikipediaArticle("Prueba cancelación", new AbortController().signal);
  assert.equal(nextFetch.mock.callCount(), 1);
});

test("un tiempo de espera agotado muestra un mensaje y termina la consulta", async (t) => {
  t.mock.method(AbortSignal, "timeout", () => AbortSignal.abort(new DOMException("Timed out", "TimeoutError")));
  t.mock.method(globalThis, "fetch", async (_url, options) => { options.signal.throwIfAborted(); });
  await assert.rejects(fetchWikipediaArticle("Prueba timeout", new AbortController().signal), /tardando en responder/);
});
