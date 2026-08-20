import { supabase as supabaseTyped } from "@/integrations/supabase/client";

const supabase = supabaseTyped as any;

export type MediaType = "youtube" | "mp4";
export type DisplaySettings = {
  id: number;
  media_type: MediaType;
  media_url: string;
  updated_at: string;
};

export type PlaylistItem = {
  id: string;
  position: number;
  media_type: MediaType;
  media_url: string;
  played_at: string | null;
  created_at: string;
};

const PLAYLIST_STORAGE_KEY = "atendimento_playlist_items";

export function getLocalPlaylist(): PlaylistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PLAYLIST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalPlaylist(items: PlaylistItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PLAYLIST_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("playlist_updated"));
}

export async function fetchPlaylist(): Promise<PlaylistItem[]> {
  const local = getLocalPlaylist();
  try {
    const { data, error } = await supabase
      .from("playlist_items")
      .select("*")
      .order("position", { ascending: true });

    if (!error && data) {
      return data as PlaylistItem[];
    }
  } catch {}

  return local.sort((a, b) => a.position - b.position);
}

export async function addPlaylistItem(media_type: MediaType, media_url: string) {
  const local = getLocalPlaylist();
  const nextPos = (local.reduce((max, item) => Math.max(max, item.position), 0)) + 1;

  const newItem: PlaylistItem = {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    position: nextPos,
    media_type,
    media_url,
    played_at: null,
    created_at: new Date().toISOString(),
  };

  saveLocalPlaylist([...local, newItem]);

  try {
    await supabase.from("playlist_items").insert({
      id: newItem.id,
      media_type,
      media_url,
      position: nextPos,
    });
  } catch {}
}

export async function removePlaylistItem(id: string) {
  const local = getLocalPlaylist();
  saveLocalPlaylist(local.filter((item) => item.id !== id));

  try {
    await supabase.from("playlist_items").delete().eq("id", id);
  } catch {}
}

export async function markPlayed(id: string) {
  const local = getLocalPlaylist();
  saveLocalPlaylist(
    local.map((item) => (item.id === id ? { ...item, played_at: new Date().toISOString() } : item))
  );

  try {
    await supabase
      .from("playlist_items")
      .update({ played_at: new Date().toISOString() })
      .eq("id", id);
  } catch {}
}

export async function resetPlaylistPlayed() {
  const local = getLocalPlaylist();
  saveLocalPlaylist(local.map((item) => ({ ...item, played_at: null })));

  try {
    await supabase
      .from("playlist_items")
      .update({ played_at: null })
      .not("id", "is", null);
  } catch {}
}

export function subscribePlaylist(onChange: () => void) {
  const channel = supabase
    .channel("playlist_items_changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "playlist_items" },
      () => onChange(),
    )
    .subscribe();

  const handleStorage = () => onChange();
  if (typeof window !== "undefined") {
    window.addEventListener("playlist_updated", handleStorage);
    window.addEventListener("storage", handleStorage);
  }

  return () => {
    supabase.removeChannel(channel);
    if (typeof window !== "undefined") {
      window.removeEventListener("playlist_updated", handleStorage);
      window.removeEventListener("storage", handleStorage);
    }
  };
}

export type RepeatSignal = { repeat_item_id: string | null; repeat_requested_at: string | null };

export async function fetchRepeatSignal(): Promise<RepeatSignal | null> {
  try {
    const { data, error } = await supabase
      .from("display_settings")
      .select("repeat_item_id, repeat_requested_at")
      .eq("id", 1)
      .maybeSingle();
    if (!error && data) return data as RepeatSignal;
  } catch {}

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("repeat_signal");
      return raw ? JSON.parse(raw) : null;
    } catch {}
  }
  return null;
}

export async function requestRepeat(itemId: string) {
  const signal = { repeat_item_id: itemId, repeat_requested_at: new Date().toISOString() };
  if (typeof window !== "undefined") {
    localStorage.setItem("repeat_signal", JSON.stringify(signal));
    window.dispatchEvent(new Event("repeat_signal_updated"));
  }

  try {
    await supabase
      .from("display_settings")
      .upsert({ id: 1, repeat_item_id: itemId, repeat_requested_at: signal.repeat_requested_at });
  } catch {}
}

export function subscribeRepeatSignal(onChange: () => void) {
  const channel = supabase
    .channel("display_settings_changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "display_settings" },
      () => onChange(),
    )
    .subscribe();

  const handleStorage = () => onChange();
  if (typeof window !== "undefined") {
    window.addEventListener("repeat_signal_updated", handleStorage);
    window.addEventListener("storage", handleStorage);
  }

  return () => {
    supabase.removeChannel(channel);
    if (typeof window !== "undefined") {
      window.removeEventListener("repeat_signal_updated", handleStorage);
      window.removeEventListener("storage", handleStorage);
    }
  };
}

export async function fetchDisplaySettings(): Promise<DisplaySettings | null> {
  try {
    const { data, error } = await supabase
      .from("display_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (!error && data) return data as DisplaySettings;
  } catch {}
  return null;
}

export async function updateDisplaySettings(media_type: MediaType, media_url: string) {
  try {
    await supabase
      .from("display_settings")
      .upsert({ id: 1, media_type, media_url, updated_at: new Date().toISOString() });
  } catch {}
}

export function subscribeDisplaySettings(onChange: () => void) {
  const channel = supabase
    .channel("display_settings_changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "display_settings" },
      () => onChange(),
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export function extractYouTubeId(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
      const parts = u.pathname.split("/").filter(Boolean);
      const idx = parts.findIndex((p) => p === "embed" || p === "shorts");
      if (idx >= 0 && parts[idx + 1] && /^[a-zA-Z0-9_-]{11}$/.test(parts[idx + 1])) {
        return parts[idx + 1];
      }
    }
  } catch {}
  return null;
}

export function detectMediaFromUrl(input: string): { type: MediaType; url: string } | null {
  const s = input.trim();
  if (!s) return null;
  const ytId = extractYouTubeId(s);
  if (ytId) return { type: "youtube", url: ytId };
  if (/^https?:\/\/.+/i.test(s)) return { type: "mp4", url: s };
  return null;
}
