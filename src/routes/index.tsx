import { createFileRoute, Link } from "@tanstack/react-router";
import { Monitor, Tv, Ticket, Star, ShieldCheck, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sistema de Gerenciamento de Atendimento" },
      { name: "description", content: "Sistema de gerenciamento e emissão de senhas em tempo real." },
    ],
  }),
  component: Index,
});

export function Index() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="text-center max-w-2xl mx-auto mb-12 z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/80 border border-blue-800/50 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          Sistema de Atendimento Multitela
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-4">
          Gerenciamento de Senhas
        </h1>
        <p className="text-slate-400 text-base md:text-lg">
          Selecione abaixo o painel ou módulo que deseja acessar:
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl z-10">
        {/* Painel do Atendente */}
        <Link
          to="/atendente"
          className="group bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 rounded-3xl p-6 shadow-xl hover:scale-[1.02] transition-all duration-200 flex flex-col justify-between"
        >
          <div>
            <div className="p-3.5 bg-blue-600/20 border border-blue-500/30 rounded-2xl text-blue-400 w-fit mb-5 group-hover:scale-110 transition-transform">
              <Monitor className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
              Painel do Atendente
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Interface de controle para chamar senhas, escolher guichê e gerenciar a playlist da TV.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs text-blue-400 font-semibold flex items-center justify-between">
            <span>Acessar Operação</span>
            <span>→</span>
          </div>
        </Link>

        {/* Painel do Solicitante (TV) */}
        <Link
          to="/solicitante"
          className="group bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 rounded-3xl p-6 shadow-xl hover:scale-[1.02] transition-all duration-200 flex flex-col justify-between"
        >
          <div>
            <div className="p-3.5 bg-emerald-600/20 border border-emerald-500/30 rounded-2xl text-emerald-400 w-fit mb-5 group-hover:scale-110 transition-transform">
              <Tv className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
              Painel do Solicitante (TV)
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Tela para exibição em TVs com senhas chamadas em destaque, alertas sonoros e mídia em loop.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs text-emerald-400 font-semibold flex items-center justify-between">
            <span>Exibir em TV</span>
            <span>→</span>
          </div>
        </Link>

        {/* Emissão de Senhas (Totem) */}
        <Link
          to="/emissao"
          className="group bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 rounded-3xl p-6 shadow-xl hover:scale-[1.02] transition-all duration-200 flex flex-col justify-between"
        >
          <div>
            <div className="p-3.5 bg-purple-600/20 border border-purple-500/30 rounded-2xl text-purple-400 w-fit mb-5 group-hover:scale-110 transition-transform">
              <Ticket className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
              Emissão de Senhas (Totem)
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Totem de autoatendimento para o cliente selecionar a categoria (Normal, Prioridade, Exames) e retirar a senha.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs text-purple-400 font-semibold flex items-center justify-between">
            <span>Abrir Totem</span>
            <span>→</span>
          </div>
        </Link>

        {/* Avaliação de Atendimento */}
        <Link
          to="/avaliacao"
          className="group bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-3xl p-6 shadow-xl hover:scale-[1.02] transition-all duration-200 flex flex-col justify-between"
        >
          <div>
            <div className="p-3.5 bg-amber-600/20 border border-amber-500/30 rounded-2xl text-amber-400 w-fit mb-5 group-hover:scale-110 transition-transform">
              <Star className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">
              Avaliação de Atendimento
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Pesquisa de satisfação para coleta de feedback dos clientes pós-atendimento (escala de 1 a 4).
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs text-amber-400 font-semibold flex items-center justify-between">
            <span>Avaliar Serviço</span>
            <span>→</span>
          </div>
        </Link>

        {/* Painel Administrativo */}
        <Link
          to="/admin"
          className="group bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 rounded-3xl p-6 shadow-xl hover:scale-[1.02] transition-all duration-200 flex flex-col justify-between md:col-span-2 lg:col-span-1"
        >
          <div>
            <div className="p-3.5 bg-cyan-600/20 border border-cyan-500/30 rounded-2xl text-cyan-400 w-fit mb-5 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
              Painel Administrativo
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Dashboard de métricas, relatórios de atendentes, estatísticas de satisfação e histórico completo.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs text-cyan-400 font-semibold flex items-center justify-between">
            <span>Ver Relatórios</span>
            <span>→</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
