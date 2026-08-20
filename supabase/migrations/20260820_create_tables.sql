-- Script SQL para criação das tabelas no Supabase (Execute no SQL Editor do Supabase)

-- 1. Tabela de playlist de vídeos da TV
CREATE TABLE IF NOT EXISTS public.playlist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  position INT NOT NULL DEFAULT 1,
  media_type TEXT NOT NULL,
  media_url TEXT NOT NULL,
  played_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de configurações da tela pública
CREATE TABLE IF NOT EXISTS public.display_settings (
  id INT PRIMARY KEY DEFAULT 1,
  media_type TEXT DEFAULT 'youtube',
  media_url TEXT DEFAULT '',
  repeat_item_id TEXT,
  repeat_requested_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de histórico de senhas chamadas
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_code TEXT NOT NULL,
  counter_number INT NOT NULL DEFAULT 1,
  attendant_name TEXT,
  called_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de fila de espera do Totem
CREATE TABLE IF NOT EXISTS public.ticket_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_code TEXT NOT NULL,
  is_priority BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'waiting',
  called_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de pesquisas de satisfação
CREATE TABLE IF NOT EXISTS public.evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_code TEXT,
  counter_number INT,
  attendant_name TEXT,
  rating INT NOT NULL,
  rating_label TEXT NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar public access/RLS permissivo para a aplicação
ALTER TABLE public.playlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.display_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all public playlist_items" ON public.playlist_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public display_settings" ON public.display_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public tickets" ON public.tickets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public ticket_queue" ON public.ticket_queue FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public evaluations" ON public.evaluations FOR ALL USING (true) WITH CHECK (true);
