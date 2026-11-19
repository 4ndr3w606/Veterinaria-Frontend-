# Biblioteca animal: búsqueda abierta desde el frontend

La biblioteca vive en la página independiente `/especies`, accesible desde el menú. El enlace anterior `/#especies` redirige a la nueva página. La ruta se carga de forma diferida y la biblioteca ya no se monta en Inicio.

La portada reutiliza fotografías de Unsplash ya empleadas en el sitio, con espacio reservado para evitar saltos. Las animaciones GSAP de entrada y cierre usan transformaciones y opacidad, se limpian al salir y respetan movimiento reducido. No se añaden dependencias ni bucles permanentes.

## Consultar un animal

1. Escribir un nombre habitual o científico, de 2 a 100 caracteres.
2. Pulsar **Buscar en Wikipedia** o Enter.
3. Revisar las coincidencias y seleccionar el artículo del animal.
4. Consultar su descripción, fotografía, créditos y enlace a Wikipedia.

La búsqueda se realiza siempre en título y contenido, sin selector de modalidad. La consulta es abierta: **no está limitada a las 20 fichas originales**. Esas fichas permanecen como sugerencias iniciales. Los filtros por grupo y especie/raza solo se aplican a esas sugerencias y se identifican como tales. La búsqueda remota valida ahora la clasificación de los artículos mediante Wikidata antes de mostrarlos.

Wikipedia es una enciclopedia general. Un nombre puede corresponder también a una película, una localidad u otro tema. El filtro descarta desambiguaciones y artículos sin una relación verificable con animales. Un error de red o una respuesta inválida durante la clasificación muestra un error con reintento; nunca se utilizan las coincidencias sin filtrar como alternativa.

Se clasifican las primeras 20 coincidencias de cada consulta y se muestran solo las aceptadas; pueden quedar menos de 20 o ninguna. No se implementa paginación ni se garantiza encontrar animales fuera de esas primeras coincidencias.

## Clasificación de animales

1. Se consultan `wikibase_item` y `disambiguation` mediante `pageprops`, agrupando los identificadores de página. Se omiten las desambiguaciones y los artículos sin entidad vinculada.
2. Se leen las relaciones de las entidades de Wikidata mediante `wbgetentities`, en lotes de hasta 50. No se envían consultas SPARQL ni se decide por palabras del título o de la descripción.
3. Se sigue `P171` (taxón superior) hasta Animalia o un grupo animal conocido. Para razas se sigue `P31` y la jerarquía `P279` hasta la clase «raza». Para nombres comunes se consideran también `P13176` (taxón conocido por ese nombre) y `P279`.
4. Se ignoran relaciones obsoletas y se priorizan las de rango preferido. Las personas, películas o marcas no se aceptan por mencionar o representar un animal.

La clasificación es conservadora: los datos incompletos pueden excluir animales válidos. No es una verificación editorial ni una garantía de exactitud de Wikidata. El recorrido detecta ciclos, limita a 3 niveles la jerarquía de clases de razas y a 24 la de animales, y realiza como máximo 12 lotes por búsqueda. Si se alcanza ese límite se muestran únicamente los resultados ya confirmados. La interfaz informa que algunos artículos pueden no aparecer por su clasificación.

## APIs y separación de responsabilidades

Todo funciona desde el navegador, sin claves ni backend propio:

- `GET https://es.wikipedia.org/w/rest.php/v1/search/page?q=...&limit=20`: búsqueda en título y contenido.
- Wikipedia Action API, `action=query`, `prop=pageprops`: entidad Wikidata y desambiguación de cada coincidencia.
- `GET https://www.wikidata.org/w/api.php?action=wbgetentities&props=claims&ids=...&format=json&origin=*`: relaciones para clasificar los resultados.
- `GET https://es.wikipedia.org/api/rest_v1/page/summary/{título}`: resumen en español del resultado elegido.
- Wikimedia Commons, `action=query`, `prop=imageinfo`: fotografía y créditos.

Documentación oficial: [MediaWiki REST](https://www.mediawiki.org/wiki/API:REST_API/Reference), [resúmenes](https://www.mediawiki.org/wiki/Page_Content_Service#JSON_endpoints), [Imageinfo](https://www.mediawiki.org/wiki/API:Imageinfo).

Clasificación: [Pageprops](https://www.mediawiki.org/wiki/API:Pageprops), [Wikibase API](https://www.wikidata.org/wiki/Wikidata:Data_access), [modelo de taxonomía](https://www.wikidata.org/wiki/Wikidata:WikiProject_Taxonomy/Tutorial).

| Archivo | Función |
| --- | --- |
| `src/lib/wikipedia.ts` | Búsqueda, resúmenes, imágenes, validación, cancelación, tiempos de espera y caché. |
| `src/lib/animalClassification.ts` | Validación del tema de los resultados, relaciones taxonómicas y caché de clasificación. |
| `src/lib/wikimedia.ts` | Peticiones JSON compartidas, cancelación y errores de Wikipedia/Wikidata. |
| `src/components/sections/AnimalLibrary.tsx` | Formulario y filtros de búsqueda; exploración de sugerencias. |
| `src/components/animals/WikipediaSearch.tsx` | Resultados remotos, selección, estados vacíos, carga y reintento. |
| `src/components/animals/AnimalDetail.tsx` | Descripción, imagen, atribución y animación de la ficha. |
| `src/data/animals.ts` | Las 20 sugerencias; no limita las búsquedas remotas. |
| `src/styles/animal-library.css` | Estilos limitados a `.animal-library`. |
| `tests/wikipedia.test.mjs` | Pruebas de la integración. |

La integración no depende de `StoreProvider` ni de las APIs de reservas o catálogo. No transmite información de cuentas, carrito ni reservas; las solicitudes omiten credenciales.

## Eficiencia y errores

- Se busca al enviar el formulario, no en cada pulsación. Se utiliza siempre la búsqueda en título y contenido.
- Una nueva búsqueda cancela la anterior y desmonta su resultado, evitando que una respuesta antigua sustituya los datos actuales.
- Se conservan hasta 20 búsquedas durante cinco minutos y hasta 40 fichas durante 30 minutos, solo en memoria.
- Se conservan hasta 400 entidades de clasificación durante 30 minutos, en memoria. Se agrupan consultas y se realizan secuencialmente; no se lanza una petición por resultado.
- Los errores no se guardan en caché. Cada petición tiene un límite de diez segundos y la clasificación completa de veinte segundos. Cancelar la búsqueda interrumpe también la clasificación.
- Se manejan desconexión, HTTP 404/429/503, JSON inválido, estructura inesperada, falta de resultados y fallos de imágenes. No hay reintentos automáticos continuos.
- La descripción sigue disponible si falla la fotografía. Las fichas con un fallo parcial de imagen pueden reintentarse sin reutilizar ese fallo de caché.
- Se validan enlaces de Wikipedia, Commons y las licencias; el HTML remoto no se inserta en la página. El extracto HTML de los resultados de búsqueda se descarta.
- Las imágenes usan JPEG, PNG o WebP de Commons. Si faltan la imagen o sus créditos, aparece un estado explícito; no se sustituye por una fotografía inventada.

## Diseño

Se conserva el diseño de Lúmina y las animaciones GSAP existentes de la biblioteca, con limpieza al desmontar y respeto a movimiento reducido. Las búsquedas realizadas con teclado no activan movimiento decorativo. Los nombres y descripciones extensos se ajustan al ancho de la lista.

Cada ficha mantiene las atribuciones del texto y de su fotografía en «Fuentes y créditos de esta ficha». La información es general y no sustituye una consulta veterinaria.

## Verificación

```sh
npm run lint
npm run build
node --test tests/chat.test.mjs tests/wikipedia.test.mjs
```

Las pruebas incluyen homónimos, plantas, razas, nombres comunes, invertebrados, desambiguaciones, jerarquías cíclicas, límites de consultas, respuestas malformadas, prioridad de relaciones, errores de Wikidata, cancelación y caché. Se conservan las comprobaciones anteriores de búsqueda, resúmenes, imágenes y catálogo.

Validación del filtro (19 de noviembre de 2026): **33 pruebas aprobadas**, `npm run lint` y `npm run build` correctos. También se comprobó que un animal ya confirmado no provoca consultas adicionales por ramas alternativas de su clasificación.

Se verificó con la API real: buscar «ajolote» devuelve `Ambystoma mexicanum`; abrirlo entrega descripción y fotografía con créditos. «tucán», en búsqueda de títulos, devuelve `Ramphastidae`. Una petición con cabecera Origin confirmó la respuesta CORS que permite consultar desde el frontend.

Se comprobó el filtro desde el navegador integrado con la API real: «jaguar» mostró solo `Panthera onca`, cuya ficha abrió descripción e imagen; «siamés» conservó razas de gatos; «pez» conservó el grupo de nombre común. La búsqueda «Jaguar Cars» omitió la marca, aunque Wikipedia también ofreció una subespecie animal relacionada. La coincidencia de palabras sigue siendo la de Wikipedia: el filtro valida el tema, no garantiza igualdad literal del nombre. No hubo errores ni advertencias en la consola del navegador durante esa comprobación.

Las primeras comprobaciones de red desde Node recibieron respuestas HTTP 429; se respetó la espera antes de continuar. La verificación final del flujo se realizó desde el navegador. No se repitió la matriz de tamaños móviles ni el comprobador externo del kit de diseño; el diseño y las animaciones se mantienen.

Los cambios son locales; no se creó un backend ni se hicieron commits o envíos a GitHub.


## Página independiente

La migración a `/especies` conserva la búsqueda en título y contenido y el filtro Wikidata. Se verificaron la navegación, el enlace antiguo y la vista móvil. La revisión de diseño y sus límites están en [species-design-review.md](./species-design-review.md).

La portada de Especies utiliza el verde de `--card`, texto `--foreground` y acentos `--primary`, compartidos con el resto de Lúmina. Sustituye al fondo crema inicial.
