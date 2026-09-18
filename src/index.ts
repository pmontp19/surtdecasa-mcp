#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registraEines } from "./tools.js";

const server = new McpServer({ name: "surtdecasa", version: "0.1.0" });
registraEines(server);

await server.connect(new StdioServerTransport());
