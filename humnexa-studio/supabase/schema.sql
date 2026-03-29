-- Humnexa Studio Phase 1 schema (Supabase PostgreSQL)
-- 23 tables with RLS enabled and auth trigger scaffolding.

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  price_inr integer not null default 0,
  monthly_credits integer not null,
  hard_cap integer not null,
  daily_cap integer,
  created_at timestamptz not null default now()
);

insert into public.plans (code, name, price_inr, monthly_credits, hard_cap, daily_cap)
values
  ('free', 'Free', 0, 100, 50, 50),
  ('starter', 'Starter', 199, 500, 500, null),
  ('pro', 'Pro', 499, 2500, 2500, null),
  ('business', 'Business', 999, 10000, 10000, null)
on conflict (code) do update
set
  name = excluded.name,
  price_inr = excluded.price_inr,
  monthly_credits = excluded.monthly_credits,
  hard_cap = excluded.hard_cap,
  daily_cap = excluded.daily_cap;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  plan_id uuid references public.plans(id),
  credits_balance integer not null default 100 check (credits_balance >= 0),
  monthly_used integer not null default 0 check (monthly_used >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'dark' check (theme in ('dark', 'light', 'system')),
  chat_mode text not null default 'chat_code' check (chat_mode in ('chat', 'chat_code', 'full_control')),
  hindi_mode boolean not null default false,
  workspace_knowledge text not null default '',
  editor_font_size integer not null default 14,
  editor_tab_size integer not null default 2,
  editor_font_family text not null default 'JetBrains Mono',
  onboarding_step integer not null default 1,
  category_preference text,
  notifications_deploy boolean not null default true,
  notifications_credits boolean not null default true,
  notifications_team boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.plans(id),
  razorpay_subscription_id text unique,
  status text not null default 'active',
  start_date timestamptz not null default now(),
  end_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  type text not null check (type in ('usage', 'purchase', 'refund', 'bonus')),
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  framework text not null default 'nextjs',
  status text not null default 'idle',
  github_url text,
  github_full_name text,
  vercel_project_id text,
  project_instructions text not null default '',
  custom_domain text,
  is_public boolean not null default false,
  deployed_url text,
  branch_name text not null default 'main',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  file_path text not null,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, file_path)
);

create table if not exists public.project_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  label text not null default 'Snapshot',
  snapshot jsonb not null,
  bookmarked boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  credits_used integer not null default 0,
  code_diffs jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.deployments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  provider text not null default 'vercel',
  status text not null default 'pending',
  logs text,
  deployed_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  razorpay_order_id text unique,
  razorpay_payment_id text,
  amount integer not null,
  currency text not null default 'INR',
  status text not null default 'created',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  unique (team_id, user_id)
);

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null,
  description text not null,
  price_inr integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.template_purchases (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.templates(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  created_at timestamptz not null default now(),
  unique (template_id, user_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  type text not null default 'info',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.project_integrations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  integration_type text not null check (integration_type in ('razorpay', 'gst', 'whatsapp', 'aadhaar', 'github', 'vercel')),
  config jsonb not null default '{}'::jsonb,
  connected boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, integration_type)
);

create table if not exists public.ai_memory (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  memory_key text not null,
  memory_value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, memory_key)
);

create table if not exists public.error_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  level text not null default 'error',
  message text not null,
  stack text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.sessions_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists public.oauth_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('github', 'google', 'vercel')),
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create table if not exists public.project_collaborators (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('viewer', 'editor')),
  invited_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create table if not exists public.template_reviews (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.templates(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  review text,
  created_at timestamptz not null default now(),
  unique (template_id, user_id)
);

create or replace function public.on_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  free_plan_id uuid;
begin
  select id into free_plan_id from public.plans where code = 'free' limit 1;

  insert into public.profiles (id, email, full_name, avatar_url, plan_id, credits_balance, monthly_used)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'avatar_url',
    free_plan_id,
    100,
    0
  )
  on conflict (id) do nothing;

  insert into public.user_settings (id)
  values (new.id)
  on conflict (id) do nothing;

  insert into public.credit_transactions (user_id, amount, type, reason)
  values (new.id, 100, 'bonus', 'Signup bonus credits')
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.on_auth_user_created();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_user_settings_updated_at on public.user_settings;
create trigger set_user_settings_updated_at
before update on public.user_settings
for each row execute function public.set_updated_at();

drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists set_project_files_updated_at on public.project_files;
create trigger set_project_files_updated_at
before update on public.project_files
for each row execute function public.set_updated_at();

drop trigger if exists set_deployments_updated_at on public.deployments;
create trigger set_deployments_updated_at
before update on public.deployments
for each row execute function public.set_updated_at();

drop trigger if exists set_payment_orders_updated_at on public.payment_orders;
create trigger set_payment_orders_updated_at
before update on public.payment_orders
for each row execute function public.set_updated_at();

drop trigger if exists set_teams_updated_at on public.teams;
create trigger set_teams_updated_at
before update on public.teams
for each row execute function public.set_updated_at();

drop trigger if exists set_templates_updated_at on public.templates;
create trigger set_templates_updated_at
before update on public.templates
for each row execute function public.set_updated_at();

drop trigger if exists set_project_integrations_updated_at on public.project_integrations;
create trigger set_project_integrations_updated_at
before update on public.project_integrations
for each row execute function public.set_updated_at();

drop trigger if exists set_ai_memory_updated_at on public.ai_memory;
create trigger set_ai_memory_updated_at
before update on public.ai_memory
for each row execute function public.set_updated_at();

drop trigger if exists set_oauth_connections_updated_at on public.oauth_connections;
create trigger set_oauth_connections_updated_at
before update on public.oauth_connections
for each row execute function public.set_updated_at();

alter table public.plans enable row level security;
alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.subscriptions enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.projects enable row level security;
alter table public.project_files enable row level security;
alter table public.project_versions enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.deployments enable row level security;
alter table public.payment_orders enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.templates enable row level security;
alter table public.template_purchases enable row level security;
alter table public.notifications enable row level security;
alter table public.project_integrations enable row level security;
alter table public.ai_memory enable row level security;
alter table public.error_logs enable row level security;
alter table public.sessions_log enable row level security;
alter table public.oauth_connections enable row level security;
alter table public.template_reviews enable row level security;
alter table public.project_collaborators enable row level security;

drop policy if exists "plans readable" on public.plans;
create policy "plans readable" on public.plans
for select to authenticated using (true);

drop policy if exists "templates readable" on public.templates;
create policy "templates readable" on public.templates
for select to authenticated using (true);

drop policy if exists "profiles self" on public.profiles;
create policy "profiles self" on public.profiles
for all to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "user settings self" on public.user_settings;
create policy "user settings self" on public.user_settings
for all to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "subscriptions self" on public.subscriptions;
create policy "subscriptions self" on public.subscriptions
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "credit tx self" on public.credit_transactions;
create policy "credit tx self" on public.credit_transactions
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "projects self" on public.projects;
create policy "projects self" on public.projects
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "project files by project owner" on public.project_files;
create policy "project files by project owner" on public.project_files
for all to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_id and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.projects p
    where p.id = project_id and p.user_id = auth.uid()
  )
);

drop policy if exists "project versions by project owner" on public.project_versions;
create policy "project versions by project owner" on public.project_versions
for all to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_id and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.projects p
    where p.id = project_id and p.user_id = auth.uid()
  )
);

drop policy if exists "conversations self" on public.conversations;
create policy "conversations self" on public.conversations
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "messages by conversation owner" on public.messages;
create policy "messages by conversation owner" on public.messages
for all to authenticated
using (
  exists (
    select 1
    from public.conversations c
    where c.id = conversation_id and c.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.conversations c
    where c.id = conversation_id and c.user_id = auth.uid()
  )
);

drop policy if exists "deployments by project owner" on public.deployments;
create policy "deployments by project owner" on public.deployments
for all to authenticated
using (
  exists (
    select 1 from public.projects p
    where p.id = project_id and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.projects p
    where p.id = project_id and p.user_id = auth.uid()
  )
);

drop policy if exists "payment orders self" on public.payment_orders;
create policy "payment orders self" on public.payment_orders
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "teams owner access" on public.teams;
create policy "teams owner access" on public.teams
for all to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "team members by team membership" on public.team_members;
create policy "team members by team membership" on public.team_members
for select to authenticated
using (
  exists (
    select 1 from public.team_members tm
    where tm.team_id = team_id and tm.user_id = auth.uid()
  )
);

drop policy if exists "team members owner manage" on public.team_members;
create policy "team members owner manage" on public.team_members
for all to authenticated
using (
  exists (
    select 1 from public.teams t
    where t.id = team_id and t.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.teams t
    where t.id = team_id and t.owner_id = auth.uid()
  )
);

drop policy if exists "template purchases self" on public.template_purchases;
create policy "template purchases self" on public.template_purchases
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "notifications self" on public.notifications;
create policy "notifications self" on public.notifications
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "project integrations by project owner" on public.project_integrations;
create policy "project integrations by project owner" on public.project_integrations
for all to authenticated
using (
  exists (
    select 1 from public.projects p
    where p.id = project_id and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.projects p
    where p.id = project_id and p.user_id = auth.uid()
  )
);

drop policy if exists "ai memory by project owner" on public.ai_memory;
create policy "ai memory by project owner" on public.ai_memory
for all to authenticated
using (
  exists (
    select 1 from public.projects p
    where p.id = project_id and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.projects p
    where p.id = project_id and p.user_id = auth.uid()
  )
);

drop policy if exists "error logs self" on public.error_logs;
create policy "error logs self" on public.error_logs
for all to authenticated
using (auth.uid() = user_id or user_id is null)
with check (auth.uid() = user_id or user_id is null);

drop policy if exists "sessions log self" on public.sessions_log;
create policy "sessions log self" on public.sessions_log
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "oauth connections self" on public.oauth_connections;
create policy "oauth connections self" on public.oauth_connections
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "template reviews readable" on public.template_reviews;
create policy "template reviews readable" on public.template_reviews
for select to authenticated
using (true);

drop policy if exists "template reviews self write" on public.template_reviews;
create policy "template reviews self write" on public.template_reviews
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "project collaborators owner manage" on public.project_collaborators;
create policy "project collaborators owner manage" on public.project_collaborators
for all to authenticated
using (
  exists (
    select 1 from public.projects p
    where p.id = project_id and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.projects p
    where p.id = project_id and p.user_id = auth.uid()
  )
);

drop policy if exists "project collaborators can view own rows" on public.project_collaborators;
create policy "project collaborators can view own rows" on public.project_collaborators
for select to authenticated
using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Phase 4 production hardening additions (India launch)
-- ---------------------------------------------------------------------------

alter table public.user_settings
  add column if not exists low_bandwidth_mode boolean not null default false,
  add column if not exists app_category text,
  add column if not exists work_preference text;

alter table public.subscriptions
  add column if not exists razorpay_plan_id text,
  add column if not exists plan_name text,
  add column if not exists next_billing_at timestamptz,
  add column if not exists cancel_at_cycle_end boolean not null default false;

alter table public.notifications
  add column if not exists is_read boolean not null default false;

alter table public.templates
  add column if not exists creator_id uuid references auth.users(id) on delete set null,
  add column if not exists source_project_id uuid references public.projects(id) on delete set null,
  add column if not exists tags text[] not null default '{}',
  add column if not exists is_active boolean not null default true,
  add column if not exists downloads integer not null default 0,
  add column if not exists rating numeric(3,2) not null default 0,
  add column if not exists is_india_specific boolean not null default false,
  add column if not exists framework text;

create table if not exists public.processed_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_id text unique not null,
  event_type text,
  processed_at timestamptz not null default now()
);

alter table public.processed_webhook_events enable row level security;
revoke all on table public.processed_webhook_events from anon, authenticated;

insert into public.plans (code, name, price_inr, monthly_credits, hard_cap, daily_cap)
values ('student', 'Student', 99, 200, 200, 200)
on conflict (code) do update
set
  name = excluded.name,
  price_inr = excluded.price_inr,
  monthly_credits = excluded.monthly_credits,
  hard_cap = excluded.hard_cap,
  daily_cap = excluded.daily_cap;

create index if not exists idx_profiles_plan_id on public.profiles(plan_id);
create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_subscriptions_plan_id on public.subscriptions(plan_id);
create index if not exists idx_subscriptions_razorpay_subscription_id on public.subscriptions(razorpay_subscription_id);
create index if not exists idx_credit_transactions_user_id on public.credit_transactions(user_id);
create index if not exists idx_projects_user_id on public.projects(user_id);
create index if not exists idx_projects_is_public on public.projects(is_public);
create index if not exists idx_project_files_project_id on public.project_files(project_id);
create index if not exists idx_project_versions_project_id on public.project_versions(project_id);
create index if not exists idx_conversations_project_id on public.conversations(project_id);
create index if not exists idx_conversations_user_id on public.conversations(user_id);
create index if not exists idx_messages_conversation_id on public.messages(conversation_id);
create index if not exists idx_deployments_project_id on public.deployments(project_id);
create index if not exists idx_payment_orders_user_id on public.payment_orders(user_id);
create index if not exists idx_payment_orders_order_id on public.payment_orders(razorpay_order_id);
create index if not exists idx_payment_orders_payment_id on public.payment_orders(razorpay_payment_id);
create index if not exists idx_teams_owner_id on public.teams(owner_id);
create index if not exists idx_team_members_team_id on public.team_members(team_id);
create index if not exists idx_team_members_user_id on public.team_members(user_id);
create index if not exists idx_templates_creator_id on public.templates(creator_id);
create index if not exists idx_template_purchases_template_id on public.template_purchases(template_id);
create index if not exists idx_template_purchases_user_id on public.template_purchases(user_id);
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_project_integrations_project_id on public.project_integrations(project_id);
create index if not exists idx_ai_memory_project_id on public.ai_memory(project_id);
create index if not exists idx_error_logs_user_id on public.error_logs(user_id);
create index if not exists idx_error_logs_project_id on public.error_logs(project_id);
create index if not exists idx_sessions_log_user_id on public.sessions_log(user_id);
create index if not exists idx_oauth_connections_user_id on public.oauth_connections(user_id);
create index if not exists idx_template_reviews_template_id on public.template_reviews(template_id);
create index if not exists idx_template_reviews_user_id on public.template_reviews(user_id);
create index if not exists idx_project_collaborators_project_id on public.project_collaborators(project_id);
create index if not exists idx_project_collaborators_user_id on public.project_collaborators(user_id);
create index if not exists idx_project_collaborators_invited_by on public.project_collaborators(invited_by);
create index if not exists idx_processed_webhook_events_event_id on public.processed_webhook_events(event_id);

create or replace function public.can_manage_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = target_project_id
      and p.user_id = (select auth.uid())
  );
$$;

create or replace function public.can_access_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_manage_project(target_project_id)
    or exists (
      select 1
      from public.project_collaborators pc
      where pc.project_id = target_project_id
        and pc.user_id = (select auth.uid())
    );
$$;

create or replace function public.can_access_conversation(target_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversations c
    where c.id = target_conversation_id
      and c.user_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.conversations c
    where c.id = target_conversation_id
      and public.can_access_project(c.project_id)
  );
$$;

create or replace function public.can_manage_team(target_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.teams t
    where t.id = target_team_id
      and t.owner_id = (select auth.uid())
  );
$$;

drop policy if exists profiles_select_self on public.profiles;
drop policy if exists profiles_insert_self on public.profiles;
drop policy if exists profiles_update_self on public.profiles;
drop policy if exists profiles_delete_self on public.profiles;
create policy profiles_select_self on public.profiles
for select to authenticated using ((select auth.uid()) = id);
create policy profiles_insert_self on public.profiles
for insert to authenticated with check ((select auth.uid()) = id);
create policy profiles_update_self on public.profiles
for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy profiles_delete_self on public.profiles
for delete to authenticated using ((select auth.uid()) = id);

drop policy if exists user_settings_select_self on public.user_settings;
drop policy if exists user_settings_insert_self on public.user_settings;
drop policy if exists user_settings_update_self on public.user_settings;
drop policy if exists user_settings_delete_self on public.user_settings;
create policy user_settings_select_self on public.user_settings
for select to authenticated using ((select auth.uid()) = id);
create policy user_settings_insert_self on public.user_settings
for insert to authenticated with check ((select auth.uid()) = id);
create policy user_settings_update_self on public.user_settings
for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy user_settings_delete_self on public.user_settings
for delete to authenticated using ((select auth.uid()) = id);

drop policy if exists subscriptions_select_self on public.subscriptions;
drop policy if exists subscriptions_insert_self on public.subscriptions;
drop policy if exists subscriptions_update_self on public.subscriptions;
drop policy if exists subscriptions_delete_self on public.subscriptions;
create policy subscriptions_select_self on public.subscriptions
for select to authenticated using ((select auth.uid()) = user_id);
create policy subscriptions_insert_self on public.subscriptions
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy subscriptions_update_self on public.subscriptions
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy subscriptions_delete_self on public.subscriptions
for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists credit_transactions_select_self on public.credit_transactions;
drop policy if exists credit_transactions_insert_self on public.credit_transactions;
drop policy if exists credit_transactions_update_self on public.credit_transactions;
drop policy if exists credit_transactions_delete_self on public.credit_transactions;
create policy credit_transactions_select_self on public.credit_transactions
for select to authenticated using ((select auth.uid()) = user_id);
create policy credit_transactions_insert_self on public.credit_transactions
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy credit_transactions_update_self on public.credit_transactions
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy credit_transactions_delete_self on public.credit_transactions
for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists projects_select_access on public.projects;
drop policy if exists projects_insert_owner on public.projects;
drop policy if exists projects_update_owner on public.projects;
drop policy if exists projects_delete_owner on public.projects;
create policy projects_select_access on public.projects
for select to authenticated
using ((select auth.uid()) = user_id or public.can_access_project(id) or is_public = true);
create policy projects_insert_owner on public.projects
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy projects_update_owner on public.projects
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy projects_delete_owner on public.projects
for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists project_files_select_access on public.project_files;
drop policy if exists project_files_insert_manage on public.project_files;
drop policy if exists project_files_update_manage on public.project_files;
drop policy if exists project_files_delete_manage on public.project_files;
create policy project_files_select_access on public.project_files
for select to authenticated using (public.can_access_project(project_id));
create policy project_files_insert_manage on public.project_files
for insert to authenticated with check (public.can_manage_project(project_id));
create policy project_files_update_manage on public.project_files
for update to authenticated using (public.can_manage_project(project_id)) with check (public.can_manage_project(project_id));
create policy project_files_delete_manage on public.project_files
for delete to authenticated using (public.can_manage_project(project_id));

drop policy if exists project_versions_select_access on public.project_versions;
drop policy if exists project_versions_insert_manage on public.project_versions;
drop policy if exists project_versions_update_manage on public.project_versions;
drop policy if exists project_versions_delete_manage on public.project_versions;
create policy project_versions_select_access on public.project_versions
for select to authenticated using (public.can_access_project(project_id));
create policy project_versions_insert_manage on public.project_versions
for insert to authenticated with check (public.can_manage_project(project_id));
create policy project_versions_update_manage on public.project_versions
for update to authenticated using (public.can_manage_project(project_id)) with check (public.can_manage_project(project_id));
create policy project_versions_delete_manage on public.project_versions
for delete to authenticated using (public.can_manage_project(project_id));

drop policy if exists conversations_select_access on public.conversations;
drop policy if exists conversations_insert_access on public.conversations;
drop policy if exists conversations_update_access on public.conversations;
drop policy if exists conversations_delete_access on public.conversations;
create policy conversations_select_access on public.conversations
for select to authenticated using ((select auth.uid()) = user_id or public.can_access_project(project_id));
create policy conversations_insert_access on public.conversations
for insert to authenticated with check ((select auth.uid()) = user_id and public.can_access_project(project_id));
create policy conversations_update_access on public.conversations
for update to authenticated using ((select auth.uid()) = user_id or public.can_manage_project(project_id))
with check ((select auth.uid()) = user_id or public.can_manage_project(project_id));
create policy conversations_delete_access on public.conversations
for delete to authenticated using ((select auth.uid()) = user_id or public.can_manage_project(project_id));

drop policy if exists messages_select_access on public.messages;
drop policy if exists messages_insert_access on public.messages;
drop policy if exists messages_update_access on public.messages;
drop policy if exists messages_delete_access on public.messages;
create policy messages_select_access on public.messages
for select to authenticated using (public.can_access_conversation(conversation_id));
create policy messages_insert_access on public.messages
for insert to authenticated with check (public.can_access_conversation(conversation_id));
create policy messages_update_access on public.messages
for update to authenticated using (public.can_access_conversation(conversation_id))
with check (public.can_access_conversation(conversation_id));
create policy messages_delete_access on public.messages
for delete to authenticated using (public.can_access_conversation(conversation_id));

drop policy if exists deployments_select_access on public.deployments;
drop policy if exists deployments_insert_manage on public.deployments;
drop policy if exists deployments_update_manage on public.deployments;
drop policy if exists deployments_delete_manage on public.deployments;
create policy deployments_select_access on public.deployments
for select to authenticated using (public.can_access_project(project_id));
create policy deployments_insert_manage on public.deployments
for insert to authenticated with check (public.can_manage_project(project_id));
create policy deployments_update_manage on public.deployments
for update to authenticated using (public.can_manage_project(project_id))
with check (public.can_manage_project(project_id));
create policy deployments_delete_manage on public.deployments
for delete to authenticated using (public.can_manage_project(project_id));

drop policy if exists payment_orders_select_self on public.payment_orders;
drop policy if exists payment_orders_insert_self on public.payment_orders;
drop policy if exists payment_orders_update_self on public.payment_orders;
drop policy if exists payment_orders_delete_self on public.payment_orders;
create policy payment_orders_select_self on public.payment_orders
for select to authenticated using ((select auth.uid()) = user_id);
create policy payment_orders_insert_self on public.payment_orders
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy payment_orders_update_self on public.payment_orders
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy payment_orders_delete_self on public.payment_orders
for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists teams_select_member on public.teams;
drop policy if exists teams_insert_owner on public.teams;
drop policy if exists teams_update_owner on public.teams;
drop policy if exists teams_delete_owner on public.teams;
create policy teams_select_member on public.teams
for select to authenticated
using ((select auth.uid()) = owner_id or exists (
  select 1 from public.team_members tm where tm.team_id = id and tm.user_id = (select auth.uid())
));
create policy teams_insert_owner on public.teams
for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy teams_update_owner on public.teams
for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy teams_delete_owner on public.teams
for delete to authenticated using ((select auth.uid()) = owner_id);

drop policy if exists team_members_select_member on public.team_members;
drop policy if exists team_members_insert_owner on public.team_members;
drop policy if exists team_members_update_owner on public.team_members;
drop policy if exists team_members_delete_owner on public.team_members;
create policy team_members_select_member on public.team_members
for select to authenticated
using (exists (
  select 1 from public.team_members tm where tm.team_id = team_id and tm.user_id = (select auth.uid())
) or public.can_manage_team(team_id));
create policy team_members_insert_owner on public.team_members
for insert to authenticated with check (public.can_manage_team(team_id));
create policy team_members_update_owner on public.team_members
for update to authenticated using (public.can_manage_team(team_id)) with check (public.can_manage_team(team_id));
create policy team_members_delete_owner on public.team_members
for delete to authenticated using (public.can_manage_team(team_id));

drop policy if exists templates_select_all on public.templates;
drop policy if exists templates_insert_owner on public.templates;
drop policy if exists templates_update_owner on public.templates;
drop policy if exists templates_delete_owner on public.templates;
create policy templates_select_all on public.templates
for select to authenticated using (is_active = true or (select auth.uid()) = creator_id);
create policy templates_insert_owner on public.templates
for insert to authenticated with check ((select auth.uid()) = creator_id);
create policy templates_update_owner on public.templates
for update to authenticated using ((select auth.uid()) = creator_id) with check ((select auth.uid()) = creator_id);
create policy templates_delete_owner on public.templates
for delete to authenticated using ((select auth.uid()) = creator_id);

drop policy if exists template_purchases_select_self on public.template_purchases;
drop policy if exists template_purchases_insert_self on public.template_purchases;
drop policy if exists template_purchases_update_self on public.template_purchases;
drop policy if exists template_purchases_delete_self on public.template_purchases;
create policy template_purchases_select_self on public.template_purchases
for select to authenticated using ((select auth.uid()) = user_id);
create policy template_purchases_insert_self on public.template_purchases
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy template_purchases_update_self on public.template_purchases
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy template_purchases_delete_self on public.template_purchases
for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists notifications_select_self on public.notifications;
drop policy if exists notifications_insert_self on public.notifications;
drop policy if exists notifications_update_self on public.notifications;
drop policy if exists notifications_delete_self on public.notifications;
create policy notifications_select_self on public.notifications
for select to authenticated using ((select auth.uid()) = user_id);
create policy notifications_insert_self on public.notifications
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy notifications_update_self on public.notifications
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy notifications_delete_self on public.notifications
for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists project_integrations_select_access on public.project_integrations;
drop policy if exists project_integrations_insert_manage on public.project_integrations;
drop policy if exists project_integrations_update_manage on public.project_integrations;
drop policy if exists project_integrations_delete_manage on public.project_integrations;
create policy project_integrations_select_access on public.project_integrations
for select to authenticated using (public.can_access_project(project_id));
create policy project_integrations_insert_manage on public.project_integrations
for insert to authenticated with check (public.can_manage_project(project_id));
create policy project_integrations_update_manage on public.project_integrations
for update to authenticated using (public.can_manage_project(project_id))
with check (public.can_manage_project(project_id));
create policy project_integrations_delete_manage on public.project_integrations
for delete to authenticated using (public.can_manage_project(project_id));

drop policy if exists ai_memory_select_access on public.ai_memory;
drop policy if exists ai_memory_insert_manage on public.ai_memory;
drop policy if exists ai_memory_update_manage on public.ai_memory;
drop policy if exists ai_memory_delete_manage on public.ai_memory;
create policy ai_memory_select_access on public.ai_memory
for select to authenticated using (public.can_access_project(project_id));
create policy ai_memory_insert_manage on public.ai_memory
for insert to authenticated with check (public.can_manage_project(project_id));
create policy ai_memory_update_manage on public.ai_memory
for update to authenticated using (public.can_manage_project(project_id))
with check (public.can_manage_project(project_id));
create policy ai_memory_delete_manage on public.ai_memory
for delete to authenticated using (public.can_manage_project(project_id));

drop policy if exists error_logs_select_self on public.error_logs;
drop policy if exists error_logs_insert_self on public.error_logs;
drop policy if exists error_logs_update_self on public.error_logs;
drop policy if exists error_logs_delete_self on public.error_logs;
create policy error_logs_select_self on public.error_logs
for select to authenticated using ((select auth.uid()) = user_id or user_id is null);
create policy error_logs_insert_self on public.error_logs
for insert to authenticated with check ((select auth.uid()) = user_id or user_id is null);
create policy error_logs_update_self on public.error_logs
for update to authenticated using ((select auth.uid()) = user_id or user_id is null)
with check ((select auth.uid()) = user_id or user_id is null);
create policy error_logs_delete_self on public.error_logs
for delete to authenticated using ((select auth.uid()) = user_id or user_id is null);

drop policy if exists sessions_log_select_self on public.sessions_log;
drop policy if exists sessions_log_insert_self on public.sessions_log;
drop policy if exists sessions_log_update_self on public.sessions_log;
drop policy if exists sessions_log_delete_self on public.sessions_log;
create policy sessions_log_select_self on public.sessions_log
for select to authenticated using ((select auth.uid()) = user_id);
create policy sessions_log_insert_self on public.sessions_log
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy sessions_log_update_self on public.sessions_log
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy sessions_log_delete_self on public.sessions_log
for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists oauth_connections_select_self on public.oauth_connections;
drop policy if exists oauth_connections_insert_self on public.oauth_connections;
drop policy if exists oauth_connections_update_self on public.oauth_connections;
drop policy if exists oauth_connections_delete_self on public.oauth_connections;
create policy oauth_connections_select_self on public.oauth_connections
for select to authenticated using ((select auth.uid()) = user_id);
create policy oauth_connections_insert_self on public.oauth_connections
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy oauth_connections_update_self on public.oauth_connections
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy oauth_connections_delete_self on public.oauth_connections
for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists template_reviews_select_all on public.template_reviews;
drop policy if exists template_reviews_insert_self on public.template_reviews;
drop policy if exists template_reviews_update_self on public.template_reviews;
drop policy if exists template_reviews_delete_self on public.template_reviews;
create policy template_reviews_select_all on public.template_reviews
for select to authenticated using (true);
create policy template_reviews_insert_self on public.template_reviews
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy template_reviews_update_self on public.template_reviews
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy template_reviews_delete_self on public.template_reviews
for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists project_collaborators_select_access on public.project_collaborators;
drop policy if exists project_collaborators_insert_owner on public.project_collaborators;
drop policy if exists project_collaborators_update_owner on public.project_collaborators;
drop policy if exists project_collaborators_delete_owner on public.project_collaborators;
create policy project_collaborators_select_access on public.project_collaborators
for select to authenticated
using (public.can_manage_project(project_id) or (select auth.uid()) = user_id);
create policy project_collaborators_insert_owner on public.project_collaborators
for insert to authenticated with check (public.can_manage_project(project_id));
create policy project_collaborators_update_owner on public.project_collaborators
for update to authenticated using (public.can_manage_project(project_id))
with check (public.can_manage_project(project_id));
create policy project_collaborators_delete_owner on public.project_collaborators
for delete to authenticated using (public.can_manage_project(project_id));

drop policy if exists plans_select_all on public.plans;
drop policy if exists plans_insert_none on public.plans;
drop policy if exists plans_update_none on public.plans;
drop policy if exists plans_delete_none on public.plans;
create policy plans_select_all on public.plans for select to authenticated using (true);
create policy plans_insert_none on public.plans for insert to authenticated with check (false);
create policy plans_update_none on public.plans for update to authenticated using (false) with check (false);
create policy plans_delete_none on public.plans for delete to authenticated using (false);

drop policy if exists processed_webhook_events_service_select on public.processed_webhook_events;
drop policy if exists processed_webhook_events_service_insert on public.processed_webhook_events;
drop policy if exists processed_webhook_events_service_update on public.processed_webhook_events;
drop policy if exists processed_webhook_events_service_delete on public.processed_webhook_events;
create policy processed_webhook_events_service_select on public.processed_webhook_events
for select to service_role using (true);
create policy processed_webhook_events_service_insert on public.processed_webhook_events
for insert to service_role with check (true);
create policy processed_webhook_events_service_update on public.processed_webhook_events
for update to service_role using (true) with check (true);
create policy processed_webhook_events_service_delete on public.processed_webhook_events
for delete to service_role using (true);
