import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Pencil, PhoneCall, RotateCcw, History, Check, Tv, Trash2, RefreshCcw, Repeat, Ticket as TicketIcon, Clock, Users, ArrowRight } from "lucide-react";
import {
  fetchTickets,
  insertTicket,
  subscribeTickets,
  fetchQueue,
  removeQueueItem,
  subscribeQueue,
  type Ticket,
  type QueueItem,
} from "@/lib/tickets";
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
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [manual, setManual] = useState("");
  const [loading, setLoading] = useState(false);

  // Playlist da TV
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [mediaInput, setMediaInput] = useState("");
  const [savingMedia, setSavingMedia] = useState(false);

  const reloadMedia = () => fetchPlaylist().then(setPlaylist).catch(() => {});
  const reloadTickets = () => fetchTickets(20).then(setTickets).catch((e) => toast.error(e.message));
  const reloadQueue = () => fetchQueue().then(setQueue).catch(() => {});

  const last = tickets[0] ?? null;
  const lastCode = last?.ticket_code ?? null;

  useEffect(() => {
    reloadTickets();
    reloadQueue();
    reloadMedia();

    const unsubT = subscribeTickets(reloadTickets);
    const unsubQ = subscribeQueue(reloadQueue);
    const unsubM = subscribePlaylist(reloadMedia);

    return () => {
      unsubT();
      unsubQ();
      unsubM();
    };
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

  const callQueueItem = async (item: QueueItem) => {
    await callTicket(item.ticket_code);
    await removeQueueItem(item.id);
    reloadQueue();
  };

  const callNext = async () => {
    if (queue.length > 0) {
      // Pega a primeira da fila (prioridade ou mais antiga)
      const nextItem = queue[0];
      await callQueueItem(nextItem);
    } else {
      // Sequência automática numérica se não houver senhas no totem
      const code = String(nextSeq);
      await callTicket(code);
      setNextSeq((n) => clampSeq(n + 1));
    }
  };

  const callManual = async () => {
    const code = manual.trim();
    if (!code) return;
    await callTicket(code);
    setManual("");
  };

  const cancelQueueItem = async (id: string) => {
    await removeQueueItem(id);
    reloadQueue();
    toast.info("Senha removida da fila.");
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
    <div className="min-h-screen flex flex-col items-center p-4 md:p-6 bg-slate-950 text-slate-100">
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-6 tracking-wide text-center">
        PAINEL DO ATENDENTE — GUICHÊ {counter}
        {attendant && <span className="block text-base font-medium text-slate-400 mt-1">Atendente: {attendant}</span>}
      </h1>

      <div className="w-full max-w-2xl space-y-6">

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* GERENCIADOR DE FILA DE SENHAS SOLICITADAS (TOTEM) */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="bg-slate-900 border border-blue-500/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-2xl text-blue-400">
                <TicketIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  Fila de Senhas Solicitadas (Totem)
                </h2>
                <p className="text-xs text-slate-400">
                  {queue.length === 0 ? "Nenhuma senha aguardando" : `${queue.length} senha(s) na fila de espera`}
                </p>
              </div>
            </div>

            <button
              onClick={reloadQueue}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors text-xs flex items-center gap-1.5"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span>Atualizar</span>
            </button>
          </div>

          {queue.length > 0 ? (
            <div className="space-y-3 mt-4">
              <button
                disabled={loading}
                onClick={callNext}
                className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 text-base"
              >
                <PhoneCall className="w-5 h-5" />
                <span>CHAMAR PRÓXIMA DA FILA ({queue[0].ticket_code})</span>
              </button>

              <div className="divide-y divide-slate-800 max-h-60 overflow-y-auto pr-1">
                {queue.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-2xl font-black text-white">{item.ticket_code}</span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          item.is_priority
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : item.category_prefix === "RH"
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                            : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                        }`}
                      >
                        {item.category_name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => callQueueItem(item)}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        Chamar
                      </button>

                      <button
                        onClick={() => cancelQueueItem(item.id)}
                        className="p-1.5 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded-xl transition-colors"
                        title="Descartar da Fila"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
              <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-xs">As senhas geradas no Totem de Autoatendimento (`/emissao`) aparecerão aqui automaticamente em tempo real.</p>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* CONTROLE PRINCIPAL DO GUICHÊ */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between px-4 py-3 rounded-2xl border border-slate-800 bg-slate-950/50">
            <span className="font-semibold tracking-wider text-xs text-slate-400">NÚMERO DO GUICHÊ:</span>
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
                  className="w-16 px-2 py-1 rounded-xl border border-blue-500 bg-slate-900 text-center font-bold text-white"
                />
              ) : (
                <span className="font-bold text-lg text-white">{counter}</span>
              )}
              <button onClick={() => setEditingCounter((v) => !v)} className="text-slate-400 hover:text-white">
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="px-4 py-3 rounded-2xl border border-slate-800 bg-slate-950/50 space-y-1.5">
            <label className="font-semibold tracking-wider text-xs text-slate-400">NOME DO ATENDENTE</label>
            <input
              value={attendant}
              onChange={(e) => setAttendant(e.target.value)}
              placeholder="Ex: Carlos"
              className="w-full px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-white focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>

          {/* Sequência Numérica Padrão */}
          <div className="flex items-center justify-between px-4 py-3 rounded-2xl border border-slate-800 bg-slate-950/50">
            <span className="font-semibold tracking-wider text-xs text-slate-400">PRÓXIMA SENHA NUMÉRICA:</span>
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
                    className="w-20 px-2 py-1 rounded-xl border border-blue-500 bg-slate-900 text-center font-bold text-white"
                  />
                  <button onClick={saveNextDraft} className="text-blue-400 hover:opacity-80">
                    <Check className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <span className="font-bold text-lg text-white">{nextSeq}</span>
                  <button
                    onClick={() => { setNextDraft(String(nextSeq)); setEditingNext(true); }}
                    className="text-slate-400 hover:text-white"
                    title="Editar próxima senha"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          <button
            disabled={loading}
            onClick={callNext}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 text-base"
          >
            <PhoneCall className="w-5 h-5" />
            <span>CHAMAR SENHA ({queue.length > 0 ? queue[0].ticket_code : nextSeq})</span>
          </button>

          {lastCode && (
            <button
              disabled={loading}
              onClick={() => callTicket(lastCode)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span>REPETIR SENHA ATUAL ({lastCode})</span>
            </button>
          )}
        </div>

        {/* Senha Manual */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-3">
          <label className="font-semibold tracking-wider text-xs text-slate-400">CHAMAR SENHA PERSONALIZADA</label>
          <div className="flex gap-2">
            <input
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && callManual()}
              placeholder="Ex: VIP-01"
              className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-blue-500 font-mono"
            />
            <button
              onClick={callManual}
              disabled={loading || !manual.trim()}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-colors disabled:opacity-50 text-sm"
            >
              Chamar
            </button>
          </div>
        </div>

        {/* Mídias da TV */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
          <h2 className="font-bold text-white text-base flex items-center gap-2">
            <Tv className="w-4 h-4 text-blue-400" />
            Gerenciar Vídeos da TV
          </h2>
          <div className="flex gap-2">
            <input
              value={mediaInput}
              onChange={(e) => setMediaInput(e.target.value)}
              placeholder="Cole o link do YouTube ou .mp4"
              className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-800 bg-slate-950 text-white text-sm focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={addMedia}
              disabled={savingMedia}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-colors text-sm"
            >
              Adicionar
            </button>
          </div>

          <div className="divide-y divide-slate-800">
            {playlist.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                <span className="truncate max-w-[200px] text-slate-300">{item.media_url}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => repeatMedia(item.id)} className="text-blue-400 hover:underline flex items-center gap-1">
                    <Repeat className="w-3.5 h-3.5" /> Repetir
                  </button>
                  <button onClick={() => removeMedia(item.id)} className="text-red-400 hover:underline">
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Histórico */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-3">
          <h2 className="font-bold text-white text-base flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" />
            Últimas Senhas Chamadas
          </h2>
          <div className="divide-y divide-slate-800 text-xs">
            {tickets.slice(0, 10).map((t) => (
              <div key={t.id} className="py-2 flex items-center justify-between">
                <span className="font-mono font-bold text-blue-400">{t.ticket_code}</span>
                <span className="text-slate-400">Guichê {t.counter_number}</span>
                <span className="text-slate-500">{formatTime(t.called_at)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
