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

--------------------------------------------------------------------------------
-- 사용자 리뷰 (방문자 리뷰)
--------------------------------------------------------------------------------

create table if not exists public.user_reviews (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references public.pools(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_reviews_unique_per_pool unique (pool_id, user_id)
);

create index if not exists idx_user_reviews_pool_id on public.user_reviews(pool_id);
create index if not exists idx_user_reviews_user_id on public.user_reviews(user_id);

alter table public.user_reviews enable row level security;

-- 읽기: 모든 사용자 허용
drop policy if exists "user_reviews_select_all" on public.user_reviews;
create policy "user_reviews_select_all"
  on public.user_reviews
  for select
  to anon, authenticated
  using (true);

-- 삽입: 인증된 사용자만, 본인 user_id로만
drop policy if exists "user_reviews_insert_own" on public.user_reviews;
create policy "user_reviews_insert_own"
  on public.user_reviews
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- 수정: 본인 리뷰만
drop policy if exists "user_reviews_update_own" on public.user_reviews;
create policy "user_reviews_update_own"
  on public.user_reviews
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 삭제: 본인 리뷰만
drop policy if exists "user_reviews_delete_own" on public.user_reviews;
create policy "user_reviews_delete_own"
  on public.user_reviews
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- updated_at 자동 갱신 트리거
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists user_reviews_updated_at on public.user_reviews;
create trigger user_reviews_updated_at
  before update on public.user_reviews
  for each row
  execute function public.update_updated_at_column();

--------------------------------------------------------------------------------
-- 리뷰 이미지 (리뷰당 최대 3장)
--------------------------------------------------------------------------------

create table if not exists public.review_images (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.user_reviews(id) on delete cascade,
  image_path text not null,
  display_order smallint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_review_images_review_id on public.review_images(review_id);

alter table public.review_images enable row level security;

-- 읽기: 모든 사용자 허용
drop policy if exists "review_images_select_all" on public.review_images;
create policy "review_images_select_all"
  on public.review_images
  for select
  to anon, authenticated
  using (true);

-- 삽입: 본인 리뷰의 이미지만
drop policy if exists "review_images_insert_own" on public.review_images;
create policy "review_images_insert_own"
  on public.review_images
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.user_reviews r
      where r.id = review_id and r.user_id = auth.uid()
    )
  );

-- 삭제: 본인 리뷰의 이미지만
drop policy if exists "review_images_delete_own" on public.review_images;
create policy "review_images_delete_own"
  on public.review_images
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.user_reviews r
      where r.id = review_id and r.user_id = auth.uid()
    )
  );

-- Storage: public bucket `review-images`
-- 파일명 규칙: `{user_id}/{review_id}/{uuid}.{jpg|jpeg|png|webp}`
-- 이미지 URL은 supabase.storage.from('review-images').getPublicUrl(...) 로 조회
