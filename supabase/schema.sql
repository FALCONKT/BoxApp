-- 宝石BoxHunter: ユーザーごとの累計スコア・宝石取得数テーブル
-- Supabaseダッシュボード（SQL Editor）で実行してください。

create table if not exists public.user_stats (
  user_id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  total_score integer not null default 0,
  diamond_count integer not null default 0,
  ruby_count integer not null default 0,
  sapphire_count integer not null default 0,
  topaz_count integer not null default 0,
  updated_at timestamptz not null default now()
);

comment on table public.user_stats is
  '宝石BoxHunter: ユーザーごとの累計スコア・宝石取得数（宝箱を開けるたびに更新される）';
comment on column public.user_stats.username is
  '表示用のユーザー名（Supabase Authのメールアドレス）。auth.usersはクライアントから直接SELECTできないため冗長に保持する';

-- RLS（行単位セキュリティ）を有効化
alter table public.user_stats enable row level security;

-- 閲覧：ランキング表示のため、ログイン済みユーザーは全員分のレコードを閲覧可能にする
create policy "user_stats_select_all_authenticated"
  on public.user_stats
  for select
  to authenticated
  using (true);

-- 追加：自分自身のレコードのみ新規作成できる（宝箱を初めて開けたとき）
create policy "user_stats_insert_own"
  on public.user_stats
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- 更新：自分自身のレコードのみ更新できる（宝箱を2回目以降開けたとき）
create policy "user_stats_update_own"
  on public.user_stats
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 削除：自分自身のレコードのみ削除できる（「履歴を削除」ボタン）
create policy "user_stats_delete_own"
  on public.user_stats
  for delete
  to authenticated
  using (auth.uid() = user_id);
