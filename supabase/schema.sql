-- 실제 Supabase 테이블 정의 (이미 생성되어 있다면 RLS만 적용)

-- create table public.pools (
--   name_ko text not null,
--   roadaddress text not null,
--   lat double precision not null,
--   lng double precision not null,
--   fee text null,
--   official_url text null,
--   url2 text null,
--   is_50m bigint null,
--   constraint pool_info_pkey primary key (name_ko, roadaddress, lat, lng)
-- );

alter table public.pools enable row level security;

drop policy if exists "pools_select_anon" on public.pools;
create policy "pools_select_anon"
  on public.pools
  for select
  to anon, authenticated
  using (true);

-- 수영장 요일별 운영시간. 데이터가 있는 pool만 행이 존재 — 없는 pool은 unknown으로 취급된다.
create table if not exists public.pool_operating_hours (
  pool_id uuid not null references public.pools (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0=일 … 6=토
  open_time time null,
  close_time time null,
  closed boolean not null default false,
  constraint pool_operating_hours_pkey primary key (pool_id, day_of_week)
);

alter table public.pool_operating_hours enable row level security;

drop policy if exists "pool_operating_hours_select_anon" on public.pool_operating_hours;
create policy "pool_operating_hours_select_anon"
  on public.pool_operating_hours
  for select
  to anon, authenticated
  using (true);

-- 영천 2곳(종합스포츠센터·국민체육센터) 운영시간 시드:
-- 평일 06:00~21:00, 토요일 06:00~19:00, 일요일 휴관.
insert into public.pool_operating_hours (pool_id, day_of_week, open_time, close_time, closed)
select p.id, sched.day_of_week, sched.open_time, sched.close_time, sched.closed
from public.pools p
cross join (
  values
    (0, null::time, null::time, true),
    (1, '06:00'::time, '21:00'::time, false),
    (2, '06:00'::time, '21:00'::time, false),
    (3, '06:00'::time, '21:00'::time, false),
    (4, '06:00'::time, '21:00'::time, false),
    (5, '06:00'::time, '21:00'::time, false),
    (6, '06:00'::time, '19:00'::time, false)
) as sched(day_of_week, open_time, close_time, closed)
where p.roadaddress like '%영천시%'
on conflict (pool_id, day_of_week) do nothing;

-- Storage: public bucket `pool-images`
-- 파일명 규칙: `{pools.id}.{jpg|jpeg|png|webp}`
-- 대표 이미지 URL은 supabase.storage.from('pool-images').getPublicUrl(...) 로 조회
