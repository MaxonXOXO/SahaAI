create table learn_cards (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  topic text not null,
  explanation text not null,
  diagram_steps jsonb default null,
  image_url text default null,
  video_id text default null,
  source text not null default 'user_asked' check (source in ('user_asked', 'daily_batch')),
  created_at timestamp with time zone default now()
);

alter table learn_cards enable row level security;

create policy "Users can view own cards" on learn_cards for select using (auth.uid() = user_id);
create policy "Users can insert own cards" on learn_cards for insert with check (auth.uid() = user_id);
