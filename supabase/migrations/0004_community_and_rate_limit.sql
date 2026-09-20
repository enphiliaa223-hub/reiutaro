-- ============================================================================
-- REIUTAROU — 0004_community_and_rate_limit (Phase 7)
-- 1) RPC rate limiting atomik (server-only, pakai service role)
-- 2) Seed kategori forum/community
-- ============================================================================

-- ----------------------------------------------------------------------------
-- RPC: bump_rate_limit — atomic increment per key dengan window.
-- Return true jika masih dalam batas (count <= limit).
-- Di-invoke HANYA dari server (lib/rate-limit.ts, client service role).
-- security definer → bypass RLS (tabel rate_limits tidak boleh ditulis publik).
-- ----------------------------------------------------------------------------
create or replace function app.bump_rate_limit(
  p_key text,
  p_limit int,
  p_window_seconds int
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  if p_window_seconds <= 0 or p_limit <= 0 then
    return true;
  end if;

  insert into rate_limits (key, count, window_start)
  values (p_key, 1, now())
  on conflict (key) do update set
    count = case
      when rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
        then 1
      else rate_limits.count + 1
    end,
    window_start = case
      when rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
        then now()
      else rate_limits.window_start
    end
  returning count into v_count;

  return coalesce(v_count, 0) <= p_limit;
end;
$$;

-- Hanya service role (dari server) yang boleh memanggil.
grant execute on function app.bump_rate_limit(text, int, int) to service_role;

-- ----------------------------------------------------------------------------
-- Seed kategori forum & community feed
-- ----------------------------------------------------------------------------
insert into public.categories (name, slug, type, sort_order) values
  ('General',    'general',    'forum',     1),
  ('News',       'news',       'forum',     2),
  ('Discussion', 'discussion', 'forum',     3),
  ('Help',       'help',       'forum',     4),
  ('Fan Works',  'fan-works',  'community', 5),
  ('Clips',      'clips',      'community', 6),
  ('Events',     'events',     'community', 7)
on conflict (slug) do nothing;