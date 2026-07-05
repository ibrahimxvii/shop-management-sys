/**
 * Escapes a value for safe interpolation into a PostgREST `.or()`/`.filter()`
 * expression string. PostgREST splits these on unescaped commas/periods, so a
 * raw user search term containing either could inject additional filter
 * clauses. Wrapping in double quotes (per PostgREST's documented value
 * syntax) and escaping embedded backslashes/quotes neutralizes that.
 */
export function escapePostgrestValue(value: string): string {
  const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${escaped}"`;
}
