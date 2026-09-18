import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  cercarAgenda,
  detallEsdeveniment,
  cartellera,
  poblacions,
  ZONES,
  CATEGORIES,
  TIPUS,
  type CercaParams,
} from "./scraper.js";

const json = (dada: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(dada, null, 2) }],
});

export function registraEines(server: McpServer): void {
  server.registerTool(
    "cercar_agenda",
    {
      title: "Cercar a l'agenda",
      description:
        "Cerca esdeveniments a l'agenda de surtdecasa.cat. Es pot filtrar per zona territorial, categoria, tipus (aire lliure, gratuït, nocturn), població, dies concrets (avui, dema, cap-de-setmana) o un rang de dates en format dd/mm/yyyy. Suporta paginació.",
      inputSchema: {
        zona: z
          .array(z.enum(Object.keys(ZONES) as [keyof typeof ZONES, ...(keyof typeof ZONES)[]]))
          .optional()
          .describe("Zones territorials a incloure"),
        categoria: z
          .array(z.enum(Object.keys(CATEGORIES) as [keyof typeof CATEGORIES, ...(keyof typeof CATEGORIES)[]]))
          .optional()
          .describe("Categories a incloure"),
        tipus: z
          .array(z.enum(Object.keys(TIPUS) as [keyof typeof TIPUS, ...(keyof typeof TIPUS)[]]))
          .optional()
          .describe("Etiquetes especials"),
        poblacio: z.string().optional().describe("Nom de la població (exacte; consulta poblacions per trobar-lo)"),
        calendari: z.enum(["avui", "dema", "cap-de-setmana"]).optional().describe("Atall de dates"),
        inici: z
          .string()
          .regex(/^\d{2}\/\d{2}\/\d{4}$/)
          .optional()
          .describe("Data inicial dd/mm/yyyy (té prioritat sobre calendari)"),
        fi: z
          .string()
          .regex(/^\d{2}\/\d{2}\/\d{4}$/)
          .optional()
          .describe("Data final dd/mm/yyyy (si només es passa inici, un any de rang)"),
        page: z.number().int().min(0).optional().describe("Pàgina de resultats (0 = primera)"),
      },
    },
    async (args) => json(await cercarAgenda(args as CercaParams)),
  );

  server.registerTool(
    "detall_esdeveniment",
    {
      title: "Detall d'un esdeveniment",
      description:
        "Retorna tota la informació d'un esdeveniment de l'agenda (dates, lloc, poblacions, preu, descripció, enllaços). Requereix la URL o ruta que retorna cercar_agenda.",
      inputSchema: {
        url: z.string().describe("URL completa o ruta de l'esdeveniment, p.ex. /penedes/agenda/2026/la-verema-del-cava/268356"),
      },
    },
    async ({ url }) => json(await detallEsdeveniment(url)),
  );

  server.registerTool(
    "cartellera",
    {
      title: "Cartellera de cinema",
      description: "Retorna les pel·lícules de la setmana a surtdecasa.cat amb el seu enllaç i cartell.",
    },
    async () => json(await cartellera()),
  );

  server.registerTool(
    "poblacions",
    {
      title: "Cercar poblacions",
      description:
        "Autocomplete de poblacions de surtdecasa.cat. Passa-hi un prefix o fragment de nom i retorna els noms exactes acceptats pel filtre poblacio de cercar_agenda.",
      inputSchema: {
        terme: z.string().min(2).describe("Prefix o fragment del nom de població"),
      },
    },
    async ({ terme }) => json(await poblacions(terme)),
  );
}
