import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Star, MessageSquare, CheckCircle2, ArrowLeft, Send, Sparkles, User, Monitor } from "lucide-react";
import { submitEvaluation } from "@/lib/evaluations";
import { toast } from "sonner";

export const Route = createFileRoute("/avaliacao")({
  ssr: false,
  head: () => ({ meta: [{ title: "Avaliação do Atendimento" }] }),
  component: AvaliacaoPage,
});

const RATINGS = [
  { value: 1, label: "Ruim", emoji: "😞", color: "hover:bg-red-500/20 hover:border-red-500/50 text-red-400" },
  { value: 2, label: "Regular", emoji: "😐", color: "hover:bg-amber-500/20 hover:border-amber-500/50 text-amber-400" },
  { value: 3, label: "Bom", emoji: "🙂", color: "hover:bg-blue-500/20 hover:border-blue-500/50 text-blue-400" },
  { value: 4, label: "Excelente", emoji: "😃", color: "hover:bg-emerald-500/20 hover:border-emerald-500/50 text-emerald-400" },
];

function AvaliacaoPage() {
  const [ticketCode, setTicketCode] = useState("");
  const [counterNumber, setCounterNumber] = useState<number | "">(1);
  const [attendantName, setAttendantName] = useState("");
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRating) {
      toast.error("Por favor, selecione uma nota de 1 a 4!");
      return;
    }

    setLoading(true);
    try {
      const ratingObj = RATINGS.find((r) => r.value === selectedRating);
      await submitEvaluation({
        ticket_code: ticketCode.trim() || undefined,
        counter_number: counterNumber !== "" ? Number(counterNumber) : undefined,
        attendant_name: attendantName.trim() || undefined,
        rating: selectedRating,
        rating_label: ratingObj ? ratingObj.label : `${selectedRating} estrelas`,
        comment: comment.trim() || undefined,
      });

      setSubmitted(true);
      toast.success("Obrigado pelo seu feedback!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao registrar avaliação");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedRating(null);
    setComment("");
    setTicketCode("");
    setSubmitted(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-4 md:p-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="flex items-center justify-between max-w-4xl mx-auto w-full mb-8 z-10">
        <Link
          to="/"
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Menu</span>
        </Link>
        <div className="text-right">
          <h1 className="text-lg font-bold text-white">Pesquisa de Satisfação</h1>
          <p className="text-xs text-slate-400">Avalie seu atendimento</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full flex flex-col justify-center z-10 mb-8">
        {submitted ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12 text-center shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/30 rounded-3xl flex items-center justify-center mx-auto mb-6 text-emerald-400">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-black text-white mb-2">Muito Obrigado!</h2>
            <p className="text-slate-400 text-base mb-8 max-w-md mx-auto">
              Sua avaliação foi registrada com sucesso e nos ajuda a melhorar constantemente a qualidade do nosso atendimento.
            </p>
            <button
              onClick={handleReset}
              className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-colors text-base shadow-lg shadow-blue-600/30"
            >
              Nova Avaliação
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-800/40 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                Opinião do Cliente
              </div>
              <h2 className="text-2xl md:text-4xl font-extrabold text-white">Como foi seu atendimento?</h2>
              <p className="text-slate-400 text-sm mt-1">Selecione uma nota de 1 a 4 abaixo</p>
            </div>

            {/* Identificação Opcional do Atendimento */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-400" /> Senha (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: N-101"
                  value={ticketCode}
                  onChange={(e) => setTicketCode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-blue-400" /> Guichê
                </label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={counterNumber}
                  onChange={(e) => setCounterNumber(e.target.value ? Number(e.target.value) : "")}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-400" /> Atendente
                </label>
                <input
                  type="text"
                  placeholder="Nome (opcional)"
                  value={attendantName}
                  onChange={(e) => setAttendantName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Escala de Avaliação (1 a 4) */}
            <div className="mb-8">
              <label className="block text-center text-sm font-bold text-slate-300 mb-4">
                Sua Nota (1 = Ruim, 4 = Excelente):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {RATINGS.map((r) => {
                  const isSelected = selectedRating === r.value;
                  return (
                    <button
                      type="button"
                      key={r.value}
                      onClick={() => setSelectedRating(r.value)}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/40 scale-105"
                          : `bg-slate-950/60 border-slate-800 text-slate-300 ${r.color}`
                      }`}
                    >
                      <span className="text-3xl mb-1">{r.emoji}</span>
                      <span className="font-extrabold text-sm">{r.value} — {r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comentários / Sugestões */}
            <div className="mb-8">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-400" />
                Comentários ou Sugestões (Opcional)
              </label>
              <textarea
                rows={3}
                placeholder="Escreva aqui detalhes sobre sua experiência..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-purple-900/30 flex items-center justify-center gap-2 text-base"
            >
              <Send className="w-5 h-5" />
              <span>Enviar Avaliação</span>
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
