-- Create awareness_campaigns table
CREATE TABLE IF NOT EXISTS public.awareness_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER NOT NULL,
  duration_unit TEXT NOT NULL CHECK (duration_unit IN ('hours', 'days', 'weeks', 'months')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.awareness_campaigns ENABLE ROW LEVEL SECURITY;

-- Create policies for awareness_campaigns
CREATE POLICY "Enable read access for all users"
  ON public.awareness_campaigns
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for admins only"
  ON public.awareness_campaigns
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Enable update for admins only"
  ON public.awareness_campaigns
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at column
CREATE TRIGGER update_awareness_campaigns_updated_at
BEFORE UPDATE ON public.awareness_campaigns
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE public.awareness_campaigns IS 'Stores information about awareness campaigns';
COMMENT ON COLUMN public.awareness_campaigns.title IS 'The main title of the campaign';
COMMENT ON COLUMN public.awareness_campaigns.subtitle IS 'A brief description or subtitle for the campaign';
COMMENT ON COLUMN public.awareness_campaigns.image_url IS 'URL to the campaign image';
COMMENT ON COLUMN public.awareness_campaigns.scheduled_date IS 'When the campaign is scheduled to start';
COMMENT ON COLUMN public.awareness_campaigns.duration IS 'Duration of the campaign';
COMMENT ON COLUMN public.awareness_campaigns.duration_unit IS 'Unit of the duration (hours, days, weeks, months)';
COMMENT ON COLUMN public.awareness_campaigns.status IS 'Current status of the campaign';

-- Create index for better query performance
CREATE INDEX idx_awareness_campaigns_status ON public.awareness_campaigns(status);
CREATE INDEX idx_awareness_campaigns_scheduled_date ON public.awareness_campaigns(scheduled_date);