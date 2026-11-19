export const ANIMAL_GROUPS = ["Todos", "Perros", "Gatos", "Pequeños mamíferos", "Aves", "Reptiles", "Peces"] as const;
export type AnimalGroup = (typeof ANIMAL_GROUPS)[number];
export type AnimalKind = "Especie" | "Raza";
export type Animal = {
  name: string;
  title: string;
  group: Exclude<AnimalGroup, "Todos">;
  kind: AnimalKind;
  aliases: string;
};

// Los títulos exactos evitan desambiguaciones y resultados ajenos a esta biblioteca.
export const ANIMALS: readonly Animal[] = [
  { name: "Golden retriever", title: "Golden retriever", group: "Perros", kind: "Raza", aliases: "cobrador dorado escocia" },
  { name: "Gato siamés", title: "Siamés (gato)", group: "Gatos", kind: "Raza", aliases: "siames tailandia" },
  { name: "Conejo", title: "Oryctolagus cuniculus", group: "Pequeños mamíferos", kind: "Especie", aliases: "conejos" },
  { name: "Ninfa", title: "Nymphicus hollandicus", group: "Aves", kind: "Especie", aliases: "carolina cacatua pájaro" },
  { name: "Gecko leopardo", title: "Eublepharis macularius", group: "Reptiles", kind: "Especie", aliases: "geco lagarto" },
  { name: "Pez dorado", title: "Carassius auratus", group: "Peces", kind: "Especie", aliases: "goldfish carpa" },
  { name: "Perro", title: "Canis familiaris", group: "Perros", kind: "Especie", aliases: "canino perros canis lupus familiaris" },
  { name: "Labrador retriever", title: "Labrador retriever", group: "Perros", kind: "Raza", aliases: "cobrador terranova" },
  { name: "Border collie", title: "Border collie", group: "Perros", kind: "Raza", aliases: "pastor" },
  { name: "Gato", title: "Felis catus", group: "Gatos", kind: "Especie", aliases: "felino gatos doméstico" },
  { name: "Gato persa", title: "Persa (gato)", group: "Gatos", kind: "Raza", aliases: "pelo largo" },
  { name: "Maine coon", title: "Maine Coon", group: "Gatos", kind: "Raza", aliases: "maine pelo largo" },
  { name: "Cobaya", title: "Cavia porcellus", group: "Pequeños mamíferos", kind: "Especie", aliases: "cuy curí guinea conejillo roedor" },
  { name: "Hámster dorado", title: "Mesocricetus auratus", group: "Pequeños mamíferos", kind: "Especie", aliases: "hamster sirio roedor" },
  { name: "Periquito australiano", title: "Melopsittacus undulatus", group: "Aves", kind: "Especie", aliases: "perico loro pájaro" },
  { name: "Canario", title: "Serinus canaria", group: "Aves", kind: "Especie", aliases: "canarios pájaro" },
  { name: "Dragón barbudo", title: "Pogona vitticeps", group: "Reptiles", kind: "Especie", aliases: "pogona lagarto" },
  { name: "Tortuga mediterránea", title: "Testudo hermanni", group: "Reptiles", kind: "Especie", aliases: "tortugas terrestre" },
  { name: "Pez betta", title: "Betta splendens", group: "Peces", kind: "Especie", aliases: "luchador siam" },
  { name: "Guppy", title: "Poecilia reticulata", group: "Peces", kind: "Especie", aliases: "lebistes millón" },
];

const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");

export function filterAnimals(query: string, group: AnimalGroup, kind: "Todos" | AnimalKind) {
  const words = normalize(query).trim().split(/\s+/).filter(Boolean);
  return ANIMALS.filter((animal) => {
    const searchable = normalize(`${animal.name} ${animal.title} ${animal.group} ${animal.aliases}`);
    return (group === "Todos" || animal.group === group) &&
      (kind === "Todos" || animal.kind === kind) && words.every((word) => searchable.includes(word));
  });
}
