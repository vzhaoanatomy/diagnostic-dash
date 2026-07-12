/** True when Supabase/Postgres reports a missing column (migration not applied yet). */
export function isMissingColumnError(message: string, column: string): boolean {
  const lower = message.toLowerCase();
  const col = column.toLowerCase();
  return (
    lower.includes(col) &&
    (lower.includes("column") ||
      lower.includes("schema cache") ||
      lower.includes("does not exist"))
  );
}

export const SCHEMA_MIGRATION_HINT =
  "Run the latest SQL migrations in Supabase (Settings → SQL Editor). See supabase/migrations/002 and 003.";
