import { supabase as supabaseTyped } from "@/integrations/supabase/client";
// types.ts ainda não tem display_settings — cast leve até o regen
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

export async function fetchPlaylist(): Promise<PlaylistItem[]> {
  const { data, error } = await supabase
    .from("playlist_items")
    .select("*")
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []) as PlaylistItem[];
}

export async function addPlaylistItem(media_type: MediaType, media_url: string) {
  const { data: maxRow } = await supabase
    .from("playlist_items")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const next = (maxRow?.position ?? 0) + 1;
  const { error } = await supabase
    .from("playlist_items")
    .insert({ media_type, media_url, position: next });
  if (error) throw error;
}

export async function removePlaylistItem(id: string) {
  const { error } = await supabase.from("playlist_items").delete().eq("id", id);
  if (error) throw error;
}

export async function markPlayed(id: string) {
  const { error } = await supabase
    .from("playlist_items")
    .update({ played_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function resetPlaylistPlayed() {
  const { error } = await supabase
    .from("playlist_items")
    .update({ played_at: null })
    .not("id", "is", null);
  if (error) throw error;
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
  return () => {
    supabase.removeChannel(channel);
  };
}

export type RepeatSignal = { repeat_item_id: string | null; repeat_requested_at: string | null };

export async function fetchRepeatSignal(): Promise<RepeatSignal | null> {
  const { data, error } = await supabase
    .from("display_settings")
    .select("repeat_item_id, repeat_requested_at")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  return data as RepeatSignal | null;
}

export async function requestRepeat(itemId: string) {
  const { error } = await supabase
    .from("display_settings")
    .upsert({ id: 1, repeat_item_id: itemId, repeat_requested_at: new Date().toISOString() });
  if (error) throw error;
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
  return () => {
    supabase.removeChannel(channel);
  };
}


export async function fetchDisplaySettings(): Promise<DisplaySettings | null> {
  const { data, error } = await supabase
    .from("display_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  return data as DisplaySettings | null;
}

export async function updateDisplaySettings(media_type: MediaType, media_url: string) {
  const { error } = await supabase
    .from("display_settings")
    .upsert({ id: 1, media_type, media_url, updated_at: new Date().toISOString() });
  if (error) throw error;
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

// Aceita URL completa do YouTube (watch, youtu.be, embed, shorts) ou ID puro
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
  // assume mp4 / direct video
  if (/^https?:\/\/.+/i.test(s)) return { type: "mp4", url: s };
  return null;
}
