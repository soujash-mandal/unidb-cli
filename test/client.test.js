import test from "node:test";
import assert from "node:assert/strict";
import net from "node:net";
import { once } from "node:events";
import { UniDBClient } from "../src/client.js";

test("sends one newline-framed query and reads a fragmented JSON response", async () => {
  let received = "";
  const server = net.createServer((socket) => {
    socket.on("data", (chunk) => {
      received += chunk.toString("utf8");
      if (received.includes("\n")) {
        socket.write('{"ok":true,"kind":"command",');
        setImmediate(() => socket.write('"message":"Table created","affected_rows":0}\n'));
      }
    });
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  const client = new UniDBClient({ host: "127.0.0.1", port: address.port, useTls: false });
  try {
    await client.connect();
    const response = await client.query("CREATE TABLE users (id INT)");
    assert.equal(received, "CREATE TABLE users (id INT)\n");
    assert.equal(response.ok, true);
    assert.equal(response.message, "Table created");
  } finally {
    await client.close();
    server.close();
    await once(server, "close");
  }
});

test("rejects multi-line and oversized statements before writing", async () => {
  const server = net.createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const client = new UniDBClient({ host: "127.0.0.1", port: server.address().port, useTls: false });
  try {
    await client.connect();
    await assert.rejects(client.query("SELECT 1\nSELECT 2"), /one SQL statement per line/);
    await assert.rejects(client.query("x".repeat(64 * 1024 + 1)), /64 KiB/);
  } finally {
    await client.close();
    server.close();
    await once(server, "close");
  }
});
