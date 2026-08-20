import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable, KeepTogether
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
        if self._pageNumber > 1:
            self.setStrokeColor(colors.HexColor('#CBD5E1'))
            self.setLineWidth(0.75)
            self.line(36, 756, 576, 756)
            self.setFont("Helvetica-Bold", 7.5)
            self.setFillColor(colors.HexColor('#0F172A'))
            self.drawString(36, 762, "DOCUMENTAÇÃO TÉCNICA — SISTEMA DE GERENCIAMENTO DE ATENDIMENTO")
            self.setFont("Helvetica", 7.5)
            self.setFillColor(colors.HexColor('#64748B'))
            self.drawRightString(576, 762, "CONFIDENCIAL")
        self.setStrokeColor(colors.HexColor('#CBD5E1'))
        self.setLineWidth(0.75)
        self.line(36, 45, 576, 45)
        self.setFont("Helvetica", 7.5)
        self.setFillColor(colors.HexColor('#64748B'))
        self.drawString(36, 32, "Sistema de Gerenciamento de Atendimento © 2026 — Todos os direitos reservados.")
        self.drawRightString(576, 32, f"Página {self._pageNumber} de {page_count}")
        self.restoreState()


def generate_pdf(filename="Documentacao_Tecnica_Sistema_Atendimento.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=54,
        bottomMargin=54,
    )

    styles = getSampleStyleSheet()

    # Palette
    PRIMARY = colors.HexColor('#0F172A')
    SECONDARY = colors.HexColor('#2563EB')
    TEXT_DARK = colors.HexColor('#1E293B')
    TEXT_MUTED = colors.HexColor('#64748B')
    BG_LIGHT = colors.HexColor('#F8FAFC')
    BG_CALLOUT = colors.HexColor('#EFF6FF')
    BG_TIP = colors.HexColor('#F0FDF4')
    BG_WARN = colors.HexColor('#FFFBEB')
    BORDER = colors.HexColor('#E2E8F0')

    # ─── Custom Styles ───────────────────────────────────────────────
    styles.add(ParagraphStyle('DocTitle', fontName='Helvetica-Bold', fontSize=22, leading=26, textColor=PRIMARY, spaceAfter=4))
    styles.add(ParagraphStyle('DocSub', fontName='Helvetica', fontSize=11, leading=15, textColor=SECONDARY, spaceAfter=18))
    styles.add(ParagraphStyle('H1', fontName='Helvetica-Bold', fontSize=14, leading=18, textColor=PRIMARY, spaceBefore=16, spaceAfter=8, keepWithNext=True))
    styles.add(ParagraphStyle('H2', fontName='Helvetica-Bold', fontSize=11, leading=15, textColor=SECONDARY, spaceBefore=10, spaceAfter=6, keepWithNext=True))
    styles.add(ParagraphStyle('H3', fontName='Helvetica-Bold', fontSize=10, leading=14, textColor=colors.HexColor('#334155'), spaceBefore=8, spaceAfter=4, keepWithNext=True))
    styles.add(ParagraphStyle('Body', fontName='Helvetica', fontSize=9.5, leading=13.5, textColor=TEXT_DARK, spaceAfter=6))
    styles.add(ParagraphStyle('BulletItem', fontName='Helvetica', fontSize=9.5, leading=13.5, textColor=TEXT_DARK, leftIndent=14, firstLineIndent=-10, spaceAfter=4))
    styles.add(ParagraphStyle('BulletSub', fontName='Helvetica', fontSize=9, leading=12.5, textColor=TEXT_DARK, leftIndent=28, firstLineIndent=-10, spaceAfter=3))
    styles.add(ParagraphStyle('CodeBox', fontName='Courier', fontSize=8, leading=10.5, textColor=PRIMARY, backColor=BG_LIGHT, borderColor=BORDER, borderWidth=0.5, borderPadding=6, spaceAfter=8))
    styles.add(ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=8.5, leading=11, textColor=colors.white))
    styles.add(ParagraphStyle('TD', fontName='Helvetica', fontSize=8.5, leading=11, textColor=TEXT_DARK))
    styles.add(ParagraphStyle('Callout', fontName='Helvetica', fontSize=9, leading=12.5, textColor=TEXT_DARK, backColor=BG_CALLOUT, borderColor=colors.HexColor('#BFDBFE'), borderWidth=0.5, borderPadding=8, spaceAfter=10))
    styles.add(ParagraphStyle('Tip', fontName='Helvetica', fontSize=9, leading=12.5, textColor=TEXT_DARK, backColor=BG_TIP, borderColor=colors.HexColor('#BBF7D0'), borderWidth=0.5, borderPadding=8, spaceAfter=10))
    styles.add(ParagraphStyle('Warn', fontName='Helvetica', fontSize=9, leading=12.5, textColor=TEXT_DARK, backColor=BG_WARN, borderColor=colors.HexColor('#FDE68A'), borderWidth=0.5, borderPadding=8, spaceAfter=10))
    styles.add(ParagraphStyle('StepNum', fontName='Helvetica-Bold', fontSize=9.5, leading=13, textColor=SECONDARY, leftIndent=4, spaceAfter=2, keepWithNext=True))
    styles.add(ParagraphStyle('StepBody', fontName='Helvetica', fontSize=9.5, leading=13, textColor=TEXT_DARK, leftIndent=18, spaceAfter=6))

    story = []

    def hr():
        story.append(HRFlowable(width="100%", thickness=1.2, color=SECONDARY, spaceBefore=0, spaceAfter=12))

    def table_standard(rows, col_widths):
        t = Table(rows, colWidths=col_widths)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
            ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('PADDING', (0, 0), (-1, -1), 5),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
        ]))
        return t

    p = Paragraph  # shortcut

    # ═══════════════════════════════════════════════════════════════════
    # COVER
    # ═══════════════════════════════════════════════════════════════════
    story.append(p("DOCUMENTAÇÃO TÉCNICA E FUNCIONAL COMPLETA", styles['DocTitle']))
    story.append(p("Sistema de Gerenciamento e Atendimento de Senhas — Guia de Uso, Arquitetura e Referência", styles['DocSub']))
    hr()

    meta = [
        [p("<b>Projeto:</b> Sistema de Atendimento (Guinche)", styles['TD']),
         p("<b>Versão:</b> 1.0.0 — Produção", styles['TD'])],
        [p("<b>Linguagem:</b> TypeScript 5.8 (ES2022)", styles['TD']),
         p("<b>Banco de Dados:</b> Supabase PostgreSQL + Realtime", styles['TD'])],
        [p("<b>Framework:</b> React 19 + TanStack Router/Start", styles['TD']),
         p("<b>Data:</b> Agosto / 2026", styles['TD'])],
    ]
    tm = Table(meta, colWidths=[270, 270])
    tm.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BG_CALLOUT),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#BFDBFE')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(tm)
    story.append(Spacer(1, 16))

    # SUMÁRIO
    story.append(p("SUMÁRIO", styles['H1']))
    toc_items = [
        "1. Visão Geral do Sistema",
        "2. Telas do Sistema (Mapa de Navegação)",
        "3. Guia Passo a Passo — Como Usar o Sistema",
        "4. Módulo de Vídeos e Playlist da TV",
        "5. Stack Tecnológica e Linguagens",
        "6. Modelagem de Dados (Banco de Dados)",
        "7. Comunicação em Tempo Real (Realtime)",
        "8. Sistema de Áudio e Animações Visuais",
        "9. Segurança e Proteção de Dados",
        "10. Estrutura de Arquivos do Projeto",
        "11. Configuração do Ambiente de Desenvolvimento",
        "12. Glossário de Termos Técnicos",
    ]
    for item in toc_items:
        story.append(p(f"• {item}", styles['BulletItem']))
    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════════
    # 1. VISÃO GERAL
    # ═══════════════════════════════════════════════════════════════════
    story.append(p("1. VISÃO GERAL DO SISTEMA", styles['H1']))
    story.append(p(
        "O <b>Sistema de Gerenciamento e Atendimento de Senhas</b> é uma aplicação web moderna de alta performance "
        "projetada para coordenar filas de atendimento em estabelecimentos como clínicas, escritórios, repartições "
        "públicas, bancos e guichês de serviço.", styles['Body']))
    story.append(p(
        "O sistema opera através de <b>três telas</b> sincronizadas simultaneamente em tempo real via WebSockets:", styles['Body']))
    story.append(p("• <b>Tela Inicial (Seleção de Painel):</b> Página de boas-vindas onde o operador escolhe qual painel abrir.", styles['BulletItem']))
    story.append(p("• <b>Painel do Atendente:</b> Interface completa de controle onde o operador chama senhas, gerencia vídeos da TV e visualiza histórico.", styles['BulletItem']))
    story.append(p("• <b>Painel do Solicitante (TV Pública):</b> Tela de exibição pública projetada para TVs/monitores grandes, mostrando a senha chamada com alerta sonoro e visual, além de vídeos em loop.", styles['BulletItem']))
    story.append(Spacer(1, 6))
    story.append(p(
        "Qualquer ação realizada pelo atendente (chamar senha, trocar vídeo, repetir sinal) é <b>instantaneamente transmitida</b> "
        "para o painel da TV em menos de 100 milissegundos, sem necessidade de recarregar a página.", styles['Body']))
    story.append(Spacer(1, 4))
    story.append(p(
        "<b>NOTA:</b> O sistema funciona 100% no navegador web — não requer instalação de software. "
        "Basta abrir a URL no computador do atendente e na TV.", styles['Callout']))

    # ═══════════════════════════════════════════════════════════════════
    # 2. TELAS DO SISTEMA
    # ═══════════════════════════════════════════════════════════════════
    story.append(p("2. TELAS DO SISTEMA (MAPA DE NAVEGAÇÃO)", styles['H1']))

    story.append(p("2.1. Tela Inicial — Página de Seleção ( / )", styles['H2']))
    story.append(p(
        "Ao acessar a URL raiz do sistema, o usuário encontra uma página centralizada com dois cartões grandes:", styles['Body']))
    story.append(p("• <b>Painel do Atendente</b> — com ícone de monitor. Clicando, abre a interface de controle do guichê.", styles['BulletItem']))
    story.append(p("• <b>Painel do Solicitante</b> — com ícone de TV. Clicando, abre a tela pública de exibição.", styles['BulletItem']))
    story.append(p(
        "Os cartões possuem efeito hover com escala suave (zoom de 1.02x) e sombra intensa para facilitar a interação.", styles['Body']))

    story.append(Spacer(1, 6))
    story.append(p("2.2. Painel do Atendente ( /atendente )", styles['H2']))
    story.append(p(
        "É a tela principal de operação. Composta por <b>quatro cartões empilhados</b> verticalmente:", styles['Body']))
    story.append(p("• <b>Cartão Principal de Controle</b> — Contém: número do guichê (editável), nome do atendente (editável), próxima senha (editável), botão CHAMAR PRÓXIMA SENHA e botão REPETIR SENHA ATUAL.", styles['BulletItem']))
    story.append(p("• <b>Cartão de Senha Manual</b> — Campo de digitação livre para chamar qualquer código personalizado (ex: P-01, VIP-3) sem alterar a sequência automática.", styles['BulletItem']))
    story.append(p("• <b>Cartão de Fila da TV</b> — Gerenciador completo de vídeos/mídias que são exibidos na tela do solicitante. Permite adicionar links do YouTube ou MP4, ver a lista, remover itens, repetir e reiniciar a fila.", styles['BulletItem']))
    story.append(p("• <b>Cartão de Histórico</b> — Lista das últimas 10 senhas chamadas com código, guichê, atendente e horário.", styles['BulletItem']))

    story.append(Spacer(1, 6))
    story.append(p("2.3. Painel do Solicitante — TV Pública ( /solicitante )", styles['H2']))
    story.append(p(
        "Tela projetada para ser exibida em TVs ou monitores grandes. O layout é dividido em <b>duas colunas</b> lado a lado:", styles['Body']))
    story.append(p("• <b>Coluna Esquerda (55% da tela):</b> Área de mídia — reproduz o vídeo/mídia atualmente na fila (YouTube ou MP4). Quando não há vídeos, exibe a mensagem 'Nenhum vídeo na fila. Adicione no painel do atendente.'", styles['BulletItem']))
    story.append(p("• <b>Coluna Direita (45% da tela):</b> Dividida em dois blocos:", styles['BulletItem']))
    story.append(p("– <b>Bloco Superior (SENHA ATUAL):</b> Exibe em tamanho gigante (8rem) a senha chamada, o número do guichê e o nome do atendente. Quando uma nova senha é chamada, o bloco pisca com efeito luminoso (Flash Glow) por 3.5 segundos e emite dois beeps sonoros.", styles['BulletSub']))
    story.append(p("– <b>Bloco Inferior (HISTÓRICO):</b> Lista as últimas 4 senhas chamadas com número da senha e guichê correspondente.", styles['BulletSub']))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════════
    # 3. GUIA PASSO A PASSO
    # ═══════════════════════════════════════════════════════════════════
    story.append(p("3. GUIA PASSO A PASSO — COMO USAR O SISTEMA", styles['H1']))

    story.append(p("3.1. Configuração Inicial (Primeira Vez)", styles['H2']))
    story.append(p("Passo 1 —", styles['StepNum']))
    story.append(p("Abra o sistema no navegador (Chrome recomendado) no computador do atendente.", styles['StepBody']))
    story.append(p("Passo 2 —", styles['StepNum']))
    story.append(p("Na tela inicial, clique em <b>'Painel do Atendente'</b>.", styles['StepBody']))
    story.append(p("Passo 3 —", styles['StepNum']))
    story.append(p("Defina o <b>número do seu guichê</b> clicando no ícone de lápis ao lado do número. "
                    "Digite o número desejado (ex: 1, 2, 3) e pressione Enter ou clique fora.", styles['StepBody']))
    story.append(p("Passo 4 —", styles['StepNum']))
    story.append(p("Digite seu <b>nome de atendente</b> no campo 'NOME DO ATENDENTE' (ex: Carlos, Maria). "
                    "Esse nome aparecerá na TV ao lado da senha chamada.", styles['StepBody']))
    story.append(p("Passo 5 —", styles['StepNum']))
    story.append(p("Se necessário, ajuste o <b>número da próxima senha</b> clicando no lápis ao lado de 'PRÓXIMA SENHA'. "
                    "O padrão é iniciar em 101.", styles['StepBody']))
    story.append(p(
        "<b>DICA:</b> Todas essas configurações (guichê, nome e número da próxima senha) são salvas automaticamente no "
        "navegador (localStorage). Se você fechar e reabrir o sistema, os valores estarão preservados.", styles['Tip']))

    story.append(Spacer(1, 6))
    story.append(p("3.2. Configuração da TV (Tela Pública)", styles['H2']))
    story.append(p("Passo 1 —", styles['StepNum']))
    story.append(p("Abra o sistema no navegador da TV ou do computador conectado à TV.", styles['StepBody']))
    story.append(p("Passo 2 —", styles['StepNum']))
    story.append(p("Na tela inicial, clique em <b>'Painel do Solicitante'</b>.", styles['StepBody']))
    story.append(p("Passo 3 —", styles['StepNum']))
    story.append(p("Coloque o navegador em <b>tela cheia</b> (pressione F11). "
                    "A tela se adaptará automaticamente a qualquer resolução.", styles['StepBody']))
    story.append(p(
        "<b>IMPORTANTE:</b> O áudio de alerta (beeps) precisa que o usuário tenha interagido com a página pelo menos uma vez "
        "(clique em qualquer lugar). Isso é uma restrição dos navegadores modernos para autoplay de áudio.", styles['Warn']))

    story.append(Spacer(1, 8))
    story.append(p("3.3. Como Chamar uma Senha (Sequencial)", styles['H2']))
    story.append(p("Passo 1 —", styles['StepNum']))
    story.append(p("No Painel do Atendente, observe o botão grande <b>'CHAMAR PRÓXIMA SENHA (XXX)'</b>, "
                    "onde XXX é o número da próxima senha na sequência.", styles['StepBody']))
    story.append(p("Passo 2 —", styles['StepNum']))
    story.append(p("Clique nesse botão. A senha será imediatamente:", styles['StepBody']))
    story.append(p("– Registrada no banco de dados com o código, número do guichê e nome do atendente.", styles['BulletSub']))
    story.append(p("– Exibida instantaneamente na TV do solicitante com efeito visual pulsante.", styles['BulletSub']))
    story.append(p("– Acompanhada de dois beeps sonoros na TV.", styles['BulletSub']))
    story.append(p("– Adicionada ao histórico de ambos os painéis.", styles['BulletSub']))
    story.append(p("Passo 3 —", styles['StepNum']))
    story.append(p("O contador avança automaticamente para o próximo número (ex: 101 → 102 → 103). "
                    "Uma notificação de sucesso (toast) confirma: 'Senha XXX chamada no guichê Y'.", styles['StepBody']))

    story.append(Spacer(1, 6))
    story.append(p("3.4. Como Chamar uma Senha Manual (Fora da Sequência)", styles['H2']))
    story.append(p("Passo 1 —", styles['StepNum']))
    story.append(p("Role até o cartão <b>'SENHA MANUAL'</b> no Painel do Atendente.", styles['StepBody']))
    story.append(p("Passo 2 —", styles['StepNum']))
    story.append(p("Digite qualquer código desejado no campo de texto (ex: P-01, VIP-3, 80, A-50). "
                    "O campo aceita letras e números.", styles['StepBody']))
    story.append(p("Passo 3 —", styles['StepNum']))
    story.append(p("Clique em <b>'CHAMAR MANUAL'</b> ou pressione Enter. "
                    "A senha será chamada na TV exatamente como uma senha sequencial, mas <b>sem alterar o contador automático</b>.", styles['StepBody']))
    story.append(p(
        "<b>NOTA:</b> Isso é útil para chamadas fora de ordem, senhas preferenciais ou rechamada "
        "de clientes que perderam a vez.", styles['Callout']))

    story.append(Spacer(1, 6))
    story.append(p("3.5. Como Repetir / Rechamar a Última Senha", styles['H2']))
    story.append(p("Passo 1 —", styles['StepNum']))
    story.append(p("No cartão principal, observe o botão <b>'REPETIR SENHA ATUAL (XXX)'</b>, "
                    "que mostra o código da última senha chamada.", styles['StepBody']))
    story.append(p("Passo 2 —", styles['StepNum']))
    story.append(p("Clique nesse botão. A senha será chamada novamente na TV com os mesmos efeitos visuais e sonoros. "
                    "A informação 'ÚLTIMA SENHA' no painel também exibe qual senha foi chamada por último.", styles['StepBody']))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════════
    # 4. MÓDULO DE VÍDEOS E PLAYLIST
    # ═══════════════════════════════════════════════════════════════════
    story.append(p("4. MÓDULO DE VÍDEOS E PLAYLIST DA TV", styles['H1']))
    story.append(p(
        "O sistema inclui um módulo completo de gerenciamento de mídia que permite ao atendente controlar "
        "o que é exibido na TV pública enquanto os clientes aguardam atendimento.", styles['Body']))

    story.append(p("4.1. Tipos de Mídia Suportados", styles['H2']))
    story.append(p("• <b>YouTube:</b> Vídeos comuns, vídeos ao vivo (livestreams), Shorts. "
                    "Aceita todos os formatos de URL: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, youtube.com/shorts/ID, ou apenas o ID de 11 caracteres.", styles['BulletItem']))
    story.append(p("• <b>MP4 / Vídeos Diretos:</b> Qualquer URL direta de vídeo que comece com http:// ou https:// (ex: https://seusite.com/promo.mp4).", styles['BulletItem']))

    story.append(Spacer(1, 6))
    story.append(p("4.2. Como Adicionar um Vídeo à Fila", styles['H2']))
    story.append(p("Passo 1 —", styles['StepNum']))
    story.append(p("No Painel do Atendente, localize o cartão <b>'FILA DA TV'</b> (identificado pelo ícone de TV).", styles['StepBody']))
    story.append(p("Passo 2 —", styles['StepNum']))
    story.append(p("Cole o link do vídeo no campo de texto. Exemplos válidos:", styles['StepBody']))
    story.append(p("– https://www.youtube.com/watch?v=dQw4w9WgXcQ", styles['BulletSub']))
    story.append(p("– https://youtu.be/dQw4w9WgXcQ", styles['BulletSub']))
    story.append(p("– https://meusite.com/promocao.mp4", styles['BulletSub']))
    story.append(p("Passo 3 —", styles['StepNum']))
    story.append(p("Clique em <b>'ADICIONAR'</b> ou pressione Enter. O vídeo será adicionado ao final da fila "
                    "e aparecerá na lista com um indicador numérico de posição.", styles['StepBody']))

    story.append(Spacer(1, 6))
    story.append(p("4.3. Como Funciona a Reprodução", styles['H2']))
    story.append(p("• A fila de vídeos toca <b>em ordem sequencial</b> (posição 1, 2, 3...).", styles['BulletItem']))
    story.append(p("• Vídeos do YouTube iniciam automaticamente no modo <b>mudo (muted)</b> com controles ocultos.", styles['BulletItem']))
    story.append(p("• Quando um vídeo termina, ele é marcado como 'tocado' (ícone de check cinza) e o próximo vídeo da fila é iniciado.", styles['BulletItem']))
    story.append(p("• Quando <b>todos os vídeos terminam</b>, a fila é <b>automaticamente reiniciada</b> e começa a tocar novamente do início — criando um loop infinito.", styles['BulletItem']))
    story.append(p("• Na lista, vídeos pendentes exibem um <b>ponto azul</b> e vídeos já tocados exibem um <b>ícone de check cinza</b>.", styles['BulletItem']))

    story.append(Spacer(1, 6))
    story.append(p("4.4. Como Remover um Vídeo", styles['H2']))
    story.append(p("Na lista de vídeos, clique no ícone de <b>lixeira (Trash)</b> ao lado do vídeo que deseja remover. "
                    "A remoção é instantânea e reflete na TV em tempo real.", styles['Body']))

    story.append(Spacer(1, 6))
    story.append(p("4.5. Como Repetir um Vídeo Específico", styles['H2']))
    story.append(p("Na lista de vídeos, clique no ícone de <b>repetição (Repeat)</b> ao lado do vídeo desejado. "
                    "A TV interrompe o que estiver tocando e começa a reproduzir imediatamente o vídeo solicitado. "
                    "Após o término, a fila volta ao fluxo normal.", styles['Body']))

    story.append(Spacer(1, 6))
    story.append(p("4.6. Como Reiniciar a Fila", styles['H2']))
    story.append(p("Clique no botão <b>'Reiniciar'</b> (ícone de refresh). Todos os vídeos serão "
                    "desmarcados como 'tocados' e a reprodução recomeça do primeiro da lista. "
                    "Uma notificação confirma: 'Fila reiniciada'.", styles['Body']))
    story.append(p(
        "<b>DICA:</b> Adicione vários vídeos de conteúdo institucional, propagandas ou programação de TV para "
        "manter os clientes entretidos enquanto aguardam. A fila faz loop automático sem necessidade de intervenção.", styles['Tip']))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════════
    # 5. STACK TECNOLÓGICA
    # ═══════════════════════════════════════════════════════════════════
    story.append(p("5. STACK TECNOLÓGICA E LINGUAGENS", styles['H1']))

    stack_rows = [
        [p("Categoria", styles['TH']), p("Tecnologia", styles['TH']), p("Versão", styles['TH']), p("Função no Sistema", styles['TH'])],
        [p("Linguagem Core", styles['TD']), p("TypeScript", styles['TD']), p("5.8.3", styles['TD']), p("Tipagem estática de ponta a ponta e compilação ES2022", styles['TD'])],
        [p("Framework UI", styles['TD']), p("React", styles['TD']), p("19.2.0", styles['TD']), p("Construção de interfaces declarativas e reativas", styles['TD'])],
        [p("Roteamento / SSR", styles['TD']), p("TanStack Router & Start", styles['TD']), p("1.168.25", styles['TD']), p("Roteamento type-safe com Server-Side Rendering (SSR)", styles['TD'])],
        [p("Cache de Dados", styles['TD']), p("TanStack React Query", styles['TD']), p("5.83.0", styles['TD']), p("Sincronização e cache de dados assíncronos no cliente", styles['TD'])],
        [p("Backend-as-a-Service", styles['TD']), p("Supabase (PostgreSQL)", styles['TD']), p("2.107.0", styles['TD']), p("Banco relacional, autenticação, RLS e WebSocket Realtime", styles['TD'])],
        [p("Estilização", styles['TD']), p("Tailwind CSS v4", styles['TD']), p("4.2.1", styles['TD']), p("Framework CSS utilitário com design responsivo", styles['TD'])],
        [p("Componentes UI", styles['TD']), p("Radix UI + Shadcn", styles['TD']), p("—", styles['TD']), p("Componentes acessíveis: dialogs, selects, tabs, tooltips etc.", styles['TD'])],
        [p("Build Tool", styles['TD']), p("Vite", styles['TD']), p("7.3.1", styles['TD']), p("Bundler ultrarrápido com Hot Module Replacement (HMR)", styles['TD'])],
        [p("Servidor", styles['TD']), p("Nitro Engine", styles['TD']), p("3.0", styles['TD']), p("Servidor backend serverless com suporte a Cloudflare Workers", styles['TD'])],
        [p("Validação", styles['TD']), p("Zod", styles['TD']), p("3.24.2", styles['TD']), p("Validação rigorosa de schemas em tempo de execução", styles['TD'])],
        [p("Ícones", styles['TD']), p("Lucide React", styles['TD']), p("0.575.0", styles['TD']), p("Biblioteca de ícones vetoriais consistentes", styles['TD'])],
        [p("Notificações", styles['TD']), p("Sonner (Toast)", styles['TD']), p("2.0.7", styles['TD']), p("Sistema de notificações de feedback visual (success/error)", styles['TD'])],
        [p("Formulários", styles['TD']), p("React Hook Form + Zod", styles['TD']), p("7.71.2", styles['TD']), p("Gerenciamento performático de formulários com validação", styles['TD'])],
    ]
    story.append(table_standard(stack_rows, [95, 120, 55, 270]))
    story.append(Spacer(1, 10))

    # ═══════════════════════════════════════════════════════════════════
    # 6. MODELAGEM DE DADOS
    # ═══════════════════════════════════════════════════════════════════
    story.append(p("6. MODELAGEM DE DADOS (BANCO DE DADOS)", styles['H1']))
    story.append(p(
        "O sistema utiliza PostgreSQL hospedado no Supabase. Todas as tabelas possuem <b>Realtime Publications</b> "
        "habilitadas e <b>Row Level Security (RLS)</b> ativas.", styles['Body']))

    story.append(p("6.1. Tabela: public.tickets", styles['H2']))
    story.append(p("Armazena todas as senhas chamadas pelo atendente.", styles['Body']))
    t1_rows = [
        [p("Coluna", styles['TH']), p("Tipo", styles['TH']), p("Obrigatório", styles['TH']), p("Descrição", styles['TH'])],
        [p("id", styles['TD']), p("UUID (PK)", styles['TD']), p("Sim (auto)", styles['TD']), p("Identificador único gerado por gen_random_uuid()", styles['TD'])],
        [p("ticket_code", styles['TD']), p("TEXT", styles['TD']), p("Sim", styles['TD']), p("Código ou número da senha chamada (ex: '101', 'P-01')", styles['TD'])],
        [p("counter_number", styles['TD']), p("INTEGER", styles['TD']), p("Sim", styles['TD']), p("Número do guichê/balcão que chamou a senha", styles['TD'])],
        [p("attendant_name", styles['TD']), p("TEXT", styles['TD']), p("Não", styles['TD']), p("Nome do atendente (pode ser nulo)", styles['TD'])],
        [p("called_at", styles['TD']), p("TIMESTAMPTZ", styles['TD']), p("Sim (auto)", styles['TD']), p("Data/hora exata da chamada — default now()", styles['TD'])],
    ]
    story.append(table_standard(t1_rows, [100, 90, 80, 270]))
    story.append(Spacer(1, 8))

    story.append(p("6.2. Tabela: public.playlist_items", styles['H2']))
    story.append(p("Fila de vídeos/mídias exibidos na TV do solicitante.", styles['Body']))
    t2_rows = [
        [p("Coluna", styles['TH']), p("Tipo", styles['TH']), p("Obrigatório", styles['TH']), p("Descrição", styles['TH'])],
        [p("id", styles['TD']), p("UUID (PK)", styles['TD']), p("Sim (auto)", styles['TD']), p("Identificador único do item de mídia", styles['TD'])],
        [p("position", styles['TD']), p("INTEGER", styles['TD']), p("Sim", styles['TD']), p("Ordem de reprodução na fila (1, 2, 3...)", styles['TD'])],
        [p("media_type", styles['TD']), p("TEXT", styles['TD']), p("Sim", styles['TD']), p("Tipo de mídia: 'youtube' ou 'mp4'", styles['TD'])],
        [p("media_url", styles['TD']), p("TEXT", styles['TD']), p("Sim", styles['TD']), p("ID do YouTube (11 chars) ou URL direta do vídeo", styles['TD'])],
        [p("played_at", styles['TD']), p("TIMESTAMPTZ", styles['TD']), p("Não", styles['TD']), p("Timestamp de quando foi tocado (null = pendente)", styles['TD'])],
        [p("created_at", styles['TD']), p("TIMESTAMPTZ", styles['TD']), p("Sim (auto)", styles['TD']), p("Data/hora de criação do registro", styles['TD'])],
    ]
    story.append(table_standard(t2_rows, [100, 90, 80, 270]))
    story.append(Spacer(1, 8))

    story.append(p("6.3. Tabela: public.display_settings", styles['H2']))
    story.append(p("Configurações globais da exibição da TV (tabela singleton — apenas 1 registro).", styles['Body']))
    t3_rows = [
        [p("Coluna", styles['TH']), p("Tipo", styles['TH']), p("Obrigatório", styles['TH']), p("Descrição", styles['TH'])],
        [p("id", styles['TD']), p("INT (PK)", styles['TD']), p("Sim (fixo=1)", styles['TD']), p("Sempre 1 — constraint singleton", styles['TD'])],
        [p("media_type", styles['TD']), p("TEXT", styles['TD']), p("Sim", styles['TD']), p("Tipo de mídia padrão ('youtube')", styles['TD'])],
        [p("media_url", styles['TD']), p("TEXT", styles['TD']), p("Sim", styles['TD']), p("URL ou ID de mídia padrão", styles['TD'])],
        [p("repeat_item_id", styles['TD']), p("UUID", styles['TD']), p("Não", styles['TD']), p("ID do item da playlist solicitado para repetição", styles['TD'])],
        [p("repeat_requested_at", styles['TD']), p("TIMESTAMPTZ", styles['TD']), p("Não", styles['TD']), p("Timestamp da solicitação de repetição", styles['TD'])],
        [p("updated_at", styles['TD']), p("TIMESTAMPTZ", styles['TD']), p("Sim (auto)", styles['TD']), p("Timestamp da última atualização", styles['TD'])],
    ]
    story.append(table_standard(t3_rows, [105, 85, 80, 270]))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════════
    # 7. COMUNICAÇÃO EM TEMPO REAL
    # ═══════════════════════════════════════════════════════════════════
    story.append(p("7. COMUNICAÇÃO EM TEMPO REAL (REALTIME)", styles['H1']))
    story.append(p(
        "O sistema utiliza o <b>Supabase Realtime</b>, que funciona sobre WebSockets PostgreSQL. "
        "Cada tabela do banco possui Realtime Publication habilitada, permitindo que os clientes "
        "(navegadores) recebam notificações instantâneas quando dados mudam.", styles['Body']))

    story.append(p("7.1. Canais de Subscrição Ativos", styles['H2']))
    ch_rows = [
        [p("Canal", styles['TH']), p("Tabela Monitorada", styles['TH']), p("Eventos", styles['TH']), p("Usado Em", styles['TH'])],
        [p("tickets-realtime", styles['TD']), p("public.tickets", styles['TD']), p("INSERT", styles['TD']), p("Ambos os painéis — atualiza lista de senhas", styles['TD'])],
        [p("playlist_items_changes", styles['TD']), p("public.playlist_items", styles['TD']), p("* (todos)", styles['TD']), p("Ambos os painéis — atualiza fila de vídeos", styles['TD'])],
        [p("display_settings_changes", styles['TD']), p("public.display_settings", styles['TD']), p("* (todos)", styles['TD']), p("Painel Solicitante — detecta pedidos de repetição", styles['TD'])],
    ]
    story.append(table_standard(ch_rows, [130, 120, 70, 220]))
    story.append(Spacer(1, 6))
    story.append(p(
        "Quando o atendente clica em 'CHAMAR PRÓXIMA SENHA', um INSERT é feito na tabela tickets. "
        "O WebSocket propaga a mudança em &lt;100ms para a TV do solicitante, que então dispara o beep e o Flash Glow.", styles['Body']))

    # ═══════════════════════════════════════════════════════════════════
    # 8. SISTEMA DE ÁUDIO E ANIMAÇÕES
    # ═══════════════════════════════════════════════════════════════════
    story.append(p("8. SISTEMA DE ÁUDIO E ANIMAÇÕES VISUAIS", styles['H1']))

    story.append(p("8.1. Alerta Sonoro (Web Audio API)", styles['H2']))
    story.append(p(
        "Quando uma nova senha é chamada, o Painel do Solicitante dispara <b>dois beeps curtos</b> usando "
        "síntese de áudio nativa do navegador (Web Audio API). Detalhes técnicos:", styles['Body']))
    story.append(p("• <b>Tipo de onda:</b> Senoidal (sine wave) — tom limpo e audível.", styles['BulletItem']))
    story.append(p("• <b>Frequência:</b> 880 Hz (nota A5 — aguda e penetrante).", styles['BulletItem']))
    story.append(p("• <b>Padrão:</b> 2 beeps com intervalo de 250ms entre eles.", styles['BulletItem']))
    story.append(p("• <b>Envelope:</b> Ataque rápido (20ms), sustain curto, decay exponencial (200ms).", styles['BulletItem']))
    story.append(p("• <b>Vantagem:</b> Não depende de arquivos de áudio externos. Funciona offline e é extremamente leve.", styles['BulletItem']))

    story.append(Spacer(1, 6))
    story.append(p("8.2. Animação Flash Glow (CSS)", styles['H2']))
    story.append(p(
        "Quando a senha é chamada, o cartão 'SENHA ATUAL' no painel do solicitante recebe a classe CSS "
        "<b>flash-glow</b>, que executa uma animação de 0.8s repetida 4 vezes (total ~3.2s):", styles['Body']))
    story.append(p("• <b>Efeito:</b> Sombra luminosa azul intensa pulsando ao redor do cartão.", styles['BulletItem']))
    story.append(p("• <b>Escala:</b> O cartão aumenta sutilmente para 1.03x no pico da animação.", styles['BulletItem']))
    story.append(p("• <b>Box-shadow pico:</b> 0 0 80px 10px rgba(96,165,250,0.9) — cria um brilho azul intenso visível mesmo em TVs grandes.", styles['BulletItem']))

    # ═══════════════════════════════════════════════════════════════════
    # 9. SEGURANÇA
    # ═══════════════════════════════════════════════════════════════════
    story.append(p("9. SEGURANÇA E PROTEÇÃO DE DADOS", styles['H1']))
    story.append(p("• <b>Row Level Security (RLS):</b> Todas as tabelas possuem políticas de segurança ativas. "
                    "As tabelas permitem leitura pública (SELECT) e escrita controlada (INSERT/UPDATE).", styles['BulletItem']))
    story.append(p("• <b>Realtime com REPLICA IDENTITY FULL:</b> A tabela tickets usa REPLICA IDENTITY FULL, "
                    "garantindo que o Realtime propague todos os campos em cada evento.", styles['BulletItem']))
    story.append(p("• <b>Variáveis de Ambiente (.env):</b> Chaves de API e URLs do Supabase são consumidas exclusivamente "
                    "via variáveis de ambiente. Nenhuma credencial está hardcoded no código-fonte.", styles['BulletItem']))
    story.append(p("• <b>Proteção Git (.gitignore):</b> O arquivo .env está no .gitignore e <b>nunca</b> é enviado ao repositório GitHub. "
                    "Um arquivo .env.example é fornecido como modelo seguro.", styles['BulletItem']))
    story.append(p("• <b>Publishable Key Only:</b> O cliente web utiliza apenas a chave <i>anon/publishable</i> do Supabase, "
                    "que tem permissões limitadas pelas políticas RLS. A chave secreta (service_role) é usada apenas no servidor.", styles['BulletItem']))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════════
    # 10. ESTRUTURA DE ARQUIVOS
    # ═══════════════════════════════════════════════════════════════════
    story.append(p("10. ESTRUTURA DE ARQUIVOS DO PROJETO", styles['H1']))
    tree = (
        "guinche-main/\n"
        "├── .env                       # Variáveis de ambiente (NÃO commitado)\n"
        "├── .env.example               # Modelo seguro de variáveis\n"
        "├── .gitignore                 # Regras de exclusão do Git\n"
        "├── package.json               # Dependências e scripts npm/bun\n"
        "├── vite.config.ts             # Configuração do Vite + TanStack Start\n"
        "├── tsconfig.json              # Configuração TypeScript\n"
        "├── supabase/\n"
        "│   ├── config.toml            # ID do projeto Supabase\n"
        "│   └── migrations/            # Scripts SQL de criação de tabelas e RLS\n"
        "│       ├── ...tickets.sql     # Tabela de senhas\n"
        "│       ├── ...display.sql     # Tabela de configurações da TV\n"
        "│       ├── ...playlist.sql    # Tabela de itens da playlist\n"
        "│       └── ...repeat.sql      # Campos de repetição\n"
        "└── src/\n"
        "    ├── routes/\n"
        "    │   ├── __root.tsx         # Shell principal, metadados, NotFound, Error\n"
        "    │   ├── index.tsx          # Tela inicial (seleção de painel)\n"
        "    │   ├── atendente.tsx      # Painel de controle do atendente\n"
        "    │   └── solicitante.tsx    # Painel público TV (senhas + vídeos)\n"
        "    ├── lib/\n"
        "    │   ├── tickets.ts         # Serviços: busca, inserção e subscrição de senhas\n"
        "    │   ├── display.ts         # Serviços: playlist, repetição e detecção de URL\n"
        "    │   ├── error-capture.ts   # Captura de erros SSR\n"
        "    │   └── error-page.ts      # Página de erro HTML estática\n"
        "    ├── integrations/supabase/\n"
        "    │   ├── client.ts          # Cliente Supabase browser (lazy proxy)\n"
        "    │   ├── client.server.ts   # Cliente Supabase servidor (service role)\n"
        "    │   ├── auth-middleware.ts  # Middleware de autenticação JWT\n"
        "    │   └── types.ts           # Tipos gerados do banco de dados\n"
        "    ├── components/ui/         # 35+ componentes Radix/Shadcn acessíveis\n"
        "    ├── styles.css             # Estilos globais + animação Flash Glow\n"
        "    ├── router.tsx             # Instanciação do TanStack Router\n"
        "    ├── server.ts              # Entrada do servidor SSR Nitro\n"
        "    └── start.ts               # Bootstrap da aplicação"
    )
    story.append(p(tree, styles['CodeBox']))

    # ═══════════════════════════════════════════════════════════════════
    # 11. CONFIGURAÇÃO DO AMBIENTE
    # ═══════════════════════════════════════════════════════════════════
    story.append(p("11. CONFIGURAÇÃO DO AMBIENTE DE DESENVOLVIMENTO", styles['H1']))
    story.append(p("11.1. Pré-requisitos", styles['H2']))
    story.append(p("• Node.js 20+ ou Bun 1.x instalado.", styles['BulletItem']))
    story.append(p("• Conta no Supabase com um projeto ativo.", styles['BulletItem']))
    story.append(p("• Git para controle de versão.", styles['BulletItem']))

    story.append(p("11.2. Passos de Instalação", styles['H2']))
    story.append(p("Passo 1 —", styles['StepNum']))
    story.append(p("Clone o repositório: git clone https://github.com/Conatus-cm/gerenciadordesenhas.git", styles['StepBody']))
    story.append(p("Passo 2 —", styles['StepNum']))
    story.append(p("Copie o .env.example para .env e preencha com as credenciais do seu projeto Supabase.", styles['StepBody']))
    story.append(p("Passo 3 —", styles['StepNum']))
    story.append(p("Instale as dependências: bun install (ou npm install).", styles['StepBody']))
    story.append(p("Passo 4 —", styles['StepNum']))
    story.append(p("Execute as migrations SQL no painel do Supabase (SQL Editor) para criar as tabelas.", styles['StepBody']))
    story.append(p("Passo 5 —", styles['StepNum']))
    story.append(p("Inicie o servidor de desenvolvimento: bun run dev (ou npm run dev).", styles['StepBody']))
    story.append(p("Passo 6 —", styles['StepNum']))
    story.append(p("Acesse http://localhost:5173 no navegador.", styles['StepBody']))

    story.append(p("11.3. Variáveis de Ambiente Necessárias (.env)", styles['H2']))
    env_rows = [
        [p("Variável", styles['TH']), p("Descrição", styles['TH']), p("Exemplo", styles['TH'])],
        [p("VITE_SUPABASE_URL", styles['TD']), p("URL do projeto Supabase", styles['TD']), p("https://xxx.supabase.co", styles['TD'])],
        [p("VITE_SUPABASE_PUBLISHABLE_KEY", styles['TD']), p("Chave anon/pública do Supabase", styles['TD']), p("sb_publishable_xxx...", styles['TD'])],
        [p("SUPABASE_URL", styles['TD']), p("Mesma URL (para SSR)", styles['TD']), p("https://xxx.supabase.co", styles['TD'])],
        [p("SUPABASE_PUBLISHABLE_KEY", styles['TD']), p("Mesma chave (para SSR)", styles['TD']), p("sb_publishable_xxx...", styles['TD'])],
        [p("SUPABASE_PROJECT_ID", styles['TD']), p("ID do projeto (referência)", styles['TD']), p("seu_project_id", styles['TD'])],
    ]
    story.append(table_standard(env_rows, [175, 190, 175]))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════════
    # 12. GLOSSÁRIO
    # ═══════════════════════════════════════════════════════════════════
    story.append(p("12. GLOSSÁRIO DE TERMOS TÉCNICOS", styles['H1']))
    gloss_rows = [
        [p("Termo", styles['TH']), p("Definição", styles['TH'])],
        [p("SSR", styles['TD']), p("Server-Side Rendering — renderização da página no servidor antes de enviar ao navegador", styles['TD'])],
        [p("WebSocket", styles['TD']), p("Protocolo de comunicação bidirecional e persistente entre cliente e servidor", styles['TD'])],
        [p("Realtime", styles['TD']), p("Funcionalidade do Supabase que propaga mudanças no banco para clientes conectados via WebSocket", styles['TD'])],
        [p("RLS", styles['TD']), p("Row Level Security — políticas de segurança por linha no PostgreSQL", styles['TD'])],
        [p("localStorage", styles['TD']), p("Armazenamento local do navegador que persiste dados entre sessões (guichê, nome, próxima senha)", styles['TD'])],
        [p("Web Audio API", styles['TD']), p("API nativa dos navegadores para sintetizar e reproduzir sons sem arquivos externos", styles['TD'])],
        [p("Flash Glow", styles['TD']), p("Animação CSS customizada que cria efeito de brilho pulsante no cartão de senha chamada", styles['TD'])],
        [p("Toast", styles['TD']), p("Notificação breve e temporária exibida na tela para confirmar ações (sucesso ou erro)", styles['TD'])],
        [p("TypeScript", styles['TD']), p("Superset tipado do JavaScript que adiciona segurança de tipos em tempo de compilação", styles['TD'])],
        [p("Vite", styles['TD']), p("Ferramenta de build ultrarrápida para projetos web modernos com HMR instantâneo", styles['TD'])],
        [p("Tailwind CSS", styles['TD']), p("Framework CSS utilitário que permite estilizar elementos diretamente nas classes HTML", styles['TD'])],
        [p("Radix UI", styles['TD']), p("Biblioteca de componentes UI acessíveis e sem estilo pré-definido para React", styles['TD'])],
        [p("Singleton", styles['TD']), p("Padrão onde uma tabela permite apenas 1 registro (usado em display_settings)", styles['TD'])],
        [p("Anon Key", styles['TD']), p("Chave pública do Supabase com permissões limitadas pelas políticas RLS", styles['TD'])],
    ]
    story.append(table_standard(gloss_rows, [100, 440]))

    # Build
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF gerado com sucesso: {filename}")


if __name__ == "__main__":
    generate_pdf()
