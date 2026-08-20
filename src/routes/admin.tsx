import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Users,
  Star,
  Clock,
  ArrowLeft,
  RefreshCcw,
  TrendingUp,
  ShieldCheck,
  Award,
  FileSpreadsheet,
  Lock,
  LogOut,
  KeyRound,
  Mail,
} from "lucide-react";
import { fetchTickets, type Ticket } from "@/lib/tickets";
import { fetchEvaluations, type Evaluation } from "@/lib/evaluations";
import { verifyAdminLogin } from "@/lib/api/admin-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({ meta: [{ title: "Painel Administrativo — Autenticação" }] }),
  component: AdminPage,
});

function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("admin_authenticated") === "true";
  });

  // Login Form States
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Dashboard Data States
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Verificar se há sessão ativa no Supabase no carregamento inicial
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) {
        setIsAuthenticated(true);
        sessionStorage.setItem("admin_authenticated", "true");
      }
    });
  }, []);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const [tData, eData] = await Promise.all([fetchTickets(100), fetchEvaluations()]);
      setTickets(tData);
      setEvaluations(eData);
    } catch (err: any) {
      toast.error(err.message || "Erro ao carregar dados do painel");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !passwordInput) {
      toast.error("Por favor, preencha o e-mail e a senha.");
      return;
    }

    setAuthLoading(true);
    try {
      // 1. Validação Segura no Servidor (sem expor credenciais no cliente)
      const res = await verifyAdminLogin({
        data: { email: emailInput.trim(), password: passwordInput },
      });

      if (res.success) {
        // Tentar autenticar também no Supabase Auth se o projeto estiver configurado
        try {
          await supabase.auth.signInWithPassword({
            email: emailInput.trim(),
            password: passwordInput,
          });
        } catch {}

        sessionStorage.setItem("admin_authenticated", "true");
        setIsAuthenticated(true);
        toast.success("Acesso administrativo liberado com sucesso!");
        return;
      }

      toast.error(res.message || "Acesso negado. Credenciais inválidas.");
    } catch (err: any) {
      toast.error("Erro na autenticação de administrador.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    sessionStorage.removeItem("admin_authenticated");
    try {
      await supabase.auth.signOut();
    } catch {}
    setIsAuthenticated(false);
    setEmailInput("");
    setPasswordInput("");
    toast.info("Sessão encerrada.");
  };

  // ═══════════════════════════════════════════════════════════════════
  // TELAS DE LOGIN SEGURO (SE NÃO AUTENTICADO)
  // ═══════════════════════════════════════════════════════════════════
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-md w-full z-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800 text-sm mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Menu</span>
          </Link>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 bg-blue-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-400">
              <Lock className="w-8 h-8" />
            </div>

            <div className="text-center mb-8">
              <h1 className="text-2xl font-black text-white tracking-tight">Área Administrativa</h1>
              <p className="text-slate-400 text-xs mt-1">Informe seu e-mail e senha de acesso</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  E-mail de Administrador
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@empresa.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                  Senha de Acesso
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 text-base mt-2"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>{authLoading ? "Autenticando..." : "Entrar no Painel ADM"}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // PAINEL ADM AUTENTICADO
  // ═══════════════════════════════════════════════════════════════════
  const totalTickets = tickets.length;
  const totalEvals = evaluations.length;

  const averageRating =
    totalEvals > 0
      ? (evaluations.reduce((acc, curr) => acc + curr.rating, 0) / totalEvals).toFixed(1)
      : "0.0";

  const positiveEvals = evaluations.filter((e) => e.rating >= 3).length;
  const approvalRate = totalEvals > 0 ? Math.round((positiveEvals / totalEvals) * 100) : 0;

  const ratingCounts = {
    4: evaluations.filter((e) => e.rating === 4).length,
    3: evaluations.filter((e) => e.rating === 3).length,
    2: evaluations.filter((e) => e.rating === 2).length,
    1: evaluations.filter((e) => e.rating === 1).length,
  };

  const attendantStats: Record<string, { totalTickets: number; totalRating: number; evalCount: number }> = {};

  tickets.forEach((t) => {
    const name = t.attendant_name || "Não informado";
    if (!attendantStats[name]) {
      attendantStats[name] = { totalTickets: 0, totalRating: 0, evalCount: 0 };
    }
    attendantStats[name].totalTickets += 1;
  });

  evaluations.forEach((e) => {
    const name = e.attendant_name || "Não informado";
    if (!attendantStats[name]) {
      attendantStats[name] = { totalTickets: 0, totalRating: 0, evalCount: 0 };
    }
    attendantStats[name].totalRating += e.rating;
    attendantStats[name].evalCount += 1;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-4 md:p-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-7xl mx-auto w-full mb-8">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </Link>
          <div>
            <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              Gestão & Controle
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">Painel Administrativo</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loadingData}
            className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold px-4 py-2.5 rounded-xl transition-colors text-sm"
          >
            <RefreshCcw className={`w-4 h-4 ${loadingData ? "animate-spin" : ""}`} />
            <span>Atualizar</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 font-bold px-4 py-2.5 rounded-xl transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full space-y-8">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Chamadas Hoje</span>
              <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-2xl text-blue-400">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="text-4xl font-black text-white">{totalTickets}</div>
            <p className="text-xs text-slate-400 mt-2">Senhas chamadas registradas</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Média de Satisfação</span>
              <div className="p-3 bg-amber-600/20 border border-amber-500/30 rounded-2xl text-amber-400">
                <Star className="w-5 h-5 fill-amber-400/20" />
              </div>
            </div>
            <div className="text-4xl font-black text-white">{averageRating} <span className="text-lg font-normal text-slate-400">/ 4.0</span></div>
            <p className="text-xs text-slate-400 mt-2">Baseado em {totalEvals} avaliações</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Taxa de Aprovação</span>
              <div className="p-3 bg-emerald-600/20 border border-emerald-500/30 rounded-2xl text-emerald-400">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="text-4xl font-black text-emerald-400">{approvalRate}%</div>
            <p className="text-xs text-slate-400 mt-2">Notas 3 (Bom) e 4 (Excelente)</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total de Feedbacks</span>
              <div className="p-3 bg-purple-600/20 border border-purple-500/30 rounded-2xl text-purple-400">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-4xl font-black text-white">{totalEvals}</div>
            <p className="text-xs text-slate-400 mt-2">Pesquisas de satisfação recebidas</p>
          </div>
        </div>

        {/* Section: Distribuição de Avaliações + Resumo de Atendentes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Distribuição de Notas (1 a 4) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Distribuição da Satisfação dos Clientes (1 a 4)
            </h2>

            <div className="space-y-4">
              {[
                { value: 4, label: "4 — Excelente (😃)", count: ratingCounts[4], color: "bg-emerald-500" },
                { value: 3, label: "3 — Bom (🙂)", count: ratingCounts[3], color: "bg-blue-500" },
                { value: 2, label: "2 — Regular (😐)", count: ratingCounts[2], color: "bg-amber-500" },
                { value: 1, label: "1 — Ruim (😞)", count: ratingCounts[1], color: "bg-red-500" },
              ].map((item) => {
                const pct = totalEvals > 0 ? Math.round((item.count / totalEvals) * 100) : 0;
                return (
                  <div key={item.value}>
                    <div className="flex justify-between text-sm mb-1.5 font-medium">
                      <span className="text-slate-300">{item.label}</span>
                      <span className="text-slate-400">{item.count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full ${item.color} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Performance por Atendente */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Desempenho por Atendente
            </h2>

            {Object.keys(attendantStats).length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                Nenhum atendimento registrado ainda.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Atendente</th>
                      <th className="pb-3 font-semibold text-center">Senhas</th>
                      <th className="pb-3 font-semibold text-right">Média Avaliação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {Object.entries(attendantStats).map(([name, stat]) => {
                      const avg =
                        stat.evalCount > 0 ? (stat.totalRating / stat.evalCount).toFixed(1) : "N/A";
                      return (
                        <tr key={name} className="hover:bg-slate-800/30">
                          <td className="py-3 font-bold text-white">{name}</td>
                          <td className="py-3 text-center text-slate-300">{stat.totalTickets}</td>
                          <td className="py-3 text-right">
                            <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold rounded-lg text-xs">
                              {avg} ⭐
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Tabela de Avaliações Recentes */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-purple-400" />
            Últimas Avaliações Registradas
          </h2>

          {evaluations.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              Nenhuma avaliação cadastrada até o momento.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Data / Hora</th>
                    <th className="pb-3 font-semibold">Senha</th>
                    <th className="pb-3 font-semibold">Guichê</th>
                    <th className="pb-3 font-semibold">Nota</th>
                    <th className="pb-3 font-semibold">Comentário</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {evaluations.slice(0, 15).map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-800/30">
                      <td className="py-3 text-slate-400 text-xs">
                        {new Date(ev.created_at).toLocaleString("pt-BR")}
                      </td>
                      <td className="py-3 font-mono font-bold text-blue-400">{ev.ticket_code || "—"}</td>
                      <td className="py-3 text-slate-300">{ev.counter_number ? `Guichê ${ev.counter_number}` : "—"}</td>
                      <td className="py-3">
                        <span className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-amber-400">
                          {ev.rating} / 4 ({ev.rating_label})
                        </span>
                      </td>
                      <td className="py-3 text-slate-300 text-xs italic">
                        {ev.comment ? `"${ev.comment}"` : "Sem comentário"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
