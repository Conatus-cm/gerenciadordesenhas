import { supabase } from "@/integrations/supabase/client";

export type Ticket = {
  id: string;
  ticket_code: string;
  counter_number: number;
  attendant_name: string | null;
  called_at: string;
  department_id?: string | null;
  completed_at?: string | null;
  service_type?: string | null;
  finished_by_name?: string | null;
  finished_by_counter?: number | null;
};

export type QueueItem = {
  id: string;
  ticket_code: string;
  category_name: string;
  category_prefix: string;
  is_priority: boolean;
  status: "waiting" | "called" | "cancelled";
  created_at: string;
  department_id?: string | null;
};

const DEFAULT_DEPARTMENT_ID = "797947a3-6ad6-4c0a-8f27-fe72f80d38d2";
const QUEUE_STORAGE_KEY = "atendimento_ticket_queue";
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

export function getLocalQueue(): QueueItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalQueue(queue: QueueItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  window.dispatchEvent(new Event("queue_updated"));
}

export async function addTicketToQueue(
  ticket_code: string,
  category_name: string,
  category_prefix: string,
  is_priority: boolean = false,
  department_id?: string | null
): Promise<QueueItem> {
  const newItem: QueueItem = {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    ticket_code,
    category_name,
    category_prefix,
    is_priority,
    status: "waiting",
    created_at: new Date().toISOString(),
    department_id: department_id || DEFAULT_DEPARTMENT_ID,
  };

  const currentQueue = getLocalQueue();
  saveLocalQueue([...currentQueue, newItem]);

  const targetDept = department_id || (typeof window !== "undefined" ? localStorage.getItem("department_id") : null) || DEFAULT_DEPARTMENT_ID;

  try {
    await supabase.from("ticket_queue").insert({
      id: newItem.id,
      ticket_code,
      is_priority,
      status: "waiting",
      department_id: targetDept,
    });
  } catch (e) {
    console.warn("Erro ao inserir em ticket_queue:", e);
  }

  return newItem;
}

export async function fetchQueue(department_id?: string | null): Promise<QueueItem[]> {
  const targetDept = department_id || DEFAULT_DEPARTMENT_ID;
  try {
    let query = supabase
      .from("ticket_queue")
      .select("*")
      .eq("status", "waiting");

    if (targetDept) {
      query = query.eq("department_id", targetDept);
    }

    const { data, error } = await query
      .order("created_at", { ascending: true });

    if (!error && data) {
      return data.map((d: any) => ({
        id: d.id,
        ticket_code: d.ticket_code,
        category_name: d.is_priority ? "Atendimento Preferencial" : "Atendimento Normal",
        category_prefix: d.ticket_code?.split("-")[0] || "",
        is_priority: Boolean(d.is_priority),
        status: d.status,
        created_at: d.created_at,
        department_id: d.department_id,
      }));
    }
  } catch {}

  return getLocalQueue().filter((q) => q.status === "waiting");
}

export async function fetchTickets(limit = 20, department_id?: string | null): Promise<Ticket[]> {
  const local = getLocalTickets();
  try {
    let query = supabase
      .from("tickets")
      .select("*")
      .neq("ticket_code", "EXCLUIDO");

    if (department_id) {
      query = query.eq("department_id", department_id);
    }

    const { data, error } = await query
      .order("called_at", { ascending: false })
      .limit(limit);

    if (!error && data && data.length > 0) {
      return (data ?? []) as Ticket[];
    }
  } catch {}
  return local.slice(0, limit);
}

export async function insertTicket(
  ticket_code: string,
  counter_number: number,
  attendant_name: string | null,
  department_id?: string | null
) {
  const targetDept = department_id || (typeof window !== "undefined" ? localStorage.getItem("department_id") : null) || DEFAULT_DEPARTMENT_ID;

  saveLocalTicket({ ticket_code, counter_number, attendant_name, department_id: targetDept });

  try {
    await supabase.from("tickets").insert({
      ticket_code,
      counter_number,
      attendant_name,
      department_id: targetDept,
    });
  } catch (e) {
    console.warn("Supabase insert error:", e);
  }
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

export function subscribeQueue(onChange: () => void, department_id?: string | null) {
  const targetDept = department_id || DEFAULT_DEPARTMENT_ID;
  const ch = supabase
    .channel("queue-realtime-" + (targetDept || "all"))
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "ticket_queue" },
      () => onChange()
    )
    .subscribe();

  const handleStorageChange = () => onChange();
  if (typeof window !== "undefined") {
    window.addEventListener("queue_updated", handleStorageChange);
    window.addEventListener("storage", handleStorageChange);
  }

  return () => {
    supabase.removeChannel(ch);
    if (typeof window !== "undefined") {
      window.removeEventListener("queue_updated", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    }
  };
}
