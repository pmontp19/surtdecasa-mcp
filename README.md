# surtdecasa-mcp

Servidor MCP per [surtdecasa.cat](https://surtdecasa.cat), el digital de cultura de proximitat. Dona accés a l'agenda cultural, la cartellera de cinema i el cercador de poblacions directament des de qualsevol client MCP.

Disponible en dos modes:

- **Remot**: Streamable HTTP a `https://surtdecasa-mcp.peremontpeo.workers.dev/mcp` (Cloudflare Workers, gratis)
- **Local**: stdio, per executar-lo al teu ordinador

## Eines

| Eina | Descripció |
| --- | --- |
| `cercar_agenda` | Cerca esdeveniments amb filtres: zona territorial, categoria, tipus (aire lliure, gratuït, nocturn), població, dies (avui/dema/cap de setmana), rang de dates i paginació |
| `detall_esdeveniment` | Tota la informació d'un esdeveniment: dates, lloc, poblacions, preu, organitzador, descripció i enllaços |
| `cartellera` | Pel·lícules de la setmana amb enllaç i cartell |
| `poblacions` | Autocomplete de poblacions: retorna els noms exactes que accepta el filtre `poblacio` |

## Configuració

### Client remot (recomanat)

```json
{
  "mcp": {
    "surtdecasa": {
      "type": "remote",
      "url": "https://surtdecasa-mcp.peremontpeo.workers.dev/mcp"
    }
  }
}
```

### Client local (stdio)

```json
{
  "mcp": {
    "surtdecasa": {
      "type": "local",
      "command": ["node", "/ruta/a/surtdecasa-mcp/dist/index.js"]
    }
  }
}
```

## Desenvolupament

Requereix Node 20+.

```bash
npm install
npm run build      # typecheck (stdio + workers) i compilar dist/
npm run dev:cf     # wrangler dev local a http://localhost:8787/mcp
npm run deploy     # desplegar a Cloudflare Workers
```

Estructura:

- `src/scraper.ts`: client HTTP i parsers HTML de surtdecasa.cat (Drupal 7 renderitzat al servidor)
- `src/tools.ts`: registre de les eines MCP (compartit entre els dos transports)
- `src/index.ts`: entrada stdio local
- `src/worker.ts`: entrada Cloudflare Workers (Durable Object amb Streamable HTTP)

## Notes

- El site no té API pública: el servidor fa scraping respectuós del HTML (poques peticions on-demand, `User-Agent` identificatiu).
- Sense auth: l'endpoint remot és públic. Si el desplegues per al teu ús, considera afegir-hi un token.
- Zones disponibles: `ebre`, `penedes`, `camp`, `emporda`, `ponent`, `girona`, `centre`, `pirineus`, `barcelona`.

## Llicència

MIT
