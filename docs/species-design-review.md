# Revisión de la página de especies

Ruta: `/especies`. Portada fotográfica en crema y verde, búsqueda reutilizada, entrada GSAP y cierre tipográfico. Fotografías de Unsplash reutilizadas del sitio.

Comprobaciones realizadas: compilación, lint, 33 pruebas, búsqueda real de jaguar, vista móvil de 390 px, retirada de la biblioteca de Inicio y redirección de /#especies. No se detectaron errores de consola durante la prueba de búsqueda.

El comprobador de Design Taste registró estado FAIL en la primera ronda; no se declara aprobado. Varias reglas exigen la estructura de su kit (barra única, alturas de pantalla, composiciones y momentos predefinidos), frente al diseño y componentes existentes de Lúmina. También reportó posibles problemas de foco, superposición y elementos globales que requieren revisión específica. El contraste de la barra sobre la portada clara se corrigió después del informe.

Hallazgos del informe original, conservados sin ocultarlos:

- **nav**: "" sits outside the nav bar div.species-page > header.fixed.inset-x-0 > div.mx-auto.flex > nav.flex.min-w-0 (144-1130px)
- **nav**: "" sits outside the nav bar div.species-page > header.fixed.inset-x-0 > div.mx-auto.flex > nav.flex.min-w-0 (144-1130px)
- **nav**: "" sits outside the nav bar div.species-page > header.fixed.inset-x-0 > div.mx-auto.flex > nav.flex.min-w-0 (144-1130px)
- **nav**: the nav bar spans 144-1130px but the content spans 164-1276px, and its actions sit outside it
- **overlap-text**: lies over the text "Tortuga mediterránea" (span > span.animal-library__list-name)
- **no-visual**: pictures, effects and mocks cover 9% of this section; a feature section needs a visual (about 25% or more)
- **text-only**: the closing section is only text: no picture, icon, mock or effect in it
- **button-styles**: 3 button styles on one screen: label and disc, fill #e8f5b8 ("Lúmina Animal Care"); pill, fill #e8f5b8 ("Reserva una visita"); pill, outline #183d32 ("Explorar animales"); the odd one out: "Explorar animales"
- **button-styles**: 5 button styles on the page: label and disc, fill #e8f5b8 x1 ("Lúmina Animal Care"); pill, fill #e8f5b8 x1 ("Reserva una visita"); pill, outline #183d32 x1 ("Explorar animales"); pill, outline #e8f5b8 x2 ("Buscar en Wikipedia"); pill, outline #f1ecdf x1 ("Reservar una visita")
- **button-styles**: one button style (pill, outline #e8f5b8) in 2 heights: 48, 56px ("Buscar en Wikipedia" 56px, "Leer en Wikipedia (abre otra pestaña)" 48px)
- **copy-headline**: "Un mundo de especies. Una curiosidad sin límites." does not name what is sold (biblioteca animal, biblioteca, animal, from flags); only the line under it does
- **copy-headings**: "Golden retriever" names no product, part, place or section (2 headings like it; at most one brand line per page) (and 1 more like it: "Conocerlos es el primer ")
- **top-stagger**: 2 boxes side by side start at different heights (+0, +160px)
- **off-grid**: left edge at 896px, 21px off a common edge of its section at 875px (5 elements); 2 more in this section off the grid too (p.animal-library__catalog-note at 896px, button:nth-of-type(1) at 168px)
- **off-grid**: left edge at 188px, 24px off the page margin at 164px (17 elements, like span.flex.size-10)
- **text-contrast**: a caption, label or muted line in #9db5a9 on #f1efdf reads 1.89:1 (needs 4.5:1); 5 like it, like "Servicios", "Especies", "Tu visita"
- **text-contrast**: body text in #4d6256 on #f1efdf reads 5.68:1 (needs 7:1)
- **effect-kind**: a service page (--type) moves with the scroll: scroll libraries or timelines (ScrollTrigger): effects fit tech, gaming and software pages and a product with a technical subject, never a place, shop or service page (house rule)
- **focus-ring**: ".focus-visible\:outline-none:focus-visible" in the page removes the focus outline and sets nothing in its place
- **focus-visible**: Tab stop 13, input "": the focus lands on something you cannot see
- **focus-visible**: Tab stop 27, button "Gecko leopardo Especie · Reptiles": the focus lands on something you cannot see
- **moment-none**: a service page (--type) deals no moment: every kind carries one, two on a long page (moments.md)
- **section-height**: the section is 336px tall (0.4 screens), 564px short of one screen (900px): every section after the hero is one screen or two, 2px either way (SR-2)
- **section-height**: the section is 522px tall (0.6 screens), 378px short of one screen (900px): every section after the hero is one screen or two, 2px either way (SR-2)
- **section-height**: the section is 1507px tall (1.7 screens), 293px short of two screens (1800px): every section after the hero is one screen or two, 2px either way (SR-2)
- **section-air**: a bottom border across 100% of the container, between the section's content: sections and their parts are told apart by air and ground, not lines (SR-3)
- **one-section**: the screen at scroll 2407px (the top of section 3) shows 336px of section 4 and the content of 2 sections, over 24px each beside section 3: a screen shows one section (another may peek 8px, 24px WARN) (SR-4)
- **one-section**: the screen at scroll 1800px (stride 2) shows 293px of section 3 and the heading of section 3 whole and the content of 2 sections, over 24px each beside section 2: a screen shows one section (another may peek 8px, 24px WARN) (SR-4)
- **container-edges**: the nav's content runs 165px from the left and 151px from the right (read from its outermost blocks: no .wrap): 165 and 151px are not one margin; the margin is 64-120px at 1440px (one container, equal margins, 2px either way) (SR-6)
- **container-edges**: the content of section 1 runs 164px from the left and 164px from the right (read from its outermost blocks: no .wrap): the margin is 64-120px at 1440px (one container, equal margins, 2px either way) (and 3 more like it: "Biblioteca animalExplora", "DE LA CURIOSIDAD AL CUID", "Lúmina Animal CareMedici") (SR-6)
- **container-edges**: a <div> at the top of the page, outside header.nav, main, footer.closing and nav.actionbar (SR-6)
- **container-edges**: a box runs 144-1130px, outside the container lines of the nav at 164-1276px: full width is for background layers and grounds only (and 3 more like it: "Cuenta y carrito", "Carrito, 0 productos", "Carrito, 0 productos") (SR-6)
- **container-edges**: 1 text block starts on a left line at x 923, 759px from the container's left: text starts on the container's left, or on one split line (x 637, 732, 827) (and 6 more like it: x 896, x 875, x 613) (SR-6)
- **container-edges**: "DE LA CURIOSIDAD AL CUIDADO" is set centred across 1112px, over half the 1112px container: text that wide is set left (and 1 more like it: "Conocerlos es el primer ") (SR-6)
- **container-edges**: a box over half the container wide runs 466-1276px, not on the container's lines at 164-1276px (and 1 more like it: div.animal-library__wrap > form.animal-library__filters > div.animal-library__search-field > div.animal-library__input-wrap) (SR-6)
- **split-pair**: the two columns of the split start 29px apart at the top: a split's columns are top-aligned, 8px either way (SR-8)
- **split-pair**: the two columns of the split start 11px apart at the top: a split's columns are top-aligned, 8px either way (SR-8)
- **nav**: "Lúmina Animal Care" sits outside the nav bar div.species-page > header.fixed.inset-x-0 > div.mx-auto.flex > div.flex.shrink-0 (224-378px)
- **nav**: "" sits outside the nav bar div.species-page > header.fixed.inset-x-0 > div.mx-auto.flex > div.flex.shrink-0 (224-378px)
- **nav**: the nav bar spans 224-378px but the content spans 20-370px, and its actions sit outside it
- **nav-covers**: sits on top of the text "Buscar especie o raza" while the page scrolls: part of the line shows beside it
- **overlap-text**: lies over the text "Ninfa" (span > span.animal-library__list-name) (and 5 more like it: "Perros / Raza", "Wikipedia en español", "El golden retriever es u", "Una biblioteca para cono", ...)
- **overlap-text**: lies over the text "Raza · Perros" (span > span.animal-library__list-kind) (and 1 more like it: "Leer en Wikipedia (abre ")
- **off-grid**: left edge at 24px, 4px off the page margin at 20px (32 elements, like p#animal-count); 1 more in this section off the grid too (summary at 34px)
- **contrast**: body text over a picture reads at 3.9:1 at its worst tenth (needs 4.5:1), on a busy ground (and 9 more like it: "Especie · Aves", "Gecko leopardo", "Especie · Reptiles", "Pez dorado", ...)
- **off-viewport**: at 320px wide it runs 320px past the screen's right edge (cut there: the page clips what runs past it)
