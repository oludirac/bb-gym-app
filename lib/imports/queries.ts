import type { SupabaseClient } from "@supabase/supabase-js";

export type ProgramImport = {
  completed_at: string | null;
  created_at: string;
  created_program_id: string | null;
  error_count: number;
  errors: ProgramImportError[];
  filename: string | null;
  id: string;
  row_count: number;
  status: string;
};

export type ProgramImportError = {
  code: string;
  field: string | null;
  id: string;
  message: string;
  row_number: number | null;
};

export async function getRecentProgramImports(supabase: SupabaseClient) {
  const { data: imports, error } = await supabase
    .from("program_imports")
    .select(
      "id, filename, status, row_count, error_count, created_program_id, created_at, completed_at"
    )
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    throw new Error(error.message);
  }

  const importIds = (imports ?? []).map((item) => item.id);

  if (importIds.length === 0) {
    return [];
  }

  const { data: errors, error: errorsError } = await supabase
    .from("import_errors")
    .select("id, import_id, row_number, field, code, message")
    .in("import_id", importIds)
    .order("row_number", { ascending: true });

  if (errorsError) {
    throw new Error(errorsError.message);
  }

  return (imports ?? []).map((item) => ({
    completed_at: item.completed_at,
    created_at: item.created_at,
    created_program_id: item.created_program_id,
    error_count: item.error_count,
    errors: (errors ?? [])
      .filter((importError) => importError.import_id === item.id)
      .map((importError) => ({
        code: importError.code,
        field: importError.field,
        id: importError.id,
        message: importError.message,
        row_number: importError.row_number
      })),
    filename: item.filename,
    id: item.id,
    row_count: item.row_count,
    status: item.status
  })) satisfies ProgramImport[];
}
