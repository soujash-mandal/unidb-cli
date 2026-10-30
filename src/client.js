import net from "node:net";
import tls from "node:tls";
import { readFile } from "node:fs/promises";
import { StringDecoder } from "node:string_decoder";

const MAX_REQUEST_BYTES = 64 * 1024;
const QUERY_TIMEOUT_MS = 10000;

export class UniDBClient {
  constructor(config) {
    this.config = config;
    this.socket = null;
    this.buffer = "";
    this.decoder = new StringDecoder("utf8");
    this.pending = [];
    this.connected = false;
  }

  async connect() {
    if (this.connected) return;
    const options = { host: this.config.host, port: this.config.port };
    if (this.config.useTls) {
      const [ca, cert, key] = await Promise.all([
        readFile(this.config.ca), readFile(this.config.cert), readFile(this.config.key),
      ]);
      Object.assign(options, { ca, cert, key, rejectUnauthorized: true });
      if (!net.isIP(this.config.host)) options.servername = this.config.host;
      this.socket = tls.connect(options);
    } else {
      this.socket = net.createConnection(options);
    }
    const socket = this.socket;
    await new Promise((resolve, reject) => {
      const event = this.config.useTls ? "secureConnect" : "connect";
      const timer = setTimeout(() => { socket.destroy(); reject(new Error("Connection timed out")); }, 5000);
      const cleanup = () => { clearTimeout(timer); socket.off(event, onConnect); socket.off("error", onError); };
      const onConnect = () => { cleanup(); resolve(); };
      const onError = (error) => { cleanup(); reject(error); };
      socket.once(event, onConnect);
      socket.once("error", onError);
    });
    this.connected = true;
    socket.on("data", (chunk) => this.#onData(chunk));
    socket.on("error", (error) => this.#fail(error));
    socket.on("close", () => { this.connected = false; this.#fail(new Error("Connection to UniDB was closed")); });
  }

  query(sql) {
    if (!this.connected || !this.socket) return Promise.reject(new Error("Not connected to UniDB"));
    if (typeof sql !== "string" || !sql.trim()) return Promise.reject(new Error("SQL statement must not be empty"));
    if (sql.includes("\\n") || sql.includes("\\r")) return Promise.reject(new Error("Enter one SQL statement per line"));
    if (Buffer.byteLength(sql, "utf8") > MAX_REQUEST_BYTES) return Promise.reject(new Error("SQL statement exceeds the 64 KiB limit"));
    return new Promise((resolve, reject) => {
      const request = { resolve, reject };
      request.timer = setTimeout(() => {
        this.#fail(new Error("Query timed out; reconnect before sending another query"));
        this.socket?.destroy();
      }, QUERY_TIMEOUT_MS);
      this.pending.push(request);
      this.socket.write(sql + "\\n", (error) => { if (error) this.#fail(error); });
    });
  }

  #onData(chunk) {
    this.buffer += this.decoder.write(chunk);
    while (true) {
      const newline = this.buffer.indexOf("\\n");
      if (newline < 0) return;
      const line = this.buffer.slice(0, newline);
      this.buffer = this.buffer.slice(newline + 1);
      let response;
      try { response = JSON.parse(line); }
      catch { this.#fail(new Error("UniDB returned invalid JSON")); this.socket?.destroy(); return; }
      if (!response || typeof response.ok !== "boolean" || this.pending.length === 0) {
        this.#fail(new Error("UniDB returned an unexpected response"));
        this.socket?.destroy();
        return;
      }
      const request = this.pending.shift();
      clearTimeout(request.timer);
      request.resolve(response);
    }
  }

  #fail(error) {
    for (const request of this.pending.splice(0)) {
      clearTimeout(request.timer);
      request.reject(error);
    }
  }

  async close() {
    const socket = this.socket;
    this.connected = false;
    this.socket = null;
    if (!socket || socket.destroyed) return;
    await new Promise((resolve) => { socket.once("close", resolve); socket.end(); });
  }
}
