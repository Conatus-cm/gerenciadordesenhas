import { supabase } from "@/integrations/supabase/client";

export type Ticket = {
  id: string;
  ticket_code: string;
  counter_number: number;
  attendant_name: string | null;
  called_at: string;
};

const TICKETS_STORAGE_KEY = "atendimento_called_tickets";

export function getLocalTickets(): Ticket[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TICKETS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalTicket(ticket: Omit<Ticket, "id" | "called_at">): Ticket {
  const current = getLocalTickets();
  const newTicket: Ticket = {
    ...ticket,
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    called_at: new Date().toISOString(),
  };
  const updated = [newTicket, ...current];
  if (typeof window !== "undefined") {
    localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("tickets_updated"));
  }
  return newTicket;
}

export async function fetchTickets(limit = 10): Promise<Ticket[]> {
  try {
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .neq("ticket_code", "EXCLUIDO")
      .order("called_at", { ascending: false })
      .limit(limit);
    if (!error && data && data.length > 0) {
      return (data ?? []) as Ticket[];
    }
  } catch (e) {
    console.warn("fetchTickets fallback to local:", e);
  }
  return getLocalTickets().slice(0, limit);
}

export async function insertTicket(
  ticket_code: string,
  counter_number: number,
  attendant_name: string | null
) {
  saveLocalTicket({ ticket_code, counter_number, attendant_name });

  const { error } = await supabase
    .from("tickets")
    .insert({ ticket_code, counter_number, attendant_name });
  if (error) {
    console.warn("Supabase insert error:", error);
    throw error;
  }
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
      { event: "*", schema: "public", table: "tickets" },
      () => onChange()
    )
    .subscribe();

  const handleStorage = () => onChange();
  if (typeof window !== "undefined") {
    window.addEventListener("tickets_updated", handleStorage);
    window.addEventListener("storage", handleStorage);
  }

  return () => {
    supabase.removeChannel(ch);
    if (typeof window !== "undefined") {
      window.removeEventListener("tickets_updated", handleStorage);
      window.removeEventListener("storage", handleStorage);
    }
  };
}
