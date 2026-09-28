-- O ranking do jogo "Seu dinheiro no tempo" (frontend/js/ranking.js).
-- Rode uma vez no SQL Editor do Supabase (o mesmo projeto do login e do
-- Fluxo de Caixa). Não mexe em nenhuma tabela que já existe.
--
-- Uma linha por aluno, por jogo e por código de turma, com o nome que ele
-- cadastrou no login (player_name), os pontos de cada categoria (scores) e
-- a escolha de cada rodada (picks). Jogando de novo com o mesmo código, a
-- linha é atualizada.
--
-- Quem está logado lê todas as linhas (é o que monta o ranking), mas só
-- grava, muda e apaga as próprias.

create table if not exists public.game_scores (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  game text not null,
  class_code text not null default '' check (char_length(class_code) <= 20),
  player_name text not null check (char_length(player_name) between 1 and 80),
  scores jsonb not null default '{}'::jsonb,
  picks jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, game, class_code)
);

create index if not exists game_scores_game_class on public.game_scores (game, class_code);

alter table public.game_scores enable row level security;

create policy "game_scores_select_logged" on public.game_scores
  for select to authenticated using (true);
create policy "game_scores_insert_own" on public.game_scores
  for insert to authenticated with check (auth.uid() = user_id);
create policy "game_scores_update_own" on public.game_scores
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "game_scores_delete_own" on public.game_scores
  for delete to authenticated using (auth.uid() = user_id);
