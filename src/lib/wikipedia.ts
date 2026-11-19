import { filterAnimalResults } from "./animalClassification.ts";
import { getJson } from "./wikimedia.ts";

export type WikiImage = {
  source: string;
  author: string;
  license: string;
  licenseUrl?: string;
  page: string;
};

export type WikiArticle = {
  title: string;
  extract: string;
  page: string;
  image?: WikiImage;
  imageStatus: "ready" | "missing" | "error";
};

const SUMMARY_API = "https://es.wikipedia.org/api/rest_v1/page/summary/";
const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const CACHE_TTL = 30 * 60 * 1000;
const cache = new Map<string, { article: WikiArticle; expires: number }>();
export type WikiSearchScope = "page" | "title";
export type WikiSearchResult = { pageId: number; name: string; title: string; description: string };
const searchCache = new Map<string, { results: WikiSearchResult[]; expires: number }>();
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

function safeUrl(value: unknown, hosts: readonly string[]): string | undefined {
  if (!text(value)) return;
  try {
    const url = new URL(value);
    if (url.protocol === "https:" && !url.username && !url.password && !url.port && hosts.includes(url.hostname)) return url.href;
  } catch { /* Un campo opcional inválido no debe convertirse en un enlace. */ }
}

function imageUrl(value: unknown) {
  const url = safeUrl(value, ["upload.wikimedia.org", "thumb.wikimedia.org"]);
  return url && new URL(url).pathname.startsWith("/wikipedia/commons/") && /\.(jpe?g|png|webp)$/i.test(new URL(url).pathname) ? url : undefined;
}

export function parseSummary(value: unknown) {
  if (!record(value) || value.type !== "standard" || value.lang !== "es" || !text(value.title) || !text(value.extract)) {
    throw new Error("Wikipedia devolvió una ficha incompleta. Inténtalo de nuevo.");
  }
  const urls = record(value.content_urls) && record(value.content_urls.desktop) ? value.content_urls.desktop : {};
  const page = safeUrl(urls.page, ["es.wikipedia.org"]);
  if (!page || !new URL(page).pathname.startsWith("/wiki/")) throw new Error("No pudimos verificar el enlace de esta ficha.");
  const original = record(value.originalimage) ? imageUrl(value.originalimage.source) : undefined;
  return { title: value.title, extract: value.extract, page, original };
}

// Estos metadatos pueden contener enlaces HTML. Solo se muestra su texto, nunca HTML remoto.
function plainText(value: unknown) {
  if (!record(value) || !text(value.value)) return "";
  return value.value.replace(/<[^>]*>/g, "").replace(/&(?:amp|lt|gt|quot|apos|nbsp);/g, (entity) =>
    ({ "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'", "&nbsp;": " " })[entity] ?? entity,
  ).replace(/&#(x[\da-f]+|\d+);/gi, (entity, code: string) => {
    const point = code.toLowerCase().startsWith("x") ? parseInt(code.slice(1), 16) : Number(code);
    return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : entity;
  }).replace(/\s+/g, " ").trim();
}

export function parseImage(value: unknown): WikiImage {
  const pages = record(value) && record(value.query) && Array.isArray(value.query.pages) ? value.query.pages : [];
  const info = record(pages[0]) && Array.isArray(pages[0].imageinfo) ? pages[0].imageinfo[0] : undefined;
  if (!record(info) || !record(info.extmetadata)) throw new Error("Imagen sin créditos verificables.");
  const source = imageUrl(info.thumburl);
  const page = safeUrl(info.descriptionurl, ["commons.wikimedia.org"]);
  const author = plainText(info.extmetadata.Artist);
  const license = plainText(info.extmetadata.LicenseShortName);
  if (!source || !page || !new URL(page).pathname.startsWith("/wiki/File:") || !author || !license) {
    throw new Error("Imagen sin créditos verificables.");
  }
  const licenseValue = info.extmetadata.LicenseUrl;
  const licenseUrl = record(licenseValue) ? safeUrl(licenseValue.value, ["creativecommons.org", "www.gnu.org"]) : undefined;
  return { source, page, author, license, licenseUrl };
}

export function parseSearchResults(value: unknown): WikiSearchResult[] {
  if (!record(value) || !Array.isArray(value.pages) || !value.pages.every((page) =>
    record(page) && Number.isSafeInteger(page.id) && Number(page.id) > 0 && text(page.title) &&
    (page.description === undefined || page.description === null || typeof page.description === "string"))) {
    throw new Error("Wikipedia devolvió resultados que no pudimos leer. Inténtalo de nuevo.");
  }
  const seen = new Set<string>();
  return value.pages.flatMap((page) => {
    if (seen.has(page.title)) return [];
    seen.add(page.title);
    return [{ pageId: page.id, name: page.title, title: page.title, description: page.description?.trim() || "Artículo de Wikipedia" }];
  });
}

export async function searchWikipedia(query: string, scope: WikiSearchScope, signal: AbortSignal): Promise<WikiSearchResult[]> {
  signal.throwIfAborted();
  const term = query.trim().replace(/\s+/g, " ");
  if (term.length < 2 || term.length > 100) throw new Error("Escribe entre 2 y 100 caracteres para buscar.");
  if (scope !== "page" && scope !== "title") throw new Error("El tipo de búsqueda no es válido.");
  const key = `${scope}:${term.toLocaleLowerCase("es")}`;
  const saved = searchCache.get(key);
  if (saved && saved.expires > Date.now()) return saved.results;
  searchCache.delete(key);
  const params = new URLSearchParams({ q: term, limit: "20" });
  const candidates = parseSearchResults(await getJson(`https://es.wikipedia.org/w/rest.php/v1/search/${scope}?${params}`, signal));
  const results = await filterAnimalResults(candidates, signal);
  signal.throwIfAborted();
  if (searchCache.size >= 20) searchCache.delete(searchCache.keys().next().value!);
  searchCache.set(key, { results, expires: Date.now() + 5 * 60 * 1000 });
  return results;
}

export async function fetchWikipediaArticle(title: string, signal: AbortSignal): Promise<WikiArticle> {
  signal.throwIfAborted();
  const saved = cache.get(title);
  if (saved && saved.expires > Date.now()) return saved.article;
  cache.delete(title);
  const summary = parseSummary(await getJson(SUMMARY_API + encodeURIComponent(title.replaceAll(" ", "_")), signal));
  const article: WikiArticle = { title: summary.title, extract: summary.extract, page: summary.page, imageStatus: "missing" };
  if (summary.original) {
    try {
      const path = new URL(summary.original).pathname;
      // PCS también puede devolver una miniatura en originalimage; el nombre real es su carpeta padre.
      const filename = decodeURIComponent(path.split("/").at(path.includes("/thumb/") ? -2 : -1)!);
      const params = new URLSearchParams({ action: "query", format: "json", formatversion: "2", origin: "*",
        prop: "imageinfo", iiprop: "url|extmetadata", iiurlwidth: "640",
        iiextmetadatafilter: "Artist|LicenseShortName|LicenseUrl", titles: `File:${filename}` });
      article.image = parseImage(await getJson(`${COMMONS_API}?${params}`, signal));
      article.imageStatus = "ready";
    } catch {
      signal.throwIfAborted();
      article.imageStatus = "error";
    }
  }
  signal.throwIfAborted();
  // Los fallos parciales no se guardan: reintentar debe volver a consultar la imagen.
  if (article.imageStatus !== "error") {
    if (cache.size >= 40) cache.delete(cache.keys().next().value!);
    cache.set(title, { article, expires: Date.now() + CACHE_TTL });
  }
  return article;
}
