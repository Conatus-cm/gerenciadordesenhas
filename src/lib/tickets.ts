import { supabase } from "@/integrations/supabase/client";

export type Ticket = {
  id: string;
  ticket_code: string;
  counter_number: number;
  attendant_name: string | null;
  called_at: string;
};

export async function fetchTickets(limit = 10): Promise<Ticket[]> {
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .order("called_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Ticket[];
}

export async function insertTicket(
  ticket_code: string,
  counter_number: number,
  attendant_name: string | null
) {
  const { error } = await supabase
    .from("tickets")
    .insert({ ticket_code, counter_number, attendant_name });
  if (error) throw error;
}

export function nextCode(lastCode: string | null): string {
  const n = lastCode ? parseInt(lastCode, 10) : 100;
  const next = (isNaN(n) ? 100 : n) + 1;
  return String(next > 999 ? 1 : next);
}

export function subscribeTickets(onChange: () => void) {
  const ch = supabase
    .channel("tickets-realtime")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "tickets" },
      () => onChange()
    )
    .subscribe();
  return () => {
    supabase.removeChannel(ch);
  };
}
