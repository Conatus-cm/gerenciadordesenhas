import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { fetchTickets, subscribeTickets, type Ticket } from "@/lib/tickets";
import {
  fetchPlaylist,
  subscribePlaylist,
  markPlayed,
  resetPlaylistPlayed,
  fetchRepeatSignal,
  subscribeRepeatSignal,
  type PlaylistItem,
} from "@/lib/display";

export const Route = createFileRoute("/solicitante")({
  ssr: false,
  head: () => ({ meta: [{ title: "Painel do Solicitante" }] }),
  component: SolicitantePage,
});

function playBeep() {
  try {
    const AC = (window.AudioContext || (window as any).webkitAudioContext);
    if (!AC) return;
    const ctx = new AC();
    const now = ctx.currentTime;
    [0, 0.25].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now + offset);
      gain.gain.setValueAtTime(0, now + offset);
      gain.gain.linearRampToValueAtTime(0.4, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.22);
    });
    setTimeout(() => ctx.close(), 1500);
  } catch {}
}

// Carrega a YouTube IFrame API (singleton)
let ytApiPromise: Promise<any> | null = null;
function loadYouTubeApi(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject();
  if ((window as any).YT?.Player) return Promise.resolve((window as any).YT);
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
    (window as any).onYouTubeIframeAPIReady = () => resolve((window as any).YT);
  });
  return ytApiPromise;
}

function SolicitantePage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [flash, setFlash] = useState(false);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [overrideItem, setOverrideItem] = useState<PlaylistItem | null>(null);
  const lastRepeatRef = useRef<string | null>(null);
  const lastIdRef = useRef<string | null>(null);
  const initializedRef = useRef(false);

  const current = tickets[0] ?? null;
  const history = tickets.slice(1, 5);

  // Item exibido: override (repetição) > primeiro não tocado
  const queueCurrent = playlist.find((p) => !p.played_at) ?? null;
  const currentMedia = overrideItem ?? queueCurrent;

  const reload = () =>
    fetchTickets(10)
      .then((t) => {
        setTickets(t);
        const newest = t[0]?.id ?? null;
        if (initializedRef.current && newest && newest !== lastIdRef.current) {
          setFlash(true);
          playBeep();
          setTimeout(() => setFlash(false), 3500);
        }
        lastIdRef.current = newest;
        initializedRef.current = true;
      })
      .catch(() => {});

  const reloadMedia = () => fetchPlaylist().then(setPlaylist).catch(() => {});

  const reloadRepeat = async () => {
    try {
      const sig = await fetchRepeatSignal();
      if (!sig?.repeat_requested_at || !sig.repeat_item_id) return;
      // Apenas inicializa o ref na 1ª carga — não dispara repetição em refresh
      if (lastRepeatRef.current === null) {
        lastRepeatRef.current = sig.repeat_requested_at;
        return;
      }
      if (sig.repeat_requested_at !== lastRepeatRef.current) {
        lastRepeatRef.current = sig.repeat_requested_at;
        const items = await fetchPlaylist();
        setPlaylist(items);
        const item = items.find((p) => p.id === sig.repeat_item_id) ?? null;
        if (item) setOverrideItem({ ...item, id: `${item.id}__r__${sig.repeat_requested_at}` } as any);
      }
    } catch {}
  };

  useEffect(() => {
    reload();
    reloadMedia();
    reloadRepeat();
    const unsubT = subscribeTickets(reload);
    const unsubM = subscribePlaylist(reloadMedia);
    const unsubR = subscribeRepeatSignal(reloadRepeat);
    return () => { unsubT(); unsubM(); unsubR(); };
  }, []);

  // Avança a fila quando termina (ou apenas limpa override em caso de repetição)
  const onEnded = async () => {
    if (overrideItem) {
      setOverrideItem(null);
      return;
    }
    if (!queueCurrent) return;
    try {
      await markPlayed(queueCurrent.id);
      const remaining = playlist.filter((p) => !p.played_at && p.id !== queueCurrent.id);
      if (remaining.length === 0 && playlist.length > 0) {
        await resetPlaylistPlayed();
      }
    } catch {}
  };


  // YouTube player com detecção de fim
  const ytContainerRef = useRef<HTMLDivElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  useEffect(() => {
    if (!currentMedia || currentMedia.media_type !== "youtube") {
      if (ytPlayerRef.current) {
        try { ytPlayerRef.current.destroy(); } catch {}
        ytPlayerRef.current = null;
      }
      return;
    }
    let cancelled = false;
    loadYouTubeApi().then((YT) => {
      if (cancelled || !ytContainerRef.current) return;
      // Reseta container
      ytContainerRef.current.innerHTML = '<div id="yt-player-target"></div>';
      ytPlayerRef.current = new YT.Player("yt-player-target", {
        videoId: currentMedia.media_url,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
        },
        events: {
          onReady: (e: any) => { try { e.target.playVideo(); } catch {} },
          onStateChange: (e: any) => {
            // 0 = ended
            if (e.data === 0) onEnded();
          },
        },
      });
    });
    return () => {
      cancelled = true;
      if (ytPlayerRef.current) {
        try { ytPlayerRef.current.destroy(); } catch {}
        ytPlayerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMedia?.id]);

  return (
    <div className="h-screen w-screen overflow-hidden flex p-4 gap-4">
      {/* Media */}
      <div className="basis-[55%] rounded-2xl overflow-hidden shadow-2xl bg-black relative">
        {currentMedia?.media_type === "mp4" ? (
          <video
            key={currentMedia.id}
            className="w-full h-full object-cover"
            src={currentMedia.media_url}
            autoPlay
            muted
            playsInline
            onEnded={onEnded}
          />
        ) : currentMedia?.media_type === "youtube" ? (
          <div ref={ytContainerRef} className="w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/60 text-center px-6">
            Nenhum vídeo na fila.<br />Adicione no painel do atendente.
          </div>
        )}
      </div>

      {/* Tickets */}
      <div className="flex-1 flex flex-col gap-4">
        <div
          className={`bg-card text-card-foreground rounded-2xl p-6 shadow-2xl flex-1 flex flex-col items-center justify-center text-center ${
            flash ? "flash-glow" : ""
          }`}
        >
          <p className="text-xl md:text-2xl font-bold tracking-widest text-card-foreground/80">SENHA ATUAL</p>
          <p className="text-7xl md:text-[8rem] font-black text-primary leading-none my-4 tracking-tight">
            {current?.ticket_code ?? "—"}
          </p>
          <div className="flex items-center gap-3">
            <p className="text-2xl md:text-3xl font-bold tracking-wide">
              GUICHÊ {current?.counter_number ?? "—"}
              {current?.attendant_name && (
                <span className="block text-lg md:text-xl font-semibold text-muted-foreground mt-1">
                  Atendente: {current.attendant_name}
                </span>
              )}
            </p>
            <Bell className={`w-7 h-7 text-primary ${flash ? "animate-pulse" : ""}`} />
          </div>
        </div>

        <div className="bg-card text-card-foreground rounded-2xl p-5 shadow-2xl">
          <p className="text-center font-bold tracking-widest mb-3">HISTÓRICO</p>
          <ol className="space-y-1.5 text-lg">
            {history.length === 0 && (
              <li className="text-center text-muted-foreground">Sem histórico</li>
            )}
            {history.map((t, i) => (
              <li key={t.id} className="flex justify-center gap-2">
                <span className="text-muted-foreground">{i + 1}.</span>
                <span className="font-semibold">{t.ticket_code}</span>
                <span className="text-muted-foreground">(Guichê {t.counter_number})</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
