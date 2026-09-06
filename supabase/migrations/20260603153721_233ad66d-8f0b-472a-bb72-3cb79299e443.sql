CREATE TABLE public.display_settings (
  id INT PRIMARY KEY DEFAULT 1,
  media_type TEXT NOT NULL DEFAULT 'youtube',
  media_url TEXT NOT NULL DEFAULT '5qap5aO4i9A',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT singleton CHECK (id = 1)
);

GRANT SELECT, INSERT, UPDATE ON public.display_settings TO anon, authenticated;
GRANT ALL ON public.display_settings TO service_role;

ALTER TABLE public.display_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view display settings" ON public.display_settings FOR SELECT USING (true);
CREATE POLICY "Anyone can insert display settings" ON public.display_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update display settings" ON public.display_settings FOR UPDATE USING (true) WITH CHECK (true);

INSERT INTO public.display_settings (id, media_type, media_url) VALUES (1, 'youtube', '5qap5aO4i9A')
ON CONFLICT (id) DO NOTHING;

ALTER PUBLICATION supabase_realtime ADD TABLE public.display_settings;