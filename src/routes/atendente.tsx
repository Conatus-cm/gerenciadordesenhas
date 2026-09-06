import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Pencil,
  PhoneCall,
  RotateCcw,
  History,
  Check,
  Tv,
  Trash2,
  RefreshCcw,
  CheckCircle2,
  Repeat,
  CircleCheckBig,
  X,
  Sparkles,
  UserCheck,
  HeartHandshake,
} from "lucide-react";
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
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function clampSeq(n: number) {
  if (!Number.isFinite(n) || n < 1) return 1;
  if (n > 999) return 999;
  return Math.floor(n);
}

const TIPOS_ATENDIMENTO = [
  { id: "atestado", label: "ATESTADO", icon: "📄" },
  { id: "protocolos", label: "PROTOCOLOS", icon: "📁" },
  { id: "reembolso_escolar", label: "REEMBOLSO ESCOLAR", icon: "🎒" },
  { id: "cartao_cracha", label: "CARTÃO / CRACHÁ", icon: "🪪" },
  { id: "leva_atestado", label: "LEVA ATESTADO", icon: "📨" },
  { id: "vaga_creche", label: "VAGA DE CRECHE", icon: "👶" },
  { id: "papeis_estagio", label: "PAPÉIS DE ESTÁGIO", icon: "📝" },
  { id: "outros", label: "OUTROS", icon: "💼" },
  { id: "nao_informado", label: "Não informado", icon: "⚪" },
];

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
    if (typeof window === "undefined") return 1;
    return Number(localStorage.getItem("next_seq")) || 1;
  });

  const [activeTab, setActiveTab] = useState<"totem" | "manual">("totem");
  const [editingCounter, setEditingCounter] = useState(false);
  const [editingNext, setEditingNext] = useState(false);
  const [nextDraft, setNextDraft] = useState<string>("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [manual, setManual] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTicket, setActiveTicket] = useState<string | null>(null);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState<string>("nao_informado");

  // Playlist da TV
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [mediaInput, setMediaInput] = useState("");
  const [savingMedia, setSavingMedia] = useState(false);

  const reloadMedia = () => fetchPlaylist().then(setPlaylist).catch(() => {});
  const reloadTickets = () =>
    fetchTickets(20).then(setTickets).catch((e) => toast.error(e.message));
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

  useEffect(() => {
    localStorage.setItem("counter_number", String(counter));
  }, [counter]);
  useEffect(() => {
    localStorage.setItem("attendant_name", attendant);
  }, [attendant]);
  useEffect(() => {
    localStorage.setItem("next_seq", String(nextSeq));
  }, [nextSeq]);

  const callTicket = async (code: string) => {
    setLoading(true);
    try {
      await insertTicket(code, counter, attendant.trim() || null);
      setActiveTicket(code);
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

  const callNextAny = async () => {
    if (queue.length > 0) {
      await callQueueItem(queue[0]);
    } else {
      const code = String(nextSeq).padStart(3, "0");
      await callTicket(code);
      setNextSeq((n) => clampSeq(n + 1));
    }
  };

  const callNextNormal = async () => {
    const normalItem = queue.find((q) => !q.is_priority);
    if (normalItem) {
      await callQueueItem(normalItem);
    } else {
      const code = String(nextSeq).padStart(3, "0");
      await callTicket(code);
      setNextSeq((n) => clampSeq(n + 1));
    }
  };

  const callNextPriority = async () => {
    const priorityItem = queue.find((q) => q.is_priority);
    if (priorityItem) {
      await callQueueItem(priorityItem);
    } else if (queue.length > 0) {
      await callQueueItem(queue[0]);
    } else {
      const code = `P ${String(nextSeq).padStart(3, "0")}`;
      await callTicket(code);
      setNextSeq((n) => clampSeq(n + 1));
    }
  };

  const callNextSeq = async () => {
    const code = String(nextSeq).padStart(3, "0");
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

  const handleOpenFinalizeModal = () => {
    setSelectedTipo("nao_informado");
    setShowFinalizeModal(true);
  };

  const confirmFinishTicket = (tipoLabel?: string) => {
    const tipo =
      tipoLabel ||
      TIPOS_ATENDIMENTO.find((t) => t.id === selectedTipo)?.label ||
      "Não informado";

    try {
      const historyKey = "finalized_attendances";
      const existing = JSON.parse(localStorage.getItem(historyKey) || "[]");
      const record = {
        ticket_code: activeTicket,
        counter_number: counter,
        attendant_name: attendant.trim() || null,
        service_type: tipo,
        finished_at: new Date().toISOString(),
      };
      localStorage.setItem(
        historyKey,
        JSON.stringify([record, ...existing].slice(0, 100))
      );
    } catch {}

    toast.success(`Senha ${activeTicket} finalizada com sucesso (${tipo})`);
    setActiveTicket(null);
    setShowFinalizeModal(false);
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
    try {
      await removePlaylistItem(id);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const resetMedia = async () => {
    try {
      await resetPlaylistPlayed();
      toast.success("Fila reiniciada");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const repeatMedia = async (id: string) => {
    try {
      await requestRepeat(id);
      toast.success("Repetindo vídeo na TV");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const totalAguardando = queue.length;
  const totalPreferenciais = queue.filter((q) => q.is_priority).length;

  return (
    <div className="min-h-screen flex flex-col items-center p-6">
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-6 tracking-wide text-center">
        PAINEL DO ATENDENTE — GUICHÊ {counter}
        {attendant && (
          <span className="block text-base font-medium text-white/70 mt-1">
            Atendente: {attendant}
          </span>
        )}
      </h1>

      {/* Tabs Selector: Fila do Totem vs Senha Manual/Sequencial */}
      <div className="bg-card/80 border border-border p-1.5 rounded-2xl flex max-w-md w-full mb-5 shadow-lg">
        <button
          onClick={() => setActiveTab("totem")}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === "totem"
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Fila do Totem ({queue.length})
        </button>

        <button
          onClick={() => setActiveTab("manual")}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === "manual"
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <PhoneCall className="w-4 h-4" />
          Sequencial / Manual
        </button>
      </div>

      <div className="w-full max-w-md space-y-5">
        {/* Main Card */}
        <div className="bg-card text-card-foreground rounded-2xl p-6 shadow-2xl space-y-4">
          {/* Guichê e Atendente */}
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
              <button
                onClick={() => setEditingCounter((v) => !v)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="px-4 py-3 rounded-xl border border-border space-y-1.5">
            <label className="font-semibold tracking-wider text-xs text-muted-foreground">
              NOME DO ATENDENTE
            </label>
            <input
              value={attendant}
              onChange={(e) => setAttendant(e.target.value)}
              placeholder="Ex: Carlos"
              className="w-full px-2 py-1 rounded border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Estado: EM ATENDIMENTO */}
          {activeTicket ? (
            <div className="space-y-3 pt-2">
              <div className="bg-emerald-500/10 border-2 border-emerald-500 rounded-xl p-4 text-center space-y-1">
                <p className="text-xs font-semibold text-emerald-400 tracking-wider">
                  EM ATENDIMENTO
                </p>
                <p className="text-4xl font-black text-emerald-400">{activeTicket}</p>
                <p className="text-xs text-muted-foreground">Guichê {counter}</p>
              </div>
              <button
                onClick={handleOpenFinalizeModal}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <CircleCheckBig className="w-5 h-5" />
                FINALIZAR ATENDIMENTO
              </button>
              <button
                onClick={() => callTicket(activeTicket)}
                disabled={loading}
                className="w-full bg-primary/90 text-primary-foreground font-semibold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                REPETIR SENHA ({activeTicket})
              </button>
            </div>
          ) : activeTab === "totem" ? (
            /* Tab: Fila do Totem */
            <div className="space-y-4 pt-1">
              {/* Contadores da Fila */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-950/40 border border-blue-800/40 rounded-xl p-3 text-center">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
                    AGUARDANDO
                  </span>
                  <span className="text-3xl font-black text-blue-300">
                    {totalAguardando}
                  </span>
                </div>
                <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-3 text-center">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                    PREFERENCIAIS
                  </span>
                  <span className="text-3xl font-black text-emerald-300">
                    {totalPreferenciais}
                  </span>
                </div>
              </div>

              {/* Botões de Ação do Totem */}
              <div className="space-y-2.5">
                <button
                  onClick={callNextAny}
                  disabled={loading}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl transition shadow-lg flex items-center justify-center gap-2 text-sm uppercase tracking-wider cursor-pointer disabled:opacity-50"
                >
                  <PhoneCall className="w-5 h-5" />
                  <span>CHAMAR PRÓXIMA DA FILA</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={callNextNormal}
                    disabled={loading}
                    className="py-3 px-3 bg-secondary text-secondary-foreground hover:bg-secondary/80 font-bold rounded-xl transition text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <UserCheck className="w-4 h-4 text-blue-400" />
                    Chamar Normal
                  </button>

                  <button
                    onClick={callNextPriority}
                    disabled={loading}
                    className="py-3 px-3 bg-secondary text-secondary-foreground hover:bg-secondary/80 font-bold rounded-xl transition text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <HeartHandshake className="w-4 h-4 text-emerald-400" />
                    Chamar Preferencial
                  </button>
                </div>
              </div>

              {/* Lista detalhada das senhas na fila de espera */}
              {queue.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border/60">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Senhas aguardando ({queue.length}):
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {queue.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl border ${
                          item.is_priority
                            ? "bg-emerald-950/30 border-emerald-800/40 text-emerald-300"
                            : "bg-secondary/40 border-border text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-base">
                            {item.ticket_code}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 uppercase font-semibold">
                            {item.category_name}
                          </span>
                        </div>
                        <button
                          onClick={() => callQueueItem(item)}
                          disabled={loading}
                          className="px-3 py-1 bg-primary text-primary-foreground font-bold rounded-lg text-xs hover:opacity-90 transition cursor-pointer"
                        >
                          Chamar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Tab: Sequencial / Manual */
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-secondary/40">
                <span className="font-semibold tracking-wider text-xs text-muted-foreground">
                  PRÓXIMA SENHA:
                </span>
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
                      <button
                        onClick={saveNextDraft}
                        className="text-primary hover:opacity-80"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="font-bold text-lg">
                        {String(nextSeq).padStart(3, "0")}
                      </span>
                      <button
                        onClick={() => {
                          setNextDraft(String(nextSeq));
                          setEditingNext(true);
                        }}
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
                onClick={callNextSeq}
                disabled={loading}
                className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl hover:opacity-90 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <PhoneCall className="w-5 h-5" />
                CHAMAR SEQUENCIAL ({String(nextSeq).padStart(3, "0")})
              </button>
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground tracking-wider pt-1">
            ÚLTIMA SENHA CHAMADA:{" "}
            <span className="font-bold text-foreground">{lastCode ?? "—"}</span>
          </p>
        </div>

        {/* Manual Card */}
        <div className="bg-card text-card-foreground rounded-2xl p-5 shadow-2xl space-y-3">
          <p className="text-center font-semibold tracking-wider text-sm">SENHA MANUAL</p>
          <p className="text-center text-xs text-muted-foreground -mt-1">
            Chama um número específico diretamente
          </p>
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && callManual()}
            placeholder="Ex: 80 ou P 012"
            className="w-full px-3 py-2 rounded-lg border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={callManual}
            disabled={loading || !manual.trim()}
            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
          >
            CHAMAR MANUAL
          </button>
        </div>

        {/* Media Card */}
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
                    p.played_at
                      ? "bg-muted/60 text-muted-foreground border-border"
                      : "bg-secondary/40 border-border"
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
                    className="text-muted-foreground hover:text-primary shrink-0 cursor-pointer"
                    title="Repetir agora na TV"
                  >
                    <Repeat className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removeMedia(p.id)}
                    className="text-muted-foreground hover:text-destructive shrink-0 cursor-pointer"
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
              className="bg-primary text-primary-foreground font-bold py-2.5 rounded-xl hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
            >
              ADICIONAR
            </button>
            <button
              onClick={resetMedia}
              disabled={playlist.length === 0}
              className="bg-secondary text-secondary-foreground font-semibold py-2.5 rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCcw className="w-4 h-4" /> Reiniciar
            </button>
          </div>
        </div>

        {/* History Card */}
        <div className="bg-card text-card-foreground rounded-2xl p-5 shadow-2xl">
          <p className="flex items-center justify-center gap-2 font-semibold tracking-wider text-sm mb-3">
            <History className="w-4 h-4" /> ÚLTIMAS SENHAS CHAMADAS
          </p>
          {tickets.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm">
              Nenhuma senha chamada
            </p>
          ) : (
            <ol className="space-y-2 text-sm">
              {tickets.slice(0, 10).map((t) => (
                <li
                  key={t.id}
                  className="grid grid-cols-[auto_1fr_auto] gap-2 items-center border-b border-border/50 last:border-0 pb-2 last:pb-0"
                >
                  <span className="font-bold text-base text-primary">
                    {t.ticket_code}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    Guichê {t.counter_number}
                    {t.attendant_name ? ` · ${t.attendant_name}` : ""}
                  </span>
                  <span className="text-muted-foreground text-xs whitespace-nowrap">
                    {formatTime(t.called_at)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* Modal: Seleção do Tipo de Atendimento */}
      {showFinalizeModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground border border-border w-full max-w-lg rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                  Finalizar Atendimento
                </p>
                <h3 className="text-2xl font-black">
                  Senha: <span className="text-emerald-500">{activeTicket}</span>
                </h3>
              </div>
              <button
                onClick={() => setShowFinalizeModal(false)}
                className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Selecione o <strong>tipo de atendimento</strong> realizado para concluir:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[55vh] overflow-y-auto pr-1">
              {TIPOS_ATENDIMENTO.map((tipo) => (
                <button
                  key={tipo.id}
                  onClick={() => confirmFinishTicket(tipo.label)}
                  className="flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-secondary/40 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all text-left group font-medium cursor-pointer"
                >
                  <span className="text-xl">{tipo.icon}</span>
                  <span className="text-xs font-bold uppercase tracking-wider group-hover:translate-x-0.5 transition-transform">
                    {tipo.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-border flex justify-end">
              <button
                onClick={() => setShowFinalizeModal(false)}
                className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
