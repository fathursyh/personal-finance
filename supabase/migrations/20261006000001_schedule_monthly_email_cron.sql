-- Enable pg_cron and pg_net extensions for automated scheduled jobs
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Function to trigger the monthly summary email API on the last day of the month
create or replace function public.trigger_monthly_summary_email()
returns void as $$
declare
  is_last_day boolean;
  app_endpoint text := 'https://financial-tracker-ftr.vercel.app/api/email/monthly-summary';
  cron_secret text := 'financial-fathur-ganteng';
begin
  -- Check if tomorrow is the 1st of the next month in Asia/Jakarta timezone
  is_last_day := extract(day from ((now() at time zone 'Asia/Jakarta') + interval '1 day')) = 1;

  if is_last_day then
    perform net.http_post(
      url := app_endpoint,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', cron_secret
      ),
      body := jsonb_build_object(
        'month', to_char(now() at time zone 'Asia/Jakarta', 'YYYY-MM')
      )
    );
  end if;
end;
$$ language plpgsql security definer;

-- Remove existing schedule if already registered to avoid duplicates
select cron.unschedule('monthly-spending-summary')
where exists (
  select 1 from cron.job where jobname = 'monthly-spending-summary'
);

-- Schedule the job to run every night at 23:00 WIB (16:00 UTC) on days 28-31
-- The function checks if today is indeed the last day of the month before triggering
select cron.schedule(
  'monthly-spending-summary',
  '0 16 28-31 * *',
  $$ select public.trigger_monthly_summary_email(); $$
);
