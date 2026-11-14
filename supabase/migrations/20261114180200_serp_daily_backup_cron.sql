-- نسخة احتياطية يومية 23:00 القاهرة (20 و21 UTC عشان التوقيت الصيفي/الشتوي)
-- رمز الكرون في Vault (مشفر)، وفي serp.config بس الـ hash بتاعه
create extension if not exists pg_net;
create extension if not exists pg_cron;
do $$
declare t text := encode(extensions.gen_random_bytes(32),'hex');
begin
  if not exists (select 1 from vault.secrets where name='serp_cron_token') then
    perform vault.create_secret(t,'serp_cron_token','x-cron-token for serp-backup edge function');
    insert into serp.config(k,v) values('cron_token_hash', encode(extensions.digest(t,'sha256'),'hex')) on conflict (k) do update set v=excluded.v;
  end if;
end $$;
select cron.unschedule(jobname) from cron.job where jobname in ('serp-backup-20utc','serp-backup-21utc');
select cron.schedule('serp-backup-20utc','0 20 * * *', $c$select net.http_post(url:='https://tbajxvopdpprnwlsilkh.supabase.co/functions/v1/serp-backup', headers:=jsonb_build_object('Content-Type','application/json','x-cron-token',(select decrypted_secret from vault.decrypted_secrets where name='serp_cron_token')), body:='{"action":"cron"}'::jsonb, timeout_milliseconds:=120000)$c$);
select cron.schedule('serp-backup-21utc','0 21 * * *', $c$select net.http_post(url:='https://tbajxvopdpprnwlsilkh.supabase.co/functions/v1/serp-backup', headers:=jsonb_build_object('Content-Type','application/json','x-cron-token',(select decrypted_secret from vault.decrypted_secrets where name='serp_cron_token')), body:='{"action":"cron"}'::jsonb, timeout_milliseconds:=120000)$c$);
