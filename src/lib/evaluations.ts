import { supabase } from "@/integrations/supabase/client";

export type Evaluation = {
  id: string;
  ticket_code?: string;
  counter_number?: number;
  attendant_name?: string;
  rating: number; // 1 (Ruim), 2 (Regular), 3 (Bom), 4 (Excelente)
  rating_label: string;
  comment?: string;
  created_at: string;
};

const LOCAL_STORAGE_KEY = "atendimento_evaluations";

export function getLocalEvaluations(): Evaluation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalEvaluation(evalData: Omit<Evaluation, "id" | "created_at">): Evaluation {
  const current = getLocalEvaluations();
  const newEval: Evaluation = {
    ...evalData,
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    created_at: new Date().toISOString(),
  };
  const updated = [newEval, ...current];
  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  }
  return newEval;
}

export async function submitEvaluation(data: Omit<Evaluation, "id" | "created_at">): Promise<Evaluation> {
  const saved = saveLocalEvaluation(data);

  try {
    await supabase.from("evaluations" as any).insert({
      ticket_code: data.ticket_code || null,
      counter_number: data.counter_number || null,
      attendant_name: data.attendant_name || null,
      rating: data.rating,
      rating_label: data.rating_label,
      comment: data.comment || null,
    });
  } catch (err) {
    // Silencioso se não houver a tabela no Supabase
  }

  return saved;
}

export async function fetchEvaluations(): Promise<Evaluation[]> {
  const local = getLocalEvaluations();
  try {
    const { data, error } = await supabase
      .from("evaluations" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      return data as Evaluation[];
    }
  } catch {}
  return local;
}
