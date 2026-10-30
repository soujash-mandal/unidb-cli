#!/usr/bin/env node
import { createInterface } from "node:readline";
import { parseArgs, HELP } from "../src/config.js";
import { UniDBClient } from "../src/client.js";
import { formatResult } from "../src/format.js";

async function main() {
  let config;
  try { config = parseArgs(process.argv.slice(2)); }
  catch (error) { console.error("Error: " + error.message + "\\n\\nRun unidb --help for usage."); process.exitCode = 2; return; }
  if (config.help) { console.log(HELP); return; }

  const client = new UniDBClient(config);
  try { await client.connect(); }
  catch (error) {
    console.error("Could not connect to UniDB at " + config.host + ":" + config.port + ": " + error.message);
    process.exitCode = 1;
    return;
  }

  console.log("Connected to UniDB at " + config.host + ":" + config.port);
  console.log("Enter one statement per line. Type \\q or press Ctrl+D to exit.");
  const terminal = createInterface({ input: process.stdin, output: process.stdout, terminal: Boolean(process.stdin.isTTY) });
  if (process.stdin.isTTY) terminal.setPrompt("unidb> ");
  if (process.stdin.isTTY) terminal.prompt();
  for await (const line of terminal) {
    const sql = line.trim();
    if (sql === "\\\\q" || ["quit", "exit"].includes(sql.toLowerCase())) { terminal.close(); break; }
    if (!sql) { if (process.stdin.isTTY) terminal.prompt(); continue; }
    try { console.log(formatResult(await client.query(sql))); }
    catch (error) { console.error("Error: " + error.message); }
    if (process.stdin.isTTY) terminal.prompt();
  }
  await client.close();
  console.log("\\nDisconnected from UniDB.");
}

main().catch((error) => { console.error("Fatal error: " + error.message); process.exitCode = 1; });
