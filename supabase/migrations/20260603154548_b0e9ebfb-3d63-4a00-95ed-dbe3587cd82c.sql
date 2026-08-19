ALTER TABLE public.display_settings
  ADD COLUMN IF NOT EXISTS repeat_item_id UUID,
  ADD COLUMN IF NOT EXISTS repeat_requested_at TIMESTAMPTZ;