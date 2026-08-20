# Sistema de Gerenciamento e Atendimento de Senhas

Aplicação web multitela de alta performance para controle de atendimento, gestão de filas e transmissão pública de senhas em tempo real. Desenvolvido para estabelecimentos como recepções, repartições públicas, clínicas e guichês de serviços.

---

## 🚀 Funcionalidades e Módulos do Sistema

O sistema opera com 5 interfaces integradas em tempo real:

1. **💻 Painel do Atendente (`/atendente`)**
   - Controle completo do guichê de atendimento.
   - Chamada automática da Fila do Totem por ordem de prioridade (Atendimento Preferencial primeiro).
   - Botões para chamar próxima senha, repetir sinal sonoro/visual ou realizar chamada manual (ex: `VIP-01`).
   - Gerenciador da playlist da TV (adicionar vídeos do YouTube ou links MP4, controlar volume e reiniciar fila).
   - Histórico em tempo real das últimas senhas atendidas.

2. **📺 Painel do Solicitante - TV Pública (`/solicitante`)**
   - Interface projetada para exibição em Smart TVs ou monitores grandes na recepção.
   - Destaque em tamanho gigante (8rem) para a senha atualmente chamada com guichê e nome do atendente.
   - Animação visual em efeito luminoso (Flash Glow) e alertas sonoros duplos (Beeps) a cada chamada.
   - Player de vídeo em loop contínuo (YouTube / MP4) para entretenimento e informações na recepção.

3. **🎟️ Totem de Autoatendimento (`/emissao`)**
   - Interface touchscreen para emissão de senhas por categoria:
     - 🔵 **Atendimento Normal** (Geral - `N`)
     - 🟢 **Atendimento Preferencial** (Lei 10.048/00 - `P`)
     - 🟣 **Atendimento do RH** (Recursos Humanos - `RH`)
   - Modal com simulação de impressão do ticket, horário e confirmação sonora.

4. **⭐ Pesquisa de Avaliação do Atendimento (`/avaliacao`)**
   - Pesquisa de satisfação pós-atendimento para coleta de feedback dos clientes.
   - Escala intuitiva de 1 a 4 (1: Ruim 😞, 2: Regular 😐, 3: Bom 🙂, 4: Excelente 😃).
   - Campo para comentários ou sugestões com vínculo ao número da senha e guichê.

5. **📊 Painel Administrativo & Gestão (`/admin`)**
   - Dashboard gerencial protegido por autenticação segura no servidor.
   - Indicadores em tempo real (KPIs): Chamadas hoje, Média de Satisfação (1 a 4), Taxa de Aprovação (%) e total de feedbacks.
   - Relatórios detalhados por atendente e gráfico de distribuição da satisfação.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 19, TypeScript, TailwindCSS, Lucide Icons, Sonner (Toasts)
- **Roteamento**: TanStack Router & TanStack Start
- **Backend & Realtime**: Supabase PostgreSQL, Realtime WebSockets & Web Storage Fallback
- **Documentação PDF**: Python + ReportLab (`generate_pdf.py`)
- **Deploy**: Vercel

---

## ⚙️ Configuração do Ambiente de Desenvolvimento

### Pré-requisitos
- Node.js 18+ ou Bun
- Gerenciador de pacotes (`npm`, `yarn` ou `bun`)

### Passo a Passo

1. **Clonar o Repositório**:
   ```bash
   git clone https://github.com/Conatus-cm/gerenciadordesenhas.git
   cd gerenciadordesenhas
   ```

2. **Instalar as Dependências**:
   ```bash
   npm install
   ```

3. **Configurar as Variáveis de Ambiente**:
   Crie o arquivo `.env` na raiz do projeto com base no `.env.example`:
   ```env
   VITE_SUPABASE_URL="https://seu-projeto.supabase.co"
   VITE_SUPABASE_PUBLISHABLE_KEY="sua-chave-anon-publica"
   ADMIN_EMAIL="projetointegradorpet@gmail.com"
   ADMIN_PASSWORD="SuaSenhaSegura"
   ```

4. **Iniciar o Servidor de Desenvolvimento**:
   ```bash
   npm run dev
   ```
   Acesse a aplicação no navegador em `http://localhost:3000`.

---

## 📁 Estrutura de Diretórios do Projeto

```text
├── src/
│   ├── components/         # Componentes UI reutilizáveis (Radix UI / Tailwind)
│   ├── integrations/       # Clientes de integração e suporte ao Supabase
│   ├── lib/               # Lógica de negócios, chamadas de API e estado local
│   ├── routes/             # Rotas do aplicativo (Index, Atendente, Solicitante, Totem, Avaliação, Admin)
│   ├── routeTree.gen.ts    # Árvore de rotas do TanStack Router
│   └── main.tsx            # Ponto de entrada da aplicação
├── supabase/               # Scripts SQL de migração e modelos de tabela
├── generate_pdf.py         # Script Python para geração da documentação técnica em PDF
├── vite.config.ts          # Configuração do Vite
└── package.json            # Dependências e scripts do projeto
```

---

## 📄 Documentação Técnica Completa

O projeto inclui um script em Python que gera automaticamente a documentação técnica oficial em PDF (`Documentacao_Tecnica_Sistema_Atendimento.pdf`).

Para regerar a documentação:
```bash
python generate_pdf.py
```

---

## 📄 Licença

Este projeto é disponibilizado sob a licença MIT. Todos os direitos reservados © 2026.
