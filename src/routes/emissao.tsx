import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Ticket as TicketIcon, Sparkles, UserCheck, HeartHandshake, FileText, Info, Printer, CheckCircle, ArrowLeft } from "lucide-react";
import { insertTicket } from "@/lib/tickets";
import { toast } from "sonner";

export const Route = createFileRoute("/emissao")({
  ssr: false,
  head: () => ({ meta: [{ title: "Emissão de Senhas — Totem" }] }),
  component: EmissaoPage,
});

interface Category {
  id: string;
  prefix: string;
  title: string;
  description: string;
  icon: any;
  colorClass: string;
  badge: string;
}

const CATEGORIES: Category[] = [
  {
    id: "normal",
    prefix: "N",
    title: "Atendimento Normal",
    description: "Fila convencional para atendimento geral e solicitações de serviços.",
    icon: UserCheck,
    colorClass: "from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white shadow-blue-900/30",
    badge: "Geral",
  },
  {
    id: "prioritario",
    prefix: "P",
    title: "Atendimento Preferencial",
    description: "Idosos (60+), gestantes, lactantes, pessoas com deficiência e autismo (Lei 10.048/00).",
    icon: HeartHandshake,
    colorClass: "from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white shadow-emerald-900/30",
    badge: "Prioridade Legal",
  },
  {
    id: "exames",
    prefix: "E",
    title: "Exames & Resultados",
    description: "Retirada de laudos, agendamento de exames e entregas rápidas de documentos.",
    icon: FileText,
    colorClass: "from-purple-600 to-pink-700 hover:from-purple-500 hover:to-pink-600 text-white shadow-purple-900/30",
    badge: "Rápido",
  },
  {
    id: "informacoes",
    prefix: "I",
    title: "Informações & Orientação",
    description: "Tire dúvidas, obtenha guias e receba auxílio inicial sobre o seu atendimento.",
    icon: Info,
    colorClass: "from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 text-white shadow-amber-900/30",
    badge: "Suporte",
  },
];

function EmissaoPage() {
  const [issuedTicket, setIssuedTicket] = useState<{
    code: string;
    category: Category;
    timestamp: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const issueTicket = async (category: Category) => {
    setLoading(true);
    try {
      const storageKey = `seq_${category.prefix}`;
      const currentSeq = Number(localStorage.getItem(storageKey)) || 101;
      const ticketCode = `${category.prefix}-${currentSeq}`;

      // Salva no banco de tickets
      await insertTicket(ticketCode, 1, "Totem Autoatendimento");

      // Incrementar sequência local
      localStorage.setItem(storageKey, String(currentSeq + 1));

      const now = new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      setIssuedTicket({
        code: ticketCode,
        category,
        timestamp: now,
      });

      // Efeito sonoro de emissão
      if (typeof window !== "undefined" && "AudioContext" in window) {
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.25);
        } catch {}
      }

      toast.success(`Senha ${ticketCode} emitida com sucesso!`);
    } catch (e: any) {
      toast.error(e.message || "Erro ao emitir senha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-4 md:p-8 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="flex items-center justify-between max-w-6xl mx-auto w-full mb-8 z-10">
        <Link
          to="/"
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Menu</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/20 border border-blue-500/30 rounded-2xl text-blue-400">
            <TicketIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Totem de Autoatendimento</h1>
            <p className="text-xs text-slate-400">Retire sua senha abaixo</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full flex flex-col justify-center z-10 mb-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/60 border border-blue-800/40 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Selecione o tipo de atendimento
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            Toque na tela para emitir sua senha
          </h2>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto w-full">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                disabled={loading}
                onClick={() => issueTicket(cat)}
                className={`group relative flex flex-col justify-between p-8 rounded-3xl bg-gradient-to-br ${cat.colorClass} shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 border border-white/10 text-left cursor-pointer`}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                    <Icon className="w-10 h-10" />
                  </div>
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider">
                    {cat.badge}
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl md:text-3xl font-extrabold mb-2">{cat.title}</h3>
                  <p className="text-white/80 text-sm md:text-base leading-relaxed">{cat.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </main>

      {/* Modal Ticket Gerado */}
      {issuedTicket && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-8 shadow-2xl text-center relative overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-400">
              <CheckCircle className="w-10 h-10" />
            </div>

            <h3 className="text-xl font-bold text-slate-200 mb-1">Sua senha foi emitida!</h3>
            <p className="text-xs text-slate-400 mb-6">{issuedTicket.category.title}</p>

            {/* Simulação do Ticket Impresso */}
            <div className="bg-white text-slate-900 rounded-2xl p-6 shadow-inner border border-slate-200 mb-6 font-mono text-center relative">
              <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">
                SISTEMA DE ATENDIMENTO
              </div>
              <div className="text-5xl font-black text-slate-950 my-3 tracking-wider">
                {issuedTicket.code}
              </div>
              <div className="text-xs text-slate-600 border-t border-dashed border-slate-300 pt-3 flex justify-between">
                <span>Horário: {issuedTicket.timestamp}</span>
                <span>Fila: {issuedTicket.category.badge}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-slate-400 text-sm mb-6">
              <Printer className="w-4 h-4 animate-pulse" />
              <span>Aguarde a chamada no painel principal</span>
            </div>

            <button
              onClick={() => setIssuedTicket(null)}
              className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-colors text-base shadow-lg shadow-blue-600/30"
            >
              Emitir Nova Senha
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
