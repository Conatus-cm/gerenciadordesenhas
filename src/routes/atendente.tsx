import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Pencil, PhoneCall, RotateCcw, History, Check, Tv, Trash2, RefreshCcw, CheckCircle2, Repeat, CircleCheckBig, X, Tag } from "lucide-react";
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
  const [editingCounter, setEditingCounter] = useState(false);
  const [editingNext, setEditingNext] = useState(false);
  const [nextDraft, setNextDraft] = useState<string>("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
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
      setActiveTicket(code);
      toast.success(`Senha ${code} chamada no guichê ${counter}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFinalizeModal = () => {
    setSelectedTipo("nao_informado");
    setShowFinalizeModal(true);
  };

  const confirmFinishTicket = (tipoLabel?: string) => {
    const tipo = tipoLabel || TIPOS_ATENDIMENTO.find((t) => t.id === selectedTipo)?.label || "Não informado";
    
    // Salva histórico de atendimento concluído no localStorage
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
      localStorage.setItem(historyKey, JSON.stringify([record, ...existing].slice(0, 100)));
    } catch {}

    toast.success(`Senha ${activeTicket} finalizada com sucesso (${tipo})`);
    setActiveTicket(null);
    setShowFinalizeModal(false);
  };

  const callNext = async () => {
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
                  <span className="font-bold text-lg">{String(nextSeq).padStart(3, "0")}</span>
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

          {activeTicket ? (
            <>
              <div className="bg-emerald-500/10 border-2 border-emerald-500 rounded-xl p-4 text-center space-y-1">
                <p className="text-xs font-semibold text-emerald-400 tracking-wider">EM ATENDIMENTO</p>
                <p className="text-4xl font-black text-emerald-400">{activeTicket}</p>
                <p className="text-xs text-muted-foreground">Guichê {counter}</p>
              </div>
              <button
                onClick={handleOpenFinalizeModal}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition shadow-lg flex items-center justify-center gap-2"
              >
                <CircleCheckBig className="w-5 h-5" />
                FINALIZAR ATENDIMENTO
              </button>
              <button
                onClick={() => callTicket(activeTicket)}
                disabled={loading}
                className="w-full bg-primary/90 text-primary-foreground font-semibold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                REPETIR SENHA ({activeTicket})
              </button>
            </>
          ) : (
            <>
              <button
                onClick={callNext}
                disabled={loading}
                className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl hover:opacity-90 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <PhoneCall className="w-5 h-5" />
                CHAMAR PRÓXIMA SENHA ({String(nextSeq).padStart(3, "0")})
              </button>

              <button
                onClick={() => lastCode && callTicket(lastCode)}
                disabled={loading || !lastCode}
                className="w-full bg-primary/90 text-primary-foreground font-semibold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                REPETIR SENHA ATUAL ({lastCode ?? "—"})
              </button>
            </>
          )}

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

      {/* Modal: Seleção do Tipo de Atendimento */}
      {showFinalizeModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground border border-border w-full max-w-lg rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Cabeçalho do Modal */}
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary">Finalizar Atendimento</p>
                <h3 className="text-2xl font-black">Senha: <span className="text-emerald-500">{activeTicket}</span></h3>
              </div>
              <button
                onClick={() => setShowFinalizeModal(false)}
                className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Selecione o <strong>tipo de atendimento</strong> realizado para concluir:
            </p>

            {/* Grid dos Tipos de Atendimento */}
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

            {/* Rodapé com botão de cancelar */}
            <div className="mt-6 pt-4 border-t border-border flex justify-end">
              <button
                onClick={() => setShowFinalizeModal(false)}
                className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition"
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
