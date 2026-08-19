import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Pencil, PhoneCall, RotateCcw, History, Check, Tv, Trash2, RefreshCcw, CheckCircle2, Repeat } from "lucide-react";
import { fetchTickets, insertTicket, subscribeTickets, type Ticket } from "@/lib/tickets";
import {
  fetchPlaylist,
  addPlaylistItem,
  removePlaylistItem,
  resetPlaylistPlayed,
  subscribePlaylist,
  detectMediaFromUrl,
  requestRepeat,
  type PlaylistItem,
} from "@/lib/display";
import { toast } from "sonner";

export const Route = createFileRoute("/atendente")({
  ssr: false,
  head: () => ({ meta: [{ title: "Painel do Atendente" }] }),
  component: AtendentePage,
});

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function clampSeq(n: number) {
  if (!Number.isFinite(n) || n < 1) return 1;
  if (n > 999) return 999;
  return Math.floor(n);
}

function AtendentePage() {
  const [counter, setCounter] = useState<number>(() => {
    if (typeof window === "undefined") return 1;
    return Number(localStorage.getItem("counter_number")) || 1;
  });
  const [attendant, setAttendant] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("attendant_name") || "";
  });
  const [nextSeq, setNextSeq] = useState<number>(() => {
    if (typeof window === "undefined") return 101;
    return Number(localStorage.getItem("next_seq")) || 101;
  });
  const [editingCounter, setEditingCounter] = useState(false);
  const [editingNext, setEditingNext] = useState(false);
  const [nextDraft, setNextDraft] = useState<string>("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [manual, setManual] = useState("");
  const [loading, setLoading] = useState(false);

  // Playlist da TV
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [mediaInput, setMediaInput] = useState("");
  const [savingMedia, setSavingMedia] = useState(false);

  const reloadMedia = () => fetchPlaylist().then(setPlaylist).catch(() => {});

  const last = tickets[0] ?? null;
  const lastCode = last?.ticket_code ?? null;

  const reload = () => fetchTickets(20).then(setTickets).catch((e) => toast.error(e.message));

  useEffect(() => {
    reload();
    reloadMedia();
    const unsubT = subscribeTickets(reload);
    const unsubM = subscribePlaylist(reloadMedia);
    return () => { unsubT(); unsubM(); };
  }, []);

  useEffect(() => { localStorage.setItem("counter_number", String(counter)); }, [counter]);
  useEffect(() => { localStorage.setItem("attendant_name", attendant); }, [attendant]);
  useEffect(() => { localStorage.setItem("next_seq", String(nextSeq)); }, [nextSeq]);

  const callTicket = async (code: string) => {
    setLoading(true);
    try {
      await insertTicket(code, counter, attendant.trim() || null);
      toast.success(`Senha ${code} chamada no guichê ${counter}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const callNext = async () => {
    const code = String(nextSeq);
    await callTicket(code);
    setNextSeq((n) => clampSeq(n + 1));
  };

  const callManual = async () => {
    const code = manual.trim();
    if (!code) return;
    await callTicket(code);
    setManual("");
  };

  const saveNextDraft = () => {
    const n = clampSeq(parseInt(nextDraft, 10));
    setNextSeq(n);
    setEditingNext(false);
  };

  const addMedia = async () => {
    const parsed = detectMediaFromUrl(mediaInput);
    if (!parsed) {
      toast.error("Link inválido. Use YouTube ou URL .mp4");
      return;
    }
    setSavingMedia(true);
    try {
      await addPlaylistItem(parsed.type, parsed.url);
      toast.success("Adicionado à fila");
      setMediaInput("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingMedia(false);
    }
  };

  const removeMedia = async (id: string) => {
    try { await removePlaylistItem(id); } catch (e: any) { toast.error(e.message); }
  };

  const resetMedia = async () => {
    try {
      await resetPlaylistPlayed();
      toast.success("Fila reiniciada");
    } catch (e: any) { toast.error(e.message); }
  };

  const repeatMedia = async (id: string) => {
    try {
      await requestRepeat(id);
      toast.success("Repetindo vídeo na TV");
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-6">
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-8 tracking-wide text-center">
        PAINEL DO ATENDENTE — GUICHÊ {counter}
        {attendant && <span className="block text-base font-medium text-white/70 mt-1">Atendente: {attendant}</span>}
      </h1>

      <div className="w-full max-w-md space-y-5">
        {/* Main card */}
        <div className="bg-card text-card-foreground rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-border">
            <span className="font-semibold tracking-wider text-sm">NÚMERO DO GUICHÊ:</span>
            <div className="flex items-center gap-2">
              {editingCounter ? (
                <input
                  type="number"
                  min={1}
                  value={counter}
                  autoFocus
                  onChange={(e) => setCounter(Math.max(1, Number(e.target.value) || 1))}
                  onBlur={() => setEditingCounter(false)}
                  onKeyDown={(e) => e.key === "Enter" && setEditingCounter(false)}
                  className="w-16 px-2 py-1 rounded border border-input text-center font-bold"
                />
              ) : (
                <span className="font-bold text-lg">{counter}</span>
              )}
              <button onClick={() => setEditingCounter((v) => !v)} className="text-muted-foreground hover:text-foreground">
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="px-4 py-3 rounded-xl border border-border space-y-1.5">
            <label className="font-semibold tracking-wider text-xs text-muted-foreground">NOME DO ATENDENTE</label>
            <input
              value={attendant}
              onChange={(e) => setAttendant(e.target.value)}
              placeholder="Ex: Carlos"
              className="w-full px-2 py-1 rounded border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Next seq editor */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-secondary/40">
            <span className="font-semibold tracking-wider text-xs text-muted-foreground">PRÓXIMA SENHA:</span>
            <div className="flex items-center gap-2">
              {editingNext ? (
                <>
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={nextDraft}
                    autoFocus
                    onChange={(e) => setNextDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveNextDraft()}
                    className="w-20 px-2 py-1 rounded border border-input text-center font-bold"
                  />
                  <button onClick={saveNextDraft} className="text-primary hover:opacity-80">
                    <Check className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <span className="font-bold text-lg">{nextSeq}</span>
                  <button
                    onClick={() => { setNextDraft(String(nextSeq)); setEditingNext(true); }}
                    className="text-muted-foreground hover:text-foreground"
                    title="Editar próxima senha"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          <button
            onClick={callNext}
            disabled={loading}
            className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl hover:opacity-90 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <PhoneCall className="w-5 h-5" />
            CHAMAR PRÓXIMA SENHA ({nextSeq})
          </button>

          <button
            onClick={() => lastCode && callTicket(lastCode)}
            disabled={loading || !lastCode}
            className="w-full bg-primary/90 text-primary-foreground font-semibold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            REPETIR SENHA ATUAL ({lastCode ?? "—"})
          </button>

          <p className="text-center text-xs text-muted-foreground tracking-wider">
            ÚLTIMA SENHA: <span className="font-bold text-foreground">{lastCode ?? "—"}</span>
          </p>
        </div>

        {/* Manual card */}
        <div className="bg-card text-card-foreground rounded-2xl p-5 shadow-2xl space-y-3">
          <p className="text-center font-semibold tracking-wider text-sm">SENHA MANUAL</p>
          <p className="text-center text-xs text-muted-foreground -mt-1">
            Não altera a sequência das próximas senhas
          </p>
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && callManual()}
            placeholder="Ex: 80"
            className="w-full px-3 py-2 rounded-lg border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={callManual}
            disabled={loading || !manual.trim()}
            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50"
          >
            CHAMAR MANUAL
          </button>
        </div>

        {/* Media card */}
        <div className="bg-card text-card-foreground rounded-2xl p-5 shadow-2xl space-y-3">
          <p className="flex items-center justify-center gap-2 font-semibold tracking-wider text-sm">
            <Tv className="w-4 h-4" /> FILA DA TV
          </p>
          <p className="text-center text-xs text-muted-foreground -mt-1">
            YouTube ou URL .mp4 · toca em ordem e reinicia ao terminar
          </p>
          {playlist.length > 0 && (
            <ol className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {playlist.map((p, i) => (
                <li
                  key={p.id}
                  className={`flex items-center gap-2 text-xs rounded-lg px-2.5 py-1.5 border ${
                    p.played_at ? "bg-muted/60 text-muted-foreground border-border" : "bg-secondary/40 border-border"
                  }`}
                >
                  <span className="font-bold w-5 text-center">{i + 1}</span>
                  {p.played_at ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                  )}
                  <span className="flex-1 truncate" title={p.media_url}>
                    [{p.media_type}] {p.media_url}
                  </span>
                  <button
                    onClick={() => repeatMedia(p.id)}
                    className="text-muted-foreground hover:text-primary shrink-0"
                    title="Repetir agora na TV"
                  >
                    <Repeat className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removeMedia(p.id)}
                    className="text-muted-foreground hover:text-destructive shrink-0"
                    title="Remover"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ol>
          )}
          <input
            value={mediaInput}
            onChange={(e) => setMediaInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addMedia()}
            placeholder="https://youtu.be/... ou https://.../video.mp4"
            className="w-full px-3 py-2 rounded-lg border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={addMedia}
              disabled={savingMedia || !mediaInput.trim()}
              className="bg-primary text-primary-foreground font-bold py-2.5 rounded-xl hover:opacity-90 transition disabled:opacity-50"
            >
              ADICIONAR
            </button>
            <button
              onClick={resetMedia}
              disabled={playlist.length === 0}
              className="bg-secondary text-secondary-foreground font-semibold py-2.5 rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <RefreshCcw className="w-4 h-4" /> Reiniciar
            </button>
          </div>
        </div>



        {/* History card */}
        <div className="bg-card text-card-foreground rounded-2xl p-5 shadow-2xl">
          <p className="flex items-center justify-center gap-2 font-semibold tracking-wider text-sm mb-3">
            <History className="w-4 h-4" /> ÚLTIMAS SENHAS CHAMADAS
          </p>
          {tickets.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm">Nenhuma senha chamada</p>
          ) : (
            <ol className="space-y-2 text-sm">
              {tickets.slice(0, 10).map((t) => (
                <li key={t.id} className="grid grid-cols-[auto_1fr_auto] gap-2 items-center border-b border-border/50 last:border-0 pb-2 last:pb-0">
                  <span className="font-bold text-base text-primary">{t.ticket_code}</span>
                  <span className="text-muted-foreground text-xs">
                    Guichê {t.counter_number}{t.attendant_name ? ` · ${t.attendant_name}` : ""}
                  </span>
                  <span className="text-muted-foreground text-xs whitespace-nowrap">{formatTime(t.called_at)}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
