import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Pencil,
  PhoneCall,
  RotateCcw,
  LogOut,
  Bell,
  Tv,
  Trash2,
  Repeat,
  MapPin,
  Volume2,
  VolumeX,
  History,
  CheckCircle2,
  RefreshCcw,
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
  head: () => ({ meta: [{ title: "Painel do Atendente — SEMEC" }] }),
  component: AtendentePage,
});

function clampSeq(n: number) {
  if (!Number.isFinite(n) || n < 1) return 1;
  if (n > 999) return 999;
  return Math.floor(n);
}

function formatShortDate(iso: string) {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}, ${hours}:${minutes}`;
}

function AtendentePage() {
  const [counter, setCounter] = useState<number>(() => {
    if (typeof window === "undefined") return 1;
    return Number(localStorage.getItem("counter_number")) || 1;
  });
  const [attendant, setAttendant] = useState<string>(() => {
    if (typeof window === "undefined") return "Semec TI 2";
    return localStorage.getItem("attendant_name") || "Semec TI 2";
  });
  const [department] = useState("SEMEC Recepção");
  const [nextSeq, setNextSeq] = useState<number>(() => {
    if (typeof window === "undefined") return 80;
    return Number(localStorage.getItem("next_seq")) || 80;
  });

  const [activeTab, setActiveTab] = useState<"totem" | "manual">("totem");
  const [editingCounter, setEditingCounter] = useState(false);
  const [editingAttendant, setEditingAttendant] = useState(false);

  // Volumes da TV e Voz
  const [videoVolume, setVideoVolume] = useState<number>(() => {
    if (typeof window === "undefined") return 10;
    return Number(localStorage.getItem("video_volume")) || 10;
  });
  const [voiceVolume, setVoiceVolume] = useState<number>(() => {
    if (typeof window === "undefined") return 100;
    return Number(localStorage.getItem("voice_volume")) || 100;
  });

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
  const lastCode = last?.ticket_code ?? "RH-086";

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
  useEffect(() => { localStorage.setItem("video_volume", String(videoVolume)); }, [videoVolume]);
  useEffect(() => { localStorage.setItem("voice_volume", String(voiceVolume)); }, [voiceVolume]);

  const requestNotifications = () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          toast.success("Notificações do Windows permitidas!");
        } else {
          toast.error("Permissão de notificação não concedida.");
        }
      });
    } else {
      toast.info("Navegador não suporta notificações nativas.");
    }
  };

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

  const callNextAny = async () => {
    if (queue.length > 0) {
      await callQueueItem(queue[0]);
    } else {
      const code = String(nextSeq);
      await callTicket(code);
      setNextSeq((n) => clampSeq(n + 1));
    }
  };

  const callNextNormal = async () => {
    const normalItem = queue.find((q) => !q.is_priority);
    if (normalItem) {
      await callQueueItem(normalItem);
    } else {
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
      toast.success("Vídeo removido da playlist");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const resetMedia = async () => {
    try {
      await resetPlaylistPlayed();
      toast.success("Fila de mídia reiniciada");
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
    <div className="min-h-screen bg-[#071d49] text-white flex flex-col items-center p-4 md:p-6 font-sans pb-16">
      
      {/* 1. Botão Roxo Superior de Notificações */}
      <button
        onClick={requestNotifications}
        className="w-full max-w-xl bg-[#7c1dff] hover:bg-[#6b15e0] text-white font-bold py-3 px-4 rounded-full shadow-lg transition-all text-xs md:text-sm flex items-center justify-center gap-2 mb-6 uppercase tracking-wide cursor-pointer"
      >
        <Bell className="w-4 h-4 fill-amber-300 text-amber-300" />
        <span>CLIQUE AQUI PARA PERMITIR NOTIFICAÇÕES NATIVAS DO WINDOWS (FORA DO NAVEGADOR)</span>
      </button>

      {/* 2. Barra Superior: Guichê + Sair */}
      <div className="w-full max-w-md flex items-center justify-between gap-4 mb-6">
        <div className="bg-white text-slate-900 rounded-full px-5 py-2 flex items-center gap-2 font-bold shadow-md">
          <span className="text-xs uppercase tracking-wider text-slate-600">GUICHÊ:</span>
          {editingCounter ? (
            <input
              type="number"
              min={1}
              value={counter}
              autoFocus
              onChange={(e) => setCounter(Math.max(1, Number(e.target.value) || 1))}
              onBlur={() => setEditingCounter(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingCounter(false)}
              className="w-12 text-center bg-slate-100 rounded border border-slate-400 font-bold"
            />
          ) : (
            <span className="text-base font-black">{counter}</span>
          )}
          <button onClick={() => setEditingCounter(true)} className="text-slate-400 hover:text-slate-700 ml-1">
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>

        <Link
          to="/"
          className="bg-[#1b2b52] hover:bg-[#253969] text-red-400 hover:text-red-300 border border-red-500/30 rounded-full px-5 py-2 font-bold text-xs flex items-center gap-1.5 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>SAIR</span>
        </Link>
      </div>

      {/* 3. Título Principal do Painel */}
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-4xl font-black tracking-tight mb-1 text-white">
          PAINEL DO ATENDENTE — GUICHÊ {counter}
        </h1>
        <div className="flex items-center justify-center gap-2 text-slate-300 text-sm font-medium">
          {editingAttendant ? (
            <input
              type="text"
              value={attendant}
              onChange={(e) => setAttendant(e.target.value)}
              onBlur={() => setEditingAttendant(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingAttendant(false)}
              autoFocus
              className="bg-white/10 border border-white/30 rounded px-2 py-0.5 text-white text-center font-bold"
            />
          ) : (
            <span onClick={() => setEditingAttendant(true)} className="cursor-pointer hover:underline">
              Atendente: {attendant || "Semec TI 2"}
            </span>
          )}
        </div>
        <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mt-1">
          <MapPin className="w-3.5 h-3.5 text-rose-400" />
          <span>{department}</span>
        </div>
      </div>

      {/* 4. Tab Switcher Pill */}
      <div className="bg-[#0b2866] border border-blue-900/60 p-1.5 rounded-full flex max-w-md w-full mb-6">
        <button
          onClick={() => setActiveTab("totem")}
          className={`flex-1 py-2.5 rounded-full font-bold text-xs md:text-sm transition-all cursor-pointer ${
            activeTab === "totem"
              ? "bg-[#104bbf] text-white shadow-md"
              : "text-slate-300 hover:text-white"
          }`}
        >
          Fila do Totem ({queue.length})
        </button>

        <button
          onClick={() => setActiveTab("manual")}
          className={`flex-1 py-2.5 rounded-full font-bold text-xs md:text-sm transition-all cursor-pointer ${
            activeTab === "manual"
              ? "bg-[#104bbf] text-white shadow-md"
              : "text-slate-300 hover:text-white"
          }`}
        >
          Senha Direta / Manual
        </button>
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* CARTÃO 1: CONTROLE PRINCIPAL DE SENHAS */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="bg-white text-slate-900 rounded-3xl p-6 shadow-2xl space-y-5">
          {activeTab === "totem" ? (
            <>
              <div className="text-center">
                <h2 className="text-blue-600 font-bold text-base tracking-wide uppercase">
                  FILA DE ESPERA DE SENHAS
                </h2>
                <p className="text-slate-500 text-xs mt-0.5">
                  Chamada automática de senhas do totem móvel
                </p>
              </div>

              {/* Duas caixas de contadores */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#eaf2ff] border border-blue-200 rounded-2xl p-4 text-center">
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-widest block mb-1">
                    AGUARDANDO
                  </span>
                  <span className="text-4xl font-black text-blue-600">{totalAguardando}</span>
                </div>

                <div className="bg-[#e6f9f0] border border-emerald-200 rounded-2xl p-4 text-center">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest block mb-1">
                    PREFERENCIAIS
                  </span>
                  <span className="text-4xl font-black text-emerald-600">{totalPreferenciais}</span>
                </div>
              </div>

              {/* Stack de Botões de Chamada */}
              <div className="space-y-3 pt-1">
                <button
                  disabled={loading}
                  onClick={callNextAny}
                  className="w-full py-4 bg-[#00a859] hover:bg-[#00944e] text-white font-black rounded-full transition-all shadow-md flex items-center justify-center gap-2 text-sm uppercase tracking-wide cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>CHAMAR PRÓXIMA DA FILA</span>
                </button>

                <button
                  disabled={loading}
                  onClick={callNextNormal}
                  className="w-full py-3.5 bg-[#1d64ff] hover:bg-[#1253e6] text-white font-black rounded-full transition-all shadow-md flex items-center justify-center gap-2 text-sm uppercase tracking-wide cursor-pointer"
                >
                  <span>CHAMAR PRÓXIMA NORMAL</span>
                </button>

                <button
                  disabled={loading}
                  onClick={() => callTicket(lastCode)}
                  className="w-full py-3.5 bg-[#133878] hover:bg-[#0e2d63] text-white font-bold rounded-full transition-all shadow-md flex items-center justify-center gap-2 text-xs md:text-sm tracking-wide cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>REPETIR SENHA ATUAL ({lastCode})</span>
                </button>
              </div>

              {/* Input de Senha Manual na parte inferior */}
              <div className="pt-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Chamar senha manual... Ex: 80"
                    value={manual}
                    onChange={(e) => setManual(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && callManual()}
                    className="flex-1 px-4 py-2.5 rounded-full border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-blue-600 bg-slate-50"
                  />
                  <button
                    onClick={callManual}
                    disabled={loading || !manual.trim()}
                    className="px-5 py-2.5 bg-[#5b7a9e] hover:bg-[#4a6789] text-white font-bold rounded-full text-xs uppercase tracking-wider cursor-pointer"
                  >
                    OK
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4 text-slate-900">
              <div className="text-center mb-2">
                <h2 className="text-blue-600 font-bold text-base tracking-wide uppercase">
                  CHAMADA DIRETA E MANUAL
                </h2>
                <p className="text-slate-500 text-xs">Configure a próxima sequência de senhas</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                  Próxima Senha Numérica (Sequência):
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={nextSeq}
                    onChange={(e) => setNextSeq(Number(e.target.value))}
                    className="w-24 px-3 py-2 border rounded-xl font-mono text-center font-bold text-base"
                  />
                  <button
                    onClick={() => callTicket(String(nextSeq))}
                    className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider"
                  >
                    Chamar ({nextSeq})
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* CARTÃO 2: FILA DA TV & CONTROLE DE VOLUMES */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="bg-white text-slate-900 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="text-center">
            <h2 className="text-[#071d49] font-black text-lg tracking-wide uppercase flex items-center justify-center gap-2">
              <Tv className="w-5 h-5 text-blue-600" />
              FILA DA TV
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              YouTube ou URL .mp4 · toca em ordem e reinicia ao terminar
            </p>
          </div>

          {/* Sliders de Volume */}
          <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            {/* Slider Volume do Vídeo */}
            <div className="flex items-center gap-3 text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1 min-w-[130px] uppercase tracking-wider">
                <Volume2 className="w-4 h-4 text-slate-400" /> VOLUME DO VÍDEO:
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={videoVolume}
                onChange={(e) => setVideoVolume(Number(e.target.value))}
                className="flex-1 h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-[#0b2866]"
              />
              <span className="min-w-[36px] text-right font-black">{videoVolume}%</span>
            </div>

            {/* Slider Volume da Voz */}
            <div className="flex items-center gap-3 text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1 min-w-[130px] uppercase tracking-wider">
                <Volume2 className="w-4 h-4 text-purple-600" /> VOLUME DA VOZ:
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={voiceVolume}
                onChange={(e) => setVoiceVolume(Number(e.target.value))}
                className="flex-1 h-2.5 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-[#0b2866]"
              />
              <span className="min-w-[36px] text-right font-black">{voiceVolume}%</span>
            </div>
          </div>

          {/* Lista Scrollável de Vídeos da Playlist */}
          <div className="border border-slate-200 rounded-2xl p-2 max-h-52 overflow-y-auto space-y-1.5 bg-slate-50/50">
            {playlist.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs italic">
                Nenhum vídeo adicionado à fila da TV.
              </div>
            ) : (
              playlist.map((item, index) => {
                const isYoutube = item.media_type === "youtube";
                const urlParts = item.media_url.split("/");
                const idDisplay = isYoutube ? `[youtube] ${urlParts[urlParts.length - 1] || item.media_url}` : item.media_url;

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs"
                  >
                    <div className="flex items-center gap-2 font-semibold text-slate-700 truncate">
                      <span className="w-4 text-slate-400 font-bold">{index + 1}</span>
                      {item.played_at ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                      )}
                      <span className="truncate">{idDisplay}</span>
                    </div>

                    <div className="flex items-center gap-2 ml-2">
                      <button
                        onClick={() => repeatMedia(item.id)}
                        className="p-1 text-slate-500 hover:text-blue-600 rounded transition-colors"
                        title="Repetir este vídeo"
                      >
                        <Repeat className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeMedia(item.id)}
                        className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                        title="Remover vídeo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input de Adicionar Link de Mídia */}
          <div>
            <input
              type="text"
              placeholder="https://youtu.be/... ou https://.../video.mp4"
              value={mediaInput}
              onChange={(e) => setMediaInput(e.target.value)}
              className="w-full px-4 py-2.5 rounded-full border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 bg-slate-50 mb-3"
            />

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={addMedia}
                disabled={savingMedia || !mediaInput.trim()}
                className="py-3 bg-[#788fa6] hover:bg-[#657d94] text-white font-black rounded-full transition-all text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer"
              >
                ADICIONAR
              </button>

              <button
                onClick={resetMedia}
                className="py-3 bg-[#e8f1fd] hover:bg-[#d6e5fb] text-[#071d49] font-bold rounded-full transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer border border-blue-200"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                <span>Reiniciar</span>
              </button>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* CARTÃO 3: ÚLTIMAS SENHAS CHAMADAS */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="bg-white text-slate-900 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="text-center">
            <h2 className="text-[#071d49] font-black text-base tracking-wide uppercase flex items-center justify-center gap-2">
              <History className="w-5 h-5 text-slate-600" />
              ÚLTIMAS SENHAS CHAMADAS
            </h2>
          </div>

          <div className="divide-y divide-slate-100 text-sm">
            {tickets.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs italic">
                Nenhuma senha chamada recentemente.
              </div>
            ) : (
              tickets.slice(0, 10).map((t) => (
                <div key={t.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-black text-base text-[#071d49] block">
                      {t.ticket_code}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Guichê {t.counter_number} · {t.attendant_name || attendant}
                    </span>
                  </div>

                  <span className="text-xs text-slate-400 font-semibold">
                    {formatShortDate(t.called_at)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
