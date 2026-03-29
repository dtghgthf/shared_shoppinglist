export interface Category {
  id: string;
  label: string;
  icon: string;
}

export const CATEGORIES: Category[] = [
  { id: "obst-gemuese",   label: "Obst & Gemüse",              icon: "🥦" },
  { id: "fleisch-fisch",  label: "Fleisch & Fisch",             icon: "🥩" },
  { id: "milch-eier",     label: "Milchprodukte & Eier",        icon: "🥛" },
  { id: "backwaren",      label: "Backwaren",                   icon: "🍞" },
  { id: "nudeln-reis",    label: "Nudeln, Reis & Hülsenfrüchte",icon: "🍝" },
  { id: "getraenke",      label: "Getränke",                    icon: "🥤" },
  { id: "tiefkuehl",      label: "Tiefkühlkost",                icon: "🧊" },
  { id: "suesses",        label: "Süßes & Snacks",              icon: "🍫" },
  { id: "gewuerze",       label: "Gewürze & Öle",               icon: "🧂" },
  { id: "drogerie",       label: "Drogerie & Haushalt",         icon: "🧴" },
  { id: "sonstiges",      label: "Sonstiges",                   icon: "🛒" },
];

export const CATEGORY_MAP: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.label])
);

const KEYWORDS: Record<string, string[]> = {
  "obst-gemuese": [
    "apfel", "birne", "banane", "orange", "zitrone", "erdbeere", "kirsche",
    "trauben", "weintrauben", "pfirsich", "melone", "mango", "ananas", "kiwi",
    "tomate", "gurke", "paprika", "zwiebel", "knoblauch", "kartoffel",
    "karotte", "möhre", "salat", "spinat", "brokkoli", "blumenkohl",
    "zucchini", "aubergine", "pilze", "champignon", "lauch", "sellerie",
    "feldsalat", "rucola", "kräuter", "basilikum", "petersilie", "schnittlauch",
    "ingwer", "rote beete", "mais", "avocado", "limette", "grapefruit",
    "obst", "gemüse", "beeren", "pflaumen", "aprikose",
  ],
  "fleisch-fisch": [
    "fleisch", "hähnchen", "hühnchen", "hähnchenbrustfilee", "rindfleisch",
    "schweinefleisch", "lammfleisch", "hackfleisch", "wurst", "salami",
    "schinken", "speck", "bratwurst", "schnitzel", "steak", "fisch", "lachs",
    "forelle", "thunfisch", "garnelen", "krabben", "meeresfrüchte", "muscheln",
    "calamari", "tintenfisch", "sardine", "hering", "makrele", "dorsch",
    "würstchen", "leberwurst", "blutwurst", "aufschnitt", "geflügel", "ente",
    "pute", "truthahn",
  ],
  "milch-eier": [
    "milch", "käse", "joghurt", "butter", "sahne", "quark", "skyr", "kefir",
    "frischkäse", "mozzarella", "parmesan", "gouda", "cheddar", "edamer",
    "emmentaler", "brie", "camembert", "ei", "eier", "obers", "schmand",
    "crème fraîche", "mascarpone", "ricotta", "hüttenkäse",
  ],
  "backwaren": [
    "brot", "brötchen", "baguette", "toast", "croissant", "brezel", "mehl",
    "kuchen", "torte", "muffin", "keks", "cracker", "zwieback", "knäckebrot",
    "ciabatta", "laugenbrezel", "weißbrot", "vollkornbrot", "roggen",
    "backpulver", "hefe", "waffeln",
  ],
  "nudeln-reis": [
    "nudeln", "pasta", "spaghetti", "penne", "fusilli", "rigatoni", "tagliatelle",
    "reis", "couscous", "quinoa", "linsen", "bohnen", "kidneybohnen",
    "kichererbsen", "erbsen", "haferflocken", "müsli", "cornflakes", "cerealien",
    "bulgur", "grieß", "polenta",
  ],
  "getraenke": [
    "wasser", "mineralwasser", "saft", "bier", "wein", "sekt", "prosecco",
    "cola", "limonade", "limo", "fanta", "sprite", "tee", "kaffee", "espresso",
    "smoothie", "energy drink", "energydrink", "vodka", "whisky", "rum",
    "gin", "schnaps", "likör", "cocktail", "orangensaft", "apfelsaft",
    "multivitaminsaft", "eistee",
  ],
  "tiefkuehl": [
    "tiefkühl", "gefroren", "pizza", "eis", "eiscreme", "speiseeis", "pommes",
    "nuggets", "fischstäbchen", "gemüsemischung", "tiefkühlgemüse",
    "tiefkühlpizza", "burrito", "lasagne tiefkühl",
  ],
  "suesses": [
    "schokolade", "schoki", "gummibärchen", "gummis", "bonbon", "chips",
    "popcorn", "nüsse", "cashews", "erdnüsse", "mandeln", "haselnüsse",
    "studentenfutter", "riegel", "snack", "süßigkeiten", "haribo", "lolly",
    "kaugummi", "fruchtgummi", "lakritz", "praline", "waffelschokolade",
    "nussriegel", "müsliriegel",
  ],
  "gewuerze": [
    "salz", "pfeffer", "zucker", "öl", "olivenöl", "rapsöl", "sonnenblumenöl",
    "essig", "balsamico", "senf", "ketchup", "mayonnaise", "mayo", "soße",
    "sauce", "gewürz", "curry", "zimt", "paprikapulver", "oregano", "thymian",
    "rosmarin", "kreuzkümmel", "kurkuma", "chili", "cayenne", "vanille",
    "brühwürfel", "suppenwürze", "sojasauce", "worcestersauce", "tabasco",
    "honig", "marmelade", "nutella", "aufstrich",
  ],
  "drogerie": [
    "shampoo", "duschgel", "seife", "zahnpasta", "zahnbürste", "deodorant",
    "deo", "creme", "lotion", "waschmittel", "spülmittel", "weichspüler",
    "klopapier", "toilettenpapier", "taschentücher", "müllbeutel", "frischhaltefolie",
    "alufolie", "windeln", "rasierer", "rasierklinge", "rasierschaum",
    "wattepads", "tampons", "binden", "kondome", "handseife", "desinfektionsmittel",
    "reiniger", "putzmittel", "schwamm",
  ],
};

export function detectCategory(text: string): string {
  const lower = text.toLowerCase().trim();
  for (const [catId, keywords] of Object.entries(KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return catId;
    }
  }
  return "sonstiges";
}

export function getCategoryById(id: string): Category {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}
