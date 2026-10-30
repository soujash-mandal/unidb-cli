import test from "node:test";
import assert from "node:assert/strict";
import { formatResult } from "../src/format.js";

test("formats row results as an aligned table", () => {
  const output = formatResult({ ok: true, kind: "rows", columns: [{ name: "id" }, { name: "name" }], rows: [[1, "Mira"], [22, "A"]] });
  assert.ok(output.includes("| id   | name |"));
  assert.match(output, /2 rows/);
});

test("formats command results", () => {
  assert.equal(formatResult({ ok: true, kind: "command", message: "Table created", affected_rows: 0 }), "Table created (0 rows affected)");
});

test("formats server errors", () => {
  assert.equal(formatResult({ ok: false, error: { message: "Unknown table" } }), "Error: Unknown table");
});

test("rejects malformed row shapes", () => {
  assert.throws(() => formatResult({ ok: true, kind: "rows", columns: [{ name: "id" }], rows: [[1, 2]] }), /column count/);
});
