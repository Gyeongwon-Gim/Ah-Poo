-- 실제 Supabase 테이블 정의 (이미 생성되어 있다면 RLS만 적용)

-- create table public.pools (
--   name_ko text not null,
--   address text not null,
--   lat double precision not null,
--   lng double precision not null,
--   fee text null,
--   official_url text null,
--   url2 text null,
--   is_50m bigint null,
--   is_weekday bigint null,
--   is_saturday bigint null,
--   is_sunday bigint null,
--   is_holiday bigint null,
--   constraint pool_info_pkey primary key (name_ko, address, lat, lng)
-- );

alter table public.pools enable row level security;

drop policy if exists "pools_select_anon" on public.pools;
create policy "pools_select_anon"
  on public.pools
  for select
  to anon, authenticated
  using (true);
