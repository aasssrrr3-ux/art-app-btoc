-- Add reactions column to process_logs
alter table public.process_logs 
add column if not exists reactions jsonb default '{}'::jsonb;

-- Create RPC function to atomic increment reaction count
create or replace function public.increment_reaction(log_id uuid, reaction_type text)
returns void
language plpgsql
security definer
as $$
begin
  update public.process_logs
  set reactions = jsonb_set(
    coalesce(reactions, '{}'::jsonb),
    array[reaction_type],
    (coalesce(reactions->>reaction_type, '0')::int + 1)::text::jsonb
  )
  where id = log_id;
end;
$$;
