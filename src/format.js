export function formatResult(response) {
  if (!response || typeof response.ok !== "boolean") throw new TypeError("Invalid UniDB response");
  if (!response.ok) return `Error: ${response.error?.message ?? "Query failed"}`;
  if (response.kind === "command") {
    const affected = Number.isInteger(response.affected_rows) ? ` (${response.affected_rows} rows affected)` : "";
    return `${response.message ?? "Command completed"}${affected}`;
  }
  if (response.kind !== "rows" || !Array.isArray(response.columns) || !Array.isArray(response.rows)) throw new TypeError("Unsupported result shape");
  const headers = response.columns.map((column) => String(column.name));
  const rows = response.rows.map((row) => {
    if (!Array.isArray(row) || row.length !== headers.length) throw new TypeError("Invalid row column count");
    return row.map((value) => value == null ? "NULL" : String(value));
  });
  const widths = headers.map((header, i) => Math.max(header.length, ...rows.map((row) => row[i].length), 0));
  const border = (fill) => "+" + widths.map((width) => fill.repeat(width + 2)).join("+") + "+";
  const render = (values) => "| " + values.map((value, i) => value.padEnd(widths[i])).join(" | ") + " |";
  return [border("-"), render(headers), border("="), ...rows.map(render), border("-"), `${rows.length} row${rows.length === 1 ? "" : "s"}`].join("\n");
}
