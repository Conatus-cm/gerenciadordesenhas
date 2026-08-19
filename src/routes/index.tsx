import { createFileRoute, Link } from "@tanstack/react-router";
import { Monitor, Tv } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sistema de Senhas" },
      { name: "description", content: "Sistema de gerenciamento de senhas de atendimento em tempo real." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
          Sistema de Senhas
        </h1>
        <p className="text-white/70">Selecione um painel para abrir</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-6 w-full max-w-3xl">
        <Link
          to="/atendente"
          className="group bg-card text-card-foreground rounded-2xl p-8 shadow-2xl hover:scale-[1.02] transition-transform"
        >
          <Monitor className="w-12 h-12 text-primary mb-4" />
          <h2 className="text-xl font-bold mb-2">Painel do Atendente</h2>
          <p className="text-muted-foreground text-sm">Chamar e gerenciar senhas no guichê.</p>
        </Link>
        <Link
          to="/solicitante"
          className="group bg-card text-card-foreground rounded-2xl p-8 shadow-2xl hover:scale-[1.02] transition-transform"
        >
          <Tv className="w-12 h-12 text-primary mb-4" />
          <h2 className="text-xl font-bold mb-2">Painel do Solicitante</h2>
          <p className="text-muted-foreground text-sm">Tela para TV com mídia e senhas.</p>
        </Link>
      </div>
    </div>
  );
}
