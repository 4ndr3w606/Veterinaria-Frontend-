import { getJson } from "./wikimedia.ts";

const WIKIPEDIA_API = "https://es.wikipedia.org/w/api.php";
const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const properties = ["P31", "P171", "P279", "P13176"] as const;
type Relations = Record<(typeof properties)[number], string[]>;
const cache = new Map<string, { relations: Relations; expires: number }>();
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const entityId = (value: unknown): value is string => typeof value === "string" && /^Q[1-9]\d*$/.test(value);
const invalid = () => new Error("No pudimos verificar la clasificación de los resultados. Inténtalo de nuevo.");

// Animalia y grupos animales: puntos de llegada, no una lista cerrada de especies.
// Incluye Mammalia, Aves, Reptilia, Amphibia, Insecta, Chondrichthyes,
// Felidae, Vertebrata, Arthropoda y Mollusca para acortar recorridos frecuentes.
const animalRoots = new Set(["Q729", "Q7377", "Q5113", "Q10811", "Q10908", "Q1390", "Q25371",
  "Q25265", "Q25241", "Q1360", "Q25326"]);
const BREED = "Q38829";
const COMMON_NAME = "Q55983715";

function parseRelations(value: unknown): Relations {
  if (!record(value)) throw invalid();
  return Object.fromEntries(properties.map(property => {
    const claims = value[property] ?? [];
    if (!Array.isArray(claims)) throw invalid();
    const active = claims.filter(claim => {
      if (!record(claim) || !["normal", "preferred", "deprecated"].includes(String(claim.rank)) || !record(claim.mainsnak)) throw invalid();
      return claim.rank !== "deprecated";
    });
    const preferred = active.some(claim => claim.rank === "preferred");
    const ids = active.filter(claim => !preferred || claim.rank === "preferred").flatMap(claim => {
      const snak = claim.mainsnak;
      if (snak.snaktype === "novalue" || snak.snaktype === "somevalue") return [];
      if (snak.snaktype !== "value" || !record(snak.datavalue) || !record(snak.datavalue.value) ||
        snak.datavalue.type !== "wikibase-entityid" || snak.datavalue.value["entity-type"] !== "item" || !entityId(snak.datavalue.value.id)) throw invalid();
      return [snak.datavalue.value.id];
    });
    return [property, ids];
  })) as Relations;
}

async function pageEntities(pageIds: number[], signal: AbortSignal) {
  const params = new URLSearchParams({ action: "query", format: "json", formatversion: "2", origin: "*",
    prop: "pageprops", ppprop: "wikibase_item|disambiguation", pageids: pageIds.join("|") });
  const value = await getJson(`${WIKIPEDIA_API}?${params}`, signal);
  if (!record(value) || !record(value.query) || !Array.isArray(value.query.pages)) throw invalid();
  const entities = new Map<number, string>();
  const seen = new Set<number>();
  for (const page of value.query.pages) {
    if (!record(page) || typeof page.pageid !== "number" || !pageIds.includes(page.pageid) || seen.has(page.pageid)) throw invalid();
    seen.add(page.pageid);
    if ("missing" in page || page.pageprops === undefined) continue;
    if (!record(page.pageprops)) throw invalid();
    if ("disambiguation" in page.pageprops || page.pageprops.wikibase_item === undefined) continue;
    if (!entityId(page.pageprops.wikibase_item)) throw invalid();
    entities.set(page.pageid, page.pageprops.wikibase_item);
  }
  if (seen.size !== pageIds.length) throw invalid();
  return entities;
}

async function loadRelations(ids: string[], signal: AbortSignal) {
  const params = new URLSearchParams({ action: "wbgetentities", format: "json", origin: "*", props: "claims", ids: ids.join("|") });
  const value = await getJson(`${WIKIDATA_API}?${params}`, signal, "Wikidata");
  if (!record(value) || !record(value.entities)) throw invalid();
  // Validar el lote completo antes de guardarlo: una respuesta parcial no es un resultado negativo.
  const entries = ids.map(id => {
    const entity = (value.entities as Record<string, unknown>)[id];
    if (!record(entity) || entity.id !== id) throw invalid();
    return [id, parseRelations("missing" in entity ? {} : entity.claims)] as const;
  });
  signal.throwIfAborted();
  for (const [id, relations] of entries) {
    if (cache.size >= 400) cache.delete(cache.keys().next().value!);
    cache.set(id, { relations, expires: Date.now() + 30 * 60 * 1000 });
  }
  return entries;
}

export async function filterAnimalResults<T extends { pageId: number }>(results: T[], signal: AbortSignal): Promise<T[]> {
  signal.throwIfAborted();
  if (!results.length) return [];
  const deadline = AbortSignal.timeout(20_000);
  const requestSignal = AbortSignal.any([signal, deadline]);
  try {
    const entities = await pageEntities(results.map(result => result.pageId), requestSignal);
    const local = new Map<string, Relations>();
    const needed = new Set<string>();
    const pending = new Set<string>();
    const read = (id: string) => {
      const saved = cache.get(id);
      if (!local.has(id) && saved && saved.expires > Date.now()) local.set(id, saved.relations);
      const relations = local.get(id);
      if (!relations) pending.add(id);
      return relations;
    };
    const reaches = (id: string, mode: "animal" | "breed", visited = new Set<string>()): boolean => {
      if (mode === "animal" ? animalRoots.has(id) : id === BREED) return true;
      if (["Q756", "Q764", "Q25314"].includes(id)) return false; // Plantas, hongos y angiospermas.
      if (visited.has(id) || visited.size >= (mode === "breed" ? 3 : 24)) return false;
      const relations = read(id);
      if (!relations) return false;
      const path = new Set(visited).add(id);
      const parents = mode === "breed" ? relations.P279 : [
        ...relations.P171,
        ...(relations.P31.includes(COMMON_NAME) ? [...relations.P13176, ...relations.P279] : []),
      ];
      return parents.some(parent => reaches(parent, mode, path));
    };
    // Un máximo de 12 lotes de 50 entidades. Los límites también protegen frente a grafos cíclicos o muy amplios.
    for (let batch = 0; batch <= 12; batch++) {
      requestSignal.throwIfAborted();
      needed.clear();
      const accepted = results.filter(result => {
        pending.clear();
        const id = entities.get(result.pageId);
        const relations = id ? read(id) : undefined;
        const confirmed = id && (reaches(id, "animal") ||
          (!relations?.P171.length && relations?.P31.some(kind => reaches(kind, "breed"))));
        if (!confirmed) pending.forEach(entity => needed.add(entity));
        return confirmed;
      });
      if (!needed.size || batch === 12) return accepted;
      for (const [id, relations] of await loadRelations([...needed].slice(0, 50), requestSignal)) local.set(id, relations);
    }
    return [];
  } catch (error) {
    signal.throwIfAborted();
    if (deadline.aborted) throw new Error("La verificación de animales está tardando demasiado. Vuelve a intentarlo.", { cause: error });
    throw error;
  }
}
