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
    if (url.pathname === "/") {
      return new Response("surtdecasa-mcp: endpoint MCP a /mcp (Streamable HTTP)", {
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
    return new Response("Not found", { status: 404 });
  },
};
