CREATE TABLE public.playlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position INT NOT NULL,
  media_type TEXT NOT NULL,
  media_url TEXT NOT NULL,
  played_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.playlist_items TO anon, authenticated;
GRANT ALL ON public.playlist_items TO service_role;

ALTER TABLE public.playlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view playlist" ON public.playlist_items FOR SELECT USING (true);
CREATE POLICY "Anyone can insert playlist" ON public.playlist_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update playlist" ON public.playlist_items FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete playlist" ON public.playlist_items FOR DELETE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.playlist_items;