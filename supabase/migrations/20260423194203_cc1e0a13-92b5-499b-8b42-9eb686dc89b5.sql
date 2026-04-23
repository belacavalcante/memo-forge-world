
-- ============= ENUMS =============
create type public.app_role as enum ('admin', 'moderator', 'user');
create type public.difficulty as enum ('easy', 'medium', 'hard');
create type public.source_type as enum ('manual', 'pdf', 'text', 'youtube', 'audio');

-- ============= UTIL: updated_at trigger =============
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============= PROFILES =============
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text,
  username text unique,
  avatar_url text,
  bio text,
  xp integer not null default 0,
  level integer not null default 1,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_activity_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = user_id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = user_id);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at_column();

-- ============= USER ROLES =============
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null default 'user',
  unique (user_id, role)
);
alter table public.user_roles enable row level security;
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create policy "roles_select_own" on public.user_roles for select using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "roles_admin_manage" on public.user_roles for all using (public.has_role(auth.uid(), 'admin'));

-- ============= AUTO PROFILE ON SIGNUP =============
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============= SUBJECTS (matérias / pastas) =============
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  color text default 'hsl(220 90% 56%)',
  icon text default 'BookOpen',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.subjects enable row level security;
create policy "subjects_owner_all" on public.subjects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger subjects_updated_at before update on public.subjects
  for each row execute function public.update_updated_at_column();

-- ============= DECKS (decks de flashcards dentro de matérias) =============
create table public.decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  name text not null,
  description text,
  source source_type not null default 'manual',
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.decks enable row level security;
create policy "decks_owner_all" on public.decks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger decks_updated_at before update on public.decks
  for each row execute function public.update_updated_at_column();

-- ============= FLASHCARDS (com SRS leve baseado em SM-2) =============
create table public.flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  deck_id uuid not null references public.decks(id) on delete cascade,
  front text not null,
  back text not null,
  -- SRS
  ease_factor numeric not null default 2.5,
  interval_days integer not null default 0,
  repetitions integer not null default 0,
  due_at timestamptz not null default now(),
  last_difficulty difficulty,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.flashcards enable row level security;
create policy "flashcards_owner_all" on public.flashcards for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index idx_flashcards_due on public.flashcards(user_id, due_at);
create trigger flashcards_updated_at before update on public.flashcards
  for each row execute function public.update_updated_at_column();

-- ============= REVIEWS (histórico de revisões) =============
create table public.flashcard_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  flashcard_id uuid not null references public.flashcards(id) on delete cascade,
  difficulty difficulty not null,
  reviewed_at timestamptz not null default now()
);
alter table public.flashcard_reviews enable row level security;
create policy "reviews_owner_all" on public.flashcard_reviews for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index idx_reviews_user_date on public.flashcard_reviews(user_id, reviewed_at);

-- ============= SUMMARIES (resumos gerados por IA ou manualmente) =============
create table public.summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null,
  content text not null,
  source source_type not null default 'manual',
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.summaries enable row level security;
create policy "summaries_owner_all" on public.summaries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger summaries_updated_at before update on public.summaries
  for each row execute function public.update_updated_at_column();

-- ============= QUIZZES =============
create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null,
  questions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.quizzes enable row level security;
create policy "quizzes_owner_all" on public.quizzes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  score integer not null default 0,
  total integer not null default 0,
  answers jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.quiz_attempts enable row level security;
create policy "quiz_attempts_owner_all" on public.quiz_attempts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============= STUDY GROUPS (grupos públicos) =============
create table public.study_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  cover_color text default 'hsl(220 90% 56%)',
  is_public boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.study_groups enable row level security;
create policy "groups_select_public" on public.study_groups for select using (is_public = true or created_by = auth.uid());
create policy "groups_insert_auth" on public.study_groups for insert with check (auth.uid() is not null);
create policy "groups_update_creator" on public.study_groups for update using (created_by = auth.uid() or public.has_role(auth.uid(), 'admin'));

create table public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);
alter table public.group_members enable row level security;
create policy "members_select_all" on public.group_members for select using (true);
create policy "members_join_self" on public.group_members for insert with check (auth.uid() = user_id);
create policy "members_leave_self" on public.group_members for delete using (auth.uid() = user_id);

-- ============= GROUP POSTS =============
create table public.group_posts (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);
alter table public.group_posts enable row level security;
create policy "posts_select_public" on public.group_posts for select using (
  exists (select 1 from public.study_groups g where g.id = group_id and g.is_public = true)
);
create policy "posts_insert_member" on public.group_posts for insert with check (
  auth.uid() = user_id and exists (
    select 1 from public.group_members m where m.group_id = group_posts.group_id and m.user_id = auth.uid()
  )
);
create policy "posts_delete_own" on public.group_posts for delete using (auth.uid() = user_id);

create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.group_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);
alter table public.post_comments enable row level security;
create policy "comments_select_all" on public.post_comments for select using (true);
create policy "comments_insert_self" on public.post_comments for insert with check (auth.uid() = user_id);
create policy "comments_delete_own" on public.post_comments for delete using (auth.uid() = user_id);

-- ============= STUDY PLANS / GOALS =============
create table public.study_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  daily_cards_goal integer not null default 20,
  daily_minutes_goal integer not null default 30,
  monthly_cards_goal integer not null default 600,
  ai_plan jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.study_plans enable row level security;
create policy "plans_owner_all" on public.study_plans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger plans_updated_at before update on public.study_plans
  for each row execute function public.update_updated_at_column();

-- ============= AI CHAT =============
create table public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Nova conversa',
  created_at timestamptz not null default now()
);
alter table public.chat_conversations enable row level security;
create policy "convs_owner_all" on public.chat_conversations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  created_at timestamptz not null default now()
);
alter table public.chat_messages enable row level security;
create policy "msgs_owner_all" on public.chat_messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============= XP / Activity log =============
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_type text not null,
  xp_awarded integer not null default 0,
  metadata jsonb,
  created_at timestamptz not null default now()
);
alter table public.activity_log enable row level security;
create policy "activity_owner_all" on public.activity_log for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Function to award XP and update streak
create or replace function public.award_xp(_user_id uuid, _xp integer, _activity text, _metadata jsonb default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  _last_date date;
  _today date := current_date;
  _new_streak integer;
begin
  insert into public.activity_log (user_id, activity_type, xp_awarded, metadata)
  values (_user_id, _activity, _xp, _metadata);

  select last_activity_date into _last_date from public.profiles where user_id = _user_id;

  if _last_date is null or _last_date < _today - 1 then
    _new_streak := 1;
  elsif _last_date = _today - 1 then
    _new_streak := (select current_streak from public.profiles where user_id = _user_id) + 1;
  else
    _new_streak := (select current_streak from public.profiles where user_id = _user_id);
  end if;

  update public.profiles
  set xp = xp + _xp,
      level = greatest(1, ((xp + _xp) / 100) + 1),
      current_streak = _new_streak,
      longest_streak = greatest(longest_streak, _new_streak),
      last_activity_date = _today
  where user_id = _user_id;
end;
$$;

-- ============= STORAGE BUCKETS =============
insert into storage.buckets (id, name, public) values ('study-files', 'study-files', false) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('audio-answers', 'audio-answers', false) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict do nothing;

create policy "study_files_owner_select" on storage.objects for select using (bucket_id = 'study-files' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "study_files_owner_insert" on storage.objects for insert with check (bucket_id = 'study-files' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "study_files_owner_delete" on storage.objects for delete using (bucket_id = 'study-files' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "audio_owner_select" on storage.objects for select using (bucket_id = 'audio-answers' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "audio_owner_insert" on storage.objects for insert with check (bucket_id = 'audio-answers' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "avatars_public_select" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars_owner_insert" on storage.objects for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "avatars_owner_update" on storage.objects for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- ============= SEED PUBLIC GROUPS =============
insert into public.study_groups (name, slug, description, cover_color, is_public) values
  ('Galera do Pré-Vestibular', 'pre-vestibular', 'Compartilhe resumos, dicas e tire dúvidas para o ENEM e vestibulares.', 'hsl(15 90% 55%)', true),
  ('Galera de IA', 'ia', 'Discussões sobre Inteligência Artificial, Machine Learning e LLMs.', 'hsl(260 80% 60%)', true),
  ('Galera de Marketing', 'marketing', 'Marketing digital, growth, copy e estratégia.', 'hsl(195 85% 50%)', true),
  ('Galera de Programação', 'programacao', 'Aprenda a programar com a comunidade.', 'hsl(140 60% 45%)', true),
  ('Galera de Idiomas', 'idiomas', 'Inglês, espanhol, francês e mais — pratique todo dia.', 'hsl(45 90% 55%)', true)
on conflict (slug) do nothing;
