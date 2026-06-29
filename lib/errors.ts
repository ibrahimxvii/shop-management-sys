/**
 * Narrows an unknown error (catch block) into a user-safe message string.
 * Shared across all server actions to avoid leaking internal error shapes.
 */
export function parseError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
}

export interface ActionResult<T = void> {
  success: boolean;
  data?: T | null;
  error: string | null;
}

/**
 * Wraps a server action body in try/catch and normalizes the result shape,
 * removing the repeated try/catch/parseError boilerplate from action files.
 */
export async function runAction<T>(
  fn: () => Promise<T>
): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { success: true, data, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}
