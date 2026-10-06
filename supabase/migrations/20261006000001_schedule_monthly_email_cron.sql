-- Enable pg_cron and pg_net extensions for automated scheduled jobs
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Function to trigger the monthly summary email API on the last day of the month
create or replace function public.trigger_monthly_summary_email()
returns void as $$
declare
  is_last_day boolean;
  app_endpoint text := 'https://your-domain.com/api/email/monthly-summary';
  cron_secret text := 'finance-cron-secret-key';
begin
  -- Check if tomorrow is the 1st of the next month (meaning today is the last day)
  is_last_day := extract(day from (now() + interval '1 day')) = 1;

  if is_last_day then
    perform net.http_post(
      url := app_endpoint,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', cron_secret
      ),
      body := jsonb_build_object(
        'month', to_char(now(), 'YYYY-MM')
      )
    );
  end if;
end;
$$ language plpgsql security definer;

-- Schedule the job to run every evening at 23:00 UTC (or adjust for your timezone)
-- The function checks if today is the last day of the month and triggers the email
select cron.schedule(
  'monthly-spending-summary',
  '0 23 28-31 * *',
  $$ select public.trigger_monthly_summary_email(); $$
);
