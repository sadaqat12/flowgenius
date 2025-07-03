ALTER TABLE public.service_calls
ADD COLUMN ai_analysis_result JSONB,
ADD COLUMN likely_problem TEXT,
ADD COLUMN suggested_parts TEXT[]; 