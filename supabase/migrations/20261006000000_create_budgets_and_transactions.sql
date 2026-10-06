-- 1. Create budgets table
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  amount numeric(15, 2) not null check (amount > 0),
  icon text default 'i-lucide-wallet',
  color text default 'primary',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index foreign keys and user queries
create index if not exists budgets_user_id_idx on public.budgets (user_id);
create index if not exists budgets_user_id_updated_at_idx on public.budgets (user_id, updated_at desc);

-- 2. Create transactions table
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  budget_id uuid references public.budgets(id) on delete set null,
  amount numeric(15, 2) not null check (amount > 0),
  description text not null,
  date date not null default current_date,
  payment_method text not null default 'Cash' check (
    payment_method in ('Cash', 'Debit Card', 'Credit Card', 'Bank Transfer', 'E-Wallet', 'QRIS')
  ),
  type text not null default 'expense' check (type in ('expense', 'income')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index foreign keys and date filtering
create index if not exists transactions_user_id_idx on public.transactions (user_id);
create index if not exists transactions_budget_id_idx on public.transactions (budget_id);
create index if not exists transactions_user_date_idx on public.transactions (user_id, date desc);

-- 3. Enable Row-Level Security
alter table public.budgets enable row level security;
alter table public.transactions enable row level security;

-- Budgets RLS Policies
create policy "Users can view own budgets"
  on public.budgets for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own budgets"
  on public.budgets for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own budgets"
  on public.budgets for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own budgets"
  on public.budgets for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Transactions RLS Policies
create policy "Users can view own transactions"
  on public.transactions for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own transactions"
  on public.transactions for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own transactions"
  on public.transactions for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own transactions"
  on public.transactions for delete to authenticated
  using ((select auth.uid()) = user_id);

-- 4. Triggers to maintain updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger budgets_updated_at
  before update on public.budgets
  for each row execute function public.handle_updated_at();

create or replace trigger transactions_updated_at
  before update on public.transactions
  for each row execute function public.handle_updated_at();

-- 5. Trigger to update budget's updated_at whenever a transaction is added, updated, or removed
create or replace function public.handle_budget_touch_on_transaction()
returns trigger as $$
begin
  if (tg_op = 'INSERT' or tg_op = 'UPDATE') and new.budget_id is not null then
    update public.budgets set updated_at = now() where id = new.budget_id;
  elsif (tg_op = 'DELETE') and old.budget_id is not null then
    update public.budgets set updated_at = now() where id = old.budget_id;
  end if;
  return null;
end;
$$ language plpgsql;

create or replace trigger transaction_touches_budget
  after insert or update or delete on public.transactions
  for each row execute function public.handle_budget_touch_on_transaction();
