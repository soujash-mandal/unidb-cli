import test from "node:test";
import assert from "node:assert/strict";
import net from "node:net";
import { spawn } from "node:child_process";
import { once } from "node:events";

test("exits cleanly after the quit command", async () => {
  const server = net.createServer((socket) => socket.on("error", () => {}));
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const child = spawn(process.execPath, ["bin/unidb.js", "--port", String(server.address().port)], {
    stdio: ["pipe", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8").on("data", (chunk) => { stdout += chunk; });
  child.stderr.setEncoding("utf8").on("data", (chunk) => { stderr += chunk; });
  child.stdin.end("\\q\n");
  const [code] = await once(child, "exit");
  assert.equal(code, 0, stderr);
  assert.match(stdout, /Connected to UniDB/);
  assert.match(stdout, /Disconnected from UniDB/);
  server.close();
  await once(server, "close");
});

test("disconnects cleanly when stdin reaches EOF", async () => {
  const server = net.createServer((socket) => socket.on("error", () => {}));
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const child = spawn(process.execPath, ["bin/unidb.js", "--port", String(server.address().port)], {
    stdio: ["pipe", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8").on("data", (chunk) => { stdout += chunk; });
  child.stderr.setEncoding("utf8").on("data", (chunk) => { stderr += chunk; });
  child.stdin.end();
  const [code] = await once(child, "exit");
  assert.equal(code, 0, stderr);
  assert.match(stdout, /Disconnected from UniDB/);
  server.close();
  await once(server, "close");
});
