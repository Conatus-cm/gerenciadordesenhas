import { createFileRoute, Link } from "@tanstack/react-router";
import { Monitor, Tv, Ticket } from "lucide-react";

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
      <div className="grid sm:grid-cols-3 gap-6 w-full max-w-4xl">
        <Link
          to="/atendente"
          className="group bg-card text-card-foreground rounded-2xl p-6 shadow-2xl hover:scale-[1.02] transition-transform"
        >
          <Monitor className="w-10 h-10 text-primary mb-3" />
          <h2 className="text-lg font-bold mb-1">Painel do Atendente</h2>
          <p className="text-muted-foreground text-xs">Chamar e gerenciar senhas no guichê.</p>
        </Link>
        <Link
          to="/solicitante"
          className="group bg-card text-card-foreground rounded-2xl p-6 shadow-2xl hover:scale-[1.02] transition-transform"
        >
          <Tv className="w-10 h-10 text-primary mb-3" />
          <h2 className="text-lg font-bold mb-1">Painel do Solicitante</h2>
          <p className="text-muted-foreground text-xs">Tela para TV com mídia e senhas.</p>
        </Link>
        <Link
          to="/emissao"
          className="group bg-card text-card-foreground rounded-2xl p-6 shadow-2xl hover:scale-[1.02] transition-transform border border-primary/20"
        >
          <Ticket className="w-10 h-10 text-primary mb-3" />
          <h2 className="text-lg font-bold mb-1">Totem de Autoatendimento</h2>
          <p className="text-muted-foreground text-xs">Emissão de senhas (normal e preferencial).</p>
        </Link>
      </div>
    </div>
  );
}
