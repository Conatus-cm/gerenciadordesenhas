import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        
        # Header (Top Line & Title) - Pages > 1
        if self._pageNumber > 1:
            self.setStrokeColor(colors.HexColor('#CBD5E1'))
            self.setLineWidth(0.75)
            self.line(36, 756, 576, 756)
            
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(colors.HexColor('#0F172A'))
            self.drawString(36, 762, "DOCUMENTAÇÃO TÉCNICA E FUNCIONAL — SISTEMA DE GERENCIAMENTO DE ATENDIMENTO")
            
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor('#64748B'))
            self.drawRightString(576, 762, "CONFIDENCIAL")
        
        # Footer (Bottom Line, Copyright & Page X of Y)
        self.setStrokeColor(colors.HexColor('#CBD5E1'))
        self.setLineWidth(0.75)
        self.line(36, 45, 576, 45)
        
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor('#64748B'))
        self.drawString(36, 32, "Sistema de Gerenciamento de Atendimento © 2026 — Todos os direitos reservados.")
        
        page_text = f"Página {self._pageNumber} de {page_count}"
        self.drawRightString(576, 32, page_text)
        
        self.restoreState()

def generate_pdf(filename="Documentacao_Tecnica_Sistema_Atendimento.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=54,
        bottomMargin=54
    )
    
    styles = getSampleStyleSheet()
    
    # Palette Colors
    PRIMARY = colors.HexColor('#0F172A')    # Slate 900
    SECONDARY = colors.HexColor('#2563EB')  # Blue 600
    TEXT_DARK = colors.HexColor('#1E293B')  # Slate 800
    TEXT_MUTED = colors.HexColor('#64748B') # Slate 500
    BG_LIGHT = colors.HexColor('#F8FAFC')   # Slate 50
    BG_CALLOUT = colors.HexColor('#EFF6FF') # Blue 50
    BORDER_COLOR = colors.HexColor('#E2E8F0')

    # Custom Typography Styles
    styles.add(ParagraphStyle(
        name='DocTitle',
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=PRIMARY,
        spaceAfter=6
    ))
    
    styles.add(ParagraphStyle(
        name='DocSubTitle',
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=SECONDARY,
        spaceAfter=20
    ))
    
    styles.add(ParagraphStyle(
        name='SectionHeading',
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=PRIMARY,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    ))

    styles.add(ParagraphStyle(
        name='SubSectionHeading',
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=SECONDARY,
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    ))

    styles.add(ParagraphStyle(
        name='BodyCustom',
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=TEXT_DARK,
        spaceAfter=6
    ))

    styles.add(ParagraphStyle(
        name='BulletCustom',
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=TEXT_DARK,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=4
    ))

    styles.add(ParagraphStyle(
        name='CodeCustom',
        fontName='Courier',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#0F172A'),
        backColor=BG_LIGHT,
        borderColor=BORDER_COLOR,
        borderWidth=0.5,
        borderPadding=6,
        spaceAfter=8
    ))

    styles.add(ParagraphStyle(
        name='TableText',
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=TEXT_DARK
    ))

    styles.add(ParagraphStyle(
        name='TableHeader',
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.white
    ))

    story = []

    # Title Banner
    story.append(Paragraph("DOCUMENTAÇÃO TÉCNICA E ARQUITETURAL", styles['DocTitle']))
    story.append(Paragraph("Sistema de Gerenciamento e Atendimento de Senhas com Sincronização em Tempo Real", styles['DocSubTitle']))
    story.append(HRFlowable(width="100%", thickness=1.5, color=SECONDARY, spaceBefore=0, spaceAfter=14))

    # Metadata Block
    meta_data = [
        [Paragraph("<b>Projeto:</b> Sistema de Gerenciamento de Atendimento (Guinche)", styles['TableText']),
         Paragraph("<b>Versão:</b> 1.0.0 (Produção)", styles['TableText'])],
        [Paragraph("<b>Arquitetura:</b> Full-Stack SSR / Real-Time Client", styles['TableText']),
         Paragraph("<b>Data do Documento:</b> Agosto / 2026", styles['TableText'])],
        [Paragraph("<b>Linguagem Principal:</b> TypeScript 5.8 (ES2022)", styles['TableText']),
         Paragraph("<b>Banco de Dados:</b> Supabase PostgreSQL + Realtime", styles['TableText'])]
    ]
    t_meta = Table(meta_data, colWidths=[270, 270])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_CALLOUT),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#BFDBFE')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 14))

    # 1. Visão Geral
    story.append(Paragraph("1. VISÃO GERAL DO SISTEMA", styles['SectionHeading']))
    story.append(Paragraph(
        "O <b>Sistema de Gerenciamento e Atendimento de Senhas</b> é uma solução web moderna de alta performance projetada para coordenar filas de atendimento em estabelecimentos, escritórios e guichês de serviço. O sistema opera através de duas telas dinâmicas e sincronizadas simultaneamente em tempo real: o <b>Painel do Atendente</b> e o <b>Painel do Solicitante (TV Pública)</b>.",
        styles['BodyCustom']
    ))
    story.append(Paragraph(
        "Sua arquitetura utiliza sincronização reativa via <i>WebSockets (Supabase Realtime)</i>, garantindo que qualquer chamada efetuada pelo atendente seja instantaneamente transmitida à TV com sinalização sonora dual-tone e animação visual de destaque.",
        styles['BodyCustom']
    ))
    story.append(Spacer(1, 8))

    # 2. Arquitetura e Stack
    story.append(Paragraph("2. STACK TECNOLÓGICA E LINGUAGENS", styles['SectionHeading']))
    
    stack_headers = ["Categoria", "Tecnologia / Biblioteca", "Versão", "Função no Sistema"]
    stack_rows = [
        [Paragraph("Linguagem Core", styles['TableHeader']), Paragraph("TypeScript", styles['TableHeader']), Paragraph("5.8.3", styles['TableHeader']), Paragraph("Tipagem estática de ponta a ponta e compilação de alta performance", styles['TableHeader'])],
        [Paragraph("Framework Frontend", styles['TableHeader']), Paragraph("React", styles['TableText']), Paragraph("19.2.0", styles['TableText']), Paragraph("Construção da interface declarativa e reativa", styles['TableText'])],
        [Paragraph("Roteamento / SSR", styles['TableHeader']), Paragraph("TanStack Router & Start", styles['TableText']), Paragraph("1.168.25", styles['TableText']), Paragraph("Roteamento type-safe e Renderização no Servidor (SSR)", styles['TableText'])],
        [Paragraph("Gerenciamento Estado", styles['TableHeader']), Paragraph("TanStack React Query", styles['TableText']), Paragraph("5.83.0", styles['TableText']), Paragraph("Cache e sincronização de dados assíncronos no cliente", styles['TableText'])],
        [Paragraph("Backend ass-a-Service", styles['TableHeader']), Paragraph("Supabase (PostgreSQL)", styles['TableText']), Paragraph("2.107.0", styles['TableText']), Paragraph("Banco de dados relacional, RLS e WebSocket Realtime", styles['TableText'])],
        [Paragraph("Estilização UI", styles['TableHeader']), Paragraph("Tailwind CSS + Radix UI", styles['TableText']), Paragraph("4.2.1", styles['TableText']), Paragraph("Design System responsivo, utilitário e acessível", styles['TableText'])],
        [Paragraph("Build Tool & Server", styles['TableHeader']), Paragraph("Vite + Nitro Server", styles['TableText']), Paragraph("7.3.1", styles['TableText']), Paragraph("Bundler ultrarrápido e servidor backend serverless", styles['TableText'])],
        [Paragraph("Validação de Dados", styles['TableHeader']), Paragraph("Zod", styles['TableText']), Paragraph("3.24.2", styles['TableText']), Paragraph("Validação rigorosa de schemas e tipos em tempo de execução", styles['TableText'])],
    ]
    
    t_stack = Table(stack_rows, colWidths=[100, 120, 60, 260])
    t_stack.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT])
    ]))
    story.append(t_stack)
    story.append(Spacer(1, 10))

    # 3. Funcionalidades Detalhadas
    story.append(Paragraph("3. FUNCIONALIDADES E MÓDULOS DO SISTEMA", styles['SectionHeading']))
    
    story.append(Paragraph("3.1. Painel do Atendente (/atendente)", styles['SubSectionHeading']))
    story.append(Paragraph("• <b>Chamada Sequencial Automatizada:</b> Botão dedicado para chamar a próxima senha em ordem numérica sequencial (ex: 101, 102, 103...), atualizando automaticamente o contador.", styles['BulletCustom']))
    story.append(Paragraph("• <b>Chamada Manual Flexível:</b> Permite ao operador digitar e chamar qualquer código de senha customizado (ex: 'P-01', 'A-50', 'VIP').", styles['BulletCustom']))
    story.append(Paragraph("• <b>Configuração de Guichê e Operador:</b> Definição do número do guichê/balcão de atendimento e nome do atendente, com persistência automática no <i>localStorage</i>.", styles['BulletCustom']))
    story.append(Paragraph("• <b>Rechamada (Repetir Sinal):</b> Função para chamar novamente a última senha enviada à TV, acionando novamente o aviso sonoro e a piscagem visual.", styles['BulletCustom']))
    story.append(Paragraph("• <b>Gerenciador de Playlist de TV:</b> Interface integrada para adicionar vídeos do YouTube, transmissões ao vivo ou imagens na TV, com suporte a ordenação, exclusão e reset de reprodução.", styles['BulletCustom']))

    story.append(Spacer(1, 4))
    story.append(Paragraph("3.2. Painel do Solicitante - TV Pública (/solicitante)", styles['SubSectionHeading']))
    story.append(Paragraph("• <b>Exibição Destaque de Senha Atual:</b> Visualização em tamanho gigante da senha atual chamada, indicando o número do guichê e o atendente responsável.", styles['BulletCustom']))
    story.append(Paragraph("• <b>Alertas Sonoros Reativos (Web Audio API):</b> Disparo instantâneo de sinal sonoro biltonal (beeps em 880Hz) gerado via síntese de áudio nativa, sem necessidade de carregar arquivos externos.", styles['BulletCustom']))
    story.append(Paragraph("• <b>Efeito Visual 'Flash Glow':</b> Animação pulsante com bordas brilhantes ativada durante 3.5 segundos a cada nova chamada de senha.", styles['BulletCustom']))
    story.append(Paragraph("• <b>Histórico Recente:</b> Lista lateral exibindo as últimas 4 senhas chamadas com respectivo horário de atendimento.", styles['BulletCustom']))
    story.append(Paragraph("• <b>Player de Mídia Híbrido Incorporado:</b> Integração nativa com a API IFrame do YouTube para reprodução contínua de vídeos, transmissões de TV ou imagens promocionais enquanto a fila é gerenciada.", styles['BulletCustom']))

    story.append(Spacer(1, 10))

    # 4. Estrutura de Banco de Dados e Realtime
    story.append(Paragraph("4. MODELAGEM DE DADOS E SUBSCRIÇÃO REALTIME", styles['SectionHeading']))
    story.append(Paragraph(
        "O sistema utiliza o banco de dados PostgreSQL hospedado no Supabase com suporte habilitado a <b>Realtime Publications</b>. Isso significa que qualquer alteração nas tabelas é propagada para os clientes conectados em menos de 100ms via WebSockets.",
        styles['BodyCustom']
    ))
    story.append(Spacer(1, 4))

    db_headers = ["Tabela", "Coluna", "Tipo de Dado", "Descrição / Regra"]
    db_rows = [
        [Paragraph("public.tickets", styles['TableHeader']), Paragraph("id", styles['TableHeader']), Paragraph("UUID (PK)", styles['TableHeader']), Paragraph("Identificador único da chamada (gen_random_uuid())", styles['TableHeader'])],
        [Paragraph("public.tickets", styles['TableText']), Paragraph("ticket_code", styles['TableText']), Paragraph("TEXT", styles['TableText']), Paragraph("Código ou número da senha chamada", styles['TableText'])],
        [Paragraph("public.tickets", styles['TableText']), Paragraph("counter_number", styles['TableText']), Paragraph("INTEGER", styles['TableText']), Paragraph("Número do guichê/balcão que chamou a senha", styles['TableText'])],
        [Paragraph("public.tickets", styles['TableText']), Paragraph("attendant_name", styles['TableText']), Paragraph("TEXT (Null)", styles['TableText']), Paragraph("Nome ou identificador do atendente operador", styles['TableText'])],
        [Paragraph("public.tickets", styles['TableText']), Paragraph("called_at", styles['TableText']), Paragraph("TIMESTAMPTZ", styles['TableText']), Paragraph("Data e hora exata da chamada (default now())", styles['TableText'])],
        [Paragraph("display_settings", styles['TableText']), Paragraph("repeat_item_id", styles['TableText']), Paragraph("UUID", styles['TableText']), Paragraph("ID do ticket solicitado para rechamada sonora", styles['TableText'])],
        [Paragraph("playlist_items", styles['TableText']), Paragraph("media_type / url", styles['TableText']), Paragraph("TEXT", styles['TableText']), Paragraph("Tipo (youtube/image) e URL do conteúdo da TV", styles['TableText'])],
    ]
    t_db = Table(db_rows, colWidths=[95, 105, 90, 250])
    t_db.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 4.5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT])
    ]))
    story.append(t_db)
    story.append(Spacer(1, 10))

    # 5. Segurança e Isolamento
    story.append(Paragraph("5. SEGURANÇA E ISOLAMENTO DE DADOS", styles['SectionHeading']))
    story.append(Paragraph(
        "<b>• Row Level Security (RLS):</b> Todas as tabelas do sistema possuem políticas de segurança ativas no PostgreSQL, liberando operações de consulta pública e escrita autorizada.<br/>"
        "<b>• Ausência de Hardcoding:</b> Nenhuma senha, token administrativo ou chave privada foi codificada estaticamente no código-fonte. O projeto consome variáveis de ambiente estritamente via `.env` no cliente e no servidor.<br/>"
        "<b>• Proteção Git & Repositório:</b> O arquivo `.env` é totalmente ignorado no `.gitignore`, garantindo que uploads para o GitHub permaneçam 100% seguros.",
        styles['BodyCustom']
    ))

    story.append(Spacer(1, 10))

    # 6. Estrutura de Arquivos do Projeto
    story.append(Paragraph("6. ESTRUTURA FÍSICA DO PROJETO", styles['SectionHeading']))
    tree_code = (
        "guinche-main/\n"
        "├── src/\n"
        "│   ├── components/ui/       # Biblioteca de componentes acessíveis (Radix UI / Shadcn)\n"
        "│   ├── integrations/supabase/# Cliente Supabase configurado para SSR e Browser\n"
        "│   ├── lib/\n"
        "│   │   ├── tickets.ts       # Serviços de busca, inserção e subscrição WebSocket de senhas\n"
        "│   │   └── display.ts       # Serviços da playlist de mídia da TV e sinalização de repetição\n"
        "│   ├── routes/\n"
        "│   │   ├── __root.tsx       # Shell principal da aplicação e metadados globais\n"
        "│   │   ├── atendente.tsx    # Painel de controle do guichê e gerenciador de fila\n"
        "│   │   ├── solicitante.tsx  # Tela pública de exibição de senhas e player de TV\n"
        "│   │   └── index.tsx        # Redirecionamento da raiz do sistema\n"
        "│   ├── styles.css           # Estilos globais e animações Tailwind CSS v4\n"
        "│   ├── router.tsx           # Instanciação do TanStack Router\n"
        "│   └── server.ts           # Entrada do servidor SSR Nitro\n"
        "├── supabase/\n"
        "│   ├── config.toml          # Configuração da CLI do Supabase (Project ID)\n"
        "│   └── migrations/          # Scripts SQL de criação das tabelas e políticas RLS\n"
        "├── .env.example             # Modelo seguro de variáveis de ambiente\n"
        "├── package.json             # Dependências e scripts de execução do Node/Bun\n"
        "└── vite.config.ts           # Configuração de build Vite e TanStack Start"
    )
    story.append(Paragraph(tree_code, styles['CodeCustom']))

    # Build PDF Document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF gerado com sucesso em: {filename}")

if __name__ == "__main__":
    generate_pdf()
