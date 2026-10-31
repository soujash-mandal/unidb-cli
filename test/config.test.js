import test from "node:test";
import assert from "node:assert/strict";
import { parseArgs } from "../src/config.js";

test("uses loopback defaults", () => {
  const config = parseArgs([], {});
  assert.equal(config.host, "127.0.0.1");
  assert.equal(config.port, 7432);
  assert.equal(config.useTls, false);
});

test("parses host, port, and mutual TLS options", () => {
  const config = parseArgs(["--host", "db.example.com", "--port", "8000", "--ca", "ca.pem", "--cert", "client.pem", "--key", "client.key"], {});
  assert.equal(config.host, "db.example.com");
  assert.equal(config.port, 8000);
  assert.equal(config.useTls, true);
});

test("rejects remote connections without mutual TLS", () => {
  assert.throws(() => parseArgs(["--host", "db.example.com"], {}), /mutual TLS/);
});

test("rejects partial TLS configuration", () => {
  assert.throws(() => parseArgs(["--ca", "ca.pem"], {}), /all three TLS files/);
});

test("rejects invalid ports and unknown flags", () => {
  assert.throws(() => parseArgs(["--port", "0"], {}), /Port must/);
  assert.throws(() => parseArgs(["--unknown"], {}), /Unknown option/);
});
