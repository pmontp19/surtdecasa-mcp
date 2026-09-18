import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registraEines } from "./tools.js";

export type Env = {
  MCP: DurableObjectNamespace<SurtdecasaMCP>;
};

export class SurtdecasaMCP extends McpAgent<Env> {
  server = new McpServer({ name: "surtdecasa", version: "0.1.0" });

  async init() {
    registraEines(this.server);
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/mcp") {
      return SurtdecasaMCP.serve("/mcp", { binding: "MCP" }).fetch(request, env, ctx);
    }
    if (url.pathname === "/llms.txt") {
      return new Response(
        `# Surt de Casa (surtdecasa.cat)

> Servidor MCP amb l'agenda cultural de Catalunya de surtdecasa.cat: esdeveniments, cartellera de cinema i poblacions. Obert, sense autenticacio.

L'endpoint MCP (Streamable HTTP) es a \`/mcp\`: https://surtdecasa-mcp.peremontpeo.workers.dev/mcp

## Eines

- [cercar_agenda](https://github.com/pmontp19/surtdecasa-mcp#eines): cerca esdeveniments per zona, categoria, tipus, poblacio, dies o rang de dates
- [detall_esdeveniment](https://github.com/pmontp19/surtdecasa-mcp#eines): informacio completa d'un esdeveniment
- [cartellera](https://github.com/pmontp19/surtdecasa-mcp#eines): pelicules de la setmana
- [poblacions](https://github.com/pmontp19/surtdecasa-mcp#eines): autocomplete de noms de poblacio

## Fonts

- [surtdecasa.cat](https://surtdecasa.cat): el digital de cultura de proximitat
- [Repositori](https://github.com/pmontp19/surtdecasa-mcp): codi font i documentacio
`,
        { headers: { "content-type": "text/plain; charset=utf-8" } },
      );
    }
    if (url.pathname === "/") {
      return new Response("surtdecasa-mcp: endpoint MCP a /mcp (Streamable HTTP)", {
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
    return new Response("Not found", { status: 404 });
  },
};
