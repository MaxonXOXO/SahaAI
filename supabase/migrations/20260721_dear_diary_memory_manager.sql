-- Migration: Dear Diary + Memory Manager
-- Description: Enables pgvector extension, creates diary_entries and memory_notes tables, RLS policies, and match_memory_notes similarity search RPC function.

-- 1. Enable pgvector extension
create extension if not exists vector;

-- 2. Create diary_entries table
create table if not exists diary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  content text not null,
  mood_tag text,
  created_at timestamptz default now()
);

-- 3. Create memory_notes table (vector dimension 768 for Gemini gemini-embedding-001)
create table if not exists memory_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  content text not null,
  embedding vector(768),
  created_at timestamptz default now()
);

-- 4. Create ivfflat index for fast vector cosine similarity search
create index if not exists idx_memory_notes_embedding on memory_notes using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- 5. Enable Row Level Security (RLS)
alter table diary_entries enable row level security;
alter table memory_notes enable row level security;

-- 6. Grant API access permissions to authenticated and anon roles
grant select, insert, update, delete on table diary_entries to authenticated, anon;
grant select, insert, update, delete on table memory_notes to authenticated, anon;

-- 7. Create RLS Policies

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Users manage own diary entries' and tablename = 'diary_entries') then
    create policy "Users manage own diary entries"
      on diary_entries for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Users manage own memory notes' and tablename = 'memory_notes') then
    create policy "Users manage own memory notes"
      on memory_notes for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

-- 7. Create match_memory_notes retrieval RPC function
create or replace function match_memory_notes(
  query_embedding vector(768),
  match_user_id uuid,
  match_threshold float default 0.75,
  match_count int default 3
)
returns table (id uuid, content text, similarity float, created_at timestamptz)
language sql stable
as $$
  select id, content, 1 - (embedding <=> query_embedding) as similarity, created_at
  from memory_notes
  where user_id = match_user_id
    and 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;
