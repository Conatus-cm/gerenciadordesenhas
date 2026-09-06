import { createFileRoute } from "@tanstack/react-router";
import { EmissaoTotemPage } from "./emissao";

export const Route = createFileRoute("/totem")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Emissão de Senhas — Totem de Autoatendimento" },
      { name: "description", content: "Totem de autoatendimento para retirada de senhas com prioridade legal." },
    ],
  }),
  component: EmissaoTotemPage,
});
