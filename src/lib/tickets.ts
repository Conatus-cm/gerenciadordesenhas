import { supabase } from "@/integrations/supabase/client";

export type Ticket = {
  id: string;
  ticket_code: string;
  counter_number: number;
  attendant_name: string | null;
  called_at: string;
};

export type QueueItem = {
  id: string;
  ticket_code: string;
  category_name: string;
  category_prefix: string;
  is_priority: boolean;
  status: "waiting" | "called" | "cancelled";
  created_at: string;
};

const QUEUE_STORAGE_KEY = "atendimento_ticket_queue";

// Helper para ler fila local de fallback
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

// Emite uma nova senha no Totem e adiciona à Fila de Espera
export async function addTicketToQueue(
  ticket_code: string,
  category_name: string,
  category_prefix: string,
  is_priority: boolean = false
): Promise<QueueItem> {
  const newItem: QueueItem = {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    ticket_code,
    category_name,
    category_prefix,
    is_priority,
    status: "waiting",
    created_at: new Date().toISOString(),
  };

  // Salvar no localStorage
  const currentQueue = getLocalQueue();
  saveLocalQueue([...currentQueue, newItem]);

  // Tentar salvar no Supabase
  try {
    await supabase.from("ticket_queue").insert({
      id: newItem.id,
      ticket_code,
      is_priority,
      status: "waiting",
    });
  } catch {}

  // Broadcast realtime via Supabase Channel
  try {
    const channel = supabase.channel("queue-channel");
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channel.send({
          type: "broadcast",
          event: "new_ticket_queued",
          payload: newItem,
        });
      }
    });
  } catch {}

  return newItem;
}

// Busca a fila de senhas aguardando
export async function fetchQueue(): Promise<QueueItem[]> {
  let localItems = getLocalQueue().filter((q) => q.status === "waiting");

  try {
    const { data, error } = await supabase
      .from("ticket_queue")
      .select("*")
      .eq("status", "waiting")
      .order("is_priority", { ascending: false })
      .order("created_at", { ascending: true });

    if (!error && data && data.length > 0) {
      const mapped: QueueItem[] = data.map((d: any) => ({
        id: d.id,
        ticket_code: d.ticket_code,
        category_name: d.is_priority ? "Atendimento Preferencial" : "Atendimento Geral",
        category_prefix: d.ticket_code.split("-")[0] || "N",
        is_priority: d.is_priority,
        status: (d.status as any) || "waiting",
        created_at: d.created_at,
      }));
      return mapped;
    }
  } catch {}

  // Ordenar localmente: prioridades primeiro, depois por data de criação
  return localItems.sort((a, b) => {
    if (a.is_priority !== b.is_priority) return a.is_priority ? -1 : 1;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

// Remover/Remover da Fila ao Chamar
export async function removeQueueItem(id: string) {
  const current = getLocalQueue();
  const updated = current.map((item) => (item.id === id ? { ...item, status: "called" as const } : item));
  saveLocalQueue(updated);

  try {
    await supabase.from("ticket_queue").update({ status: "called", called_at: new Date().toISOString() }).eq("id", id);
  } catch {}
}

// Chamadas de Senhas já atendidas
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

// Inscrição em Tempo Real para Fila de Espera (Totem -> Atendente)
export function subscribeQueue(onChange: () => void) {
  const ch = supabase
    .channel("queue-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "ticket_queue" },
      () => onChange()
    )
    .on("broadcast", { event: "new_ticket_queued" }, () => onChange())
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
