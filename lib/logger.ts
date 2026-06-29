/**
 * Minimal logging facade. Centralizing console calls here means swapping in
 * a real provider (Sentry, Datadog, Axiom) later is a one-file change instead
 * of a repo-wide find/replace.
 */
export const logger = {
  // TODO: forward to an external error-tracking service (Sentry, Datadog, etc.)
  // once one is provisioned. Until then, console output is the only sink —
  // do not no-op this in production or errors become invisible.
  error(message: string, context?: unknown): void {
    console.error(message, context);
  },

  warn(message: string, context?: unknown): void {
    console.warn(message, context);
  },
};
