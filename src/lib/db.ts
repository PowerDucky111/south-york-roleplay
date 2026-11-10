import { getCloudflareContext } from "@opennextjs/cloudflare";

// Keep the binding surface small and explicit so the app can use D1 without
// introducing an additional ORM or database dependency.
interface D1Result<T> {
  results: T[];
  success: boolean;
  meta: { changes: number; last_row_id: number; duration: number };
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(columnName?: string): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run<T = Record<string, unknown>>(): Promise<D1Result<T>>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<T[]>;
}

export function getDatabase(): D1Database {
  const { env } = getCloudflareContext();
  const bindings = env as unknown as { DB?: D1Database };
  if (!bindings.DB) {
    throw new Error("Cloudflare D1 binding DB is missing. Check wrangler.jsonc and the Worker deployment.");
  }
  return bindings.DB;
}
