import * as cheerio from "cheerio";

export const BASE = "https://surtdecasa.cat";

export const ZONES = {
  ebre: 1,
  penedes: 2,
  camp: 3,
  emporda: 4,
  ponent: 5,
  girona: 7,
  centre: 8,
  pirineus: 9,
  barcelona: 10,
} as const;

export const CATEGORIES = {
  gastronomia: 1,
  exposicions: 2,
  cinema: 3,
  espectacles: 4,
  concerts: 5,
  llibres: 6,
  familia: 7,
  entorn: 8,
  fires: 9,
  activat: 10,
} as const;

export const TIPUS = {
  "aire-lliure": 68475,
  gratuit: 68473,
  nocturn: 68474,
} as const;

const UA = "surtdecasa-mcp/0.1 (servidor MCP personal; us responsable: pere)";

async function get(ruta: string, accept = "text/html"): Promise<string> {
  const res = await fetch(`${BASE}${ruta}`, {
    headers: { "User-Agent": UA, Accept: accept },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} demanant ${ruta}`);
  return res.text();
}

function normalitzaRuta(entrada: string): string {
  if (entrada.startsWith("http")) {
    const u = new URL(entrada);
    return u.pathname + u.search;
  }
  return entrada.startsWith("/") ? entrada : `/${entrada}`;
}

function formatData(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function faUnAny(): string {
  const ara = new Date();
  return formatData(new Date(ara.getFullYear() + 1, ara.getMonth(), ara.getDate()));
}

export interface CercaParams {
  zona?: string[];
  categoria?: string[];
  tipus?: string[];
  poblacio?: string;
  calendari?: "avui" | "dema" | "cap-de-setmana";
  inici?: string;
  fi?: string;
  page?: number;
}

export interface ResultatAgenda {
  url: string;
  titol: string;
  localitat: string;
  dates: string;
  imatge: string;
}

export async function cercarAgenda(p: CercaParams): Promise<{ resultats: ResultatAgenda[]; pagina: number; hiHaMes: boolean }> {
  const q = new URLSearchParams();
  for (const z of p.zona ?? []) {
    const v = ZONES[z as keyof typeof ZONES];
    if (v) q.append("zona[]", String(v));
  }
  for (const c of p.categoria ?? []) {
    const v = CATEGORIES[c as keyof typeof CATEGORIES];
    if (v) q.append("categoria[]", String(v));
  }
  for (const t of p.tipus ?? []) {
    const v = TIPUS[t as keyof typeof TIPUS];
    if (v) q.append("tipus[]", String(v));
  }
  if (p.poblacio) q.set("poblacio", p.poblacio);
  if (p.calendari === "avui") q.set("calendari", "Avui");
  else if (p.calendari === "dema") q.set("calendari", "Dema");
  else if (p.calendari === "cap-de-setmana") q.set("calendari", "Capdesetmana");
  if (p.inici) {
    q.set("inici[value][date]", p.inici);
    q.set("fi[value][date]", p.fi ?? faUnAny());
  } else if (p.fi) {
    q.set("inici[value][date]", formatData(new Date()));
    q.set("fi[value][date]", p.fi);
  }
  const pagina = p.page ?? 0;
  if (pagina > 0) q.set("page", String(pagina));

  const qs = q.toString().replaceAll("%5B", "[").replaceAll("%5D", "]");
  const $ = cheerio.load(await get(`/agenda/cercador?${qs}`));

  const resultats: ResultatAgenda[] = [];
  $(".views-row").each((_, el) => {
    const row = $(el);
    const h3 = row.find("h3.ptitol-article").first();
    const titol = h3.text().trim();
    if (!titol) return;
    const href = h3.closest("a").attr("href") ?? row.find("a").first().attr("href");
    if (!href) return;
    resultats.push({
      url: `${BASE}${href}`,
      titol,
      localitat: row.find(".localitat").first().text().trim(),
      dates: row.find(".bdr1 p, .bdr2 p").last().text().trim(),
      imatge: row.find("img").first().attr("src") ?? "",
    });
  });

  return {
    resultats,
    pagina,
    hiHaMes: $(".pager-next a").length > 0,
  };
}

export async function detallEsdeveniment(ruta: string) {
  const neteja = normalitzaRuta(ruta);
  const $ = cheerio.load(await get(neteja));
  const node = $(".node-esdeveniment").first();
  if (!node.length) throw new Error(`No s'ha trobat cap esdeveniment a ${ruta}`);
  const camp = (nom: string) => node.find(`.field-name-${nom} .field-item`).first().text().trim();
  const enllacos = (nom: string) =>
    node
      .find(`.field-name-${nom} a`)
      .map((_, a) => $(a).attr("href") ?? "")
      .get()
      .filter(Boolean);
  return {
    titol: $("h1#page-title").first().text().trim(),
    url: `${BASE}${neteja.split("?")[0]}`,
    categoria: camp("field-categoria"),
    quan: camp("field-quan"),
    on: camp("field-on"),
    localitats: node
      .find(".field-name-field-localitat a")
      .map((_, a) => $(a).text().trim())
      .get(),
    preu: camp("field-preu"),
    organitza: camp("field-organitza"),
    mesInformacio: enllacos("field-mes-informacio"),
    programa: camp("field-programa"),
    descripcio: camp("field-text-ag") || camp("field-textric"),
    imatge: node.find("img").first().attr("src") ?? "",
  };
}

export async function cartellera(): Promise<{ url: string; titol: string; imatge: string }[]> {
  const $ = cheerio.load(await get("/cartellera"));
  const vistos = new Set<string>();
  const films: { url: string; titol: string; imatge: string }[] = [];
  $('a[href^="/pellicules/"] img').each((_, img) => {
    const el = $(img);
    const href = el.closest("a").attr("href");
    if (!href || vistos.has(href)) return;
    vistos.add(href);
    films.push({
      url: `${BASE}${href}`,
      titol: el.attr("alt")?.trim() || el.attr("title")?.trim() || "",
      imatge: el.attr("src") ?? "",
    });
  });
  return films;
}

export async function poblacions(terme: string): Promise<string[]> {
  const raw = await get(
    `/index.php?q=admin/views/ajax/autocomplete/taxonomy/5/${encodeURIComponent(terme)}`,
    "application/json",
  );
  const dades = JSON.parse(raw) as Record<string, string>;
  const neteja = (s: string) => cheerio.load(`<i>${s}</i>`)("i").text();
  return [...new Set(Object.values(dades).map(neteja))];
}
