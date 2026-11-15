-- v1.2.8: مفيش مسح نهائي أبدًا + سجل كامل للنسخ القديمة على السحابة (مشروع strawberry-erp بس — tbajxvopdpprnwlsilkh)
-- كل حاجة لسه من خلال RPC برمز الجهاز السري؛ مفيش أي صلاحية مباشرة لـ anon/authenticated على مخطط serp

-- 1) جدول السجل: كل نسخة قديمة لأي تسجيل (من السيرفر بالـ trigger، ومن الأجهزة للنسخ اللي اتعدلت أوفلاين)
create table if not exists serp.history(
  hid bigserial primary key,
  ws uuid not null references serp.workspaces(id),
  coll text not null,
  rec_id text not null,
  data jsonb not null,
  ver_at timestamptz,               -- وقت النسخة نفسها (updatedAt)
  deleted boolean not null default false,
  action text not null,             -- edit / delete / restore / remote
  device text,
  src text not null,                -- server (trigger) / client (جهاز)
  at timestamptz not null default now()
);
create unique index if not exists history_ver_uq on serp.history(ws,coll,rec_id,coalesce(ver_at,'epoch'::timestamptz),deleted,md5(data::text));
create index if not exists history_rec on serp.history(ws,coll,rec_id,hid desc);
alter table serp.history enable row level security;
revoke all on serp.history from public, anon, authenticated;
revoke all on sequence serp.history_hid_seq from public, anon, authenticated;

-- السجل نفسه ما بيتعدلش وما بيتمسحش
drop trigger if exists history_nodelete on serp.history;
create trigger history_nodelete before delete or update on serp.history for each row execute function serp.tg_nodelete();
drop trigger if exists history_notrunc on serp.history;
create trigger history_notrunc before truncate on serp.history for each statement execute function serp.tg_nodelete();

-- 2) أي تعديل على serp.records: النسخة القديمة بتتحفظ كاملة قبل ما تتغطى
create or replace function serp.tg_history() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if old.data is distinct from new.data or old.deleted is distinct from new.deleted then
    insert into serp.history(ws,coll,rec_id,data,ver_at,deleted,action,device,src)
    values(old.ws,old.coll,old.id,old.data,old.updated_at,old.deleted,
      case when new.deleted and not old.deleted then 'delete' when old.deleted and not new.deleted then 'restore' else 'edit' end,
      old.device,'server')
    on conflict do nothing;
  end if;
  return new;
end $$;
drop trigger if exists records_history on serp.records;
create trigger records_history before update on serp.records for each row execute function serp.tg_history();
revoke all on function serp.tg_history() from public, anon, authenticated;

-- 3) مفيش DELETE/TRUNCATE لأي دور على جداول البيانات (فوق الـ triggers الموجودة)
revoke delete, truncate on serp.records, serp.audit, serp.history, serp.backups from public, anon, authenticated, service_role;
drop trigger if exists workspaces_nodelete on serp.workspaces;
create trigger workspaces_nodelete before delete on serp.workspaces for each row execute function serp.tg_nodelete();
drop trigger if exists workspaces_notrunc on serp.workspaces;
create trigger workspaces_notrunc before truncate on serp.workspaces for each statement execute function serp.tg_nodelete();
drop trigger if exists backups_notrunc on serp.backups;
create trigger backups_notrunc before truncate on serp.backups for each statement execute function serp.tg_nodelete();

-- 4) serp_push: الحذف علامة بس (deleted=true) والبيانات بتفضل؛ لو جه حذف من غير بيانات، البيانات القديمة بتفضل زي ما هي
create or replace function public.serp_push(p_key text, p_device text, p_rows jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare w uuid := serp.ws_of(p_key); x jsonb; n int := 0; skipped int := 0; c int;
begin
  if w is null then raise exception 'serp: bad key' using errcode='28000'; end if;
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 500 then raise exception 'serp: bad batch'; end if;
  for x in select * from jsonb_array_elements(p_rows) loop
    if (x->>'coll') not in ('settings','factories','varieties','items','parties','purchases','transports','payments','supplyIn','transfers','runs','sales')
       or coalesce(x->>'id','')='' or length(x::text) > 200000
       or jsonb_typeof(x->'data') is distinct from 'object' or (x->'data')='{}'::jsonb then skipped := skipped+1; continue; end if;
    insert into serp.records(ws,coll,id,data,updated_at,deleted,device)
    values(w,x->>'coll',x->>'id',x->'data',(x->>'updated_at')::timestamptz,coalesce((x->>'deleted')::boolean,false),left(p_device,80))
    on conflict (ws,coll,id) do update set data=excluded.data,updated_at=excluded.updated_at,deleted=excluded.deleted,device=excluded.device,seq=nextval('serp.seq'),server_at=now()
      where serp.records.updated_at <= excluded.updated_at and (serp.records.data is distinct from excluded.data or serp.records.deleted is distinct from excluded.deleted);
    get diagnostics c = row_count; n := n + c;
  end loop;
  return jsonb_build_object('ok',true,'written',n,'skipped',skipped);
end $$;

-- 5) رفع سجل الجهاز (النسخ القديمة) — insert بس، والمكرر بيتجاهل
create or replace function public.serp_push_hist(p_key text, p_device text, p_rows jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare w uuid := serp.ws_of(p_key); x jsonb; n int := 0; skipped int := 0; c int;
begin
  if w is null then raise exception 'serp: bad key' using errcode='28000'; end if;
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 500 then raise exception 'serp: bad batch'; end if;
  for x in select * from jsonb_array_elements(p_rows) loop
    if (x->>'coll') not in ('settings','factories','varieties','items','parties','purchases','transports','payments','supplyIn','transfers','runs','sales')
       or coalesce(x->>'id','')='' or length(x::text) > 200000 or jsonb_typeof(x->'data') is distinct from 'object' then skipped := skipped+1; continue; end if;
    insert into serp.history(ws,coll,rec_id,data,ver_at,deleted,action,device,src,at)
    values(w,x->>'coll',x->>'id',x->'data',nullif(x->>'ver_at','')::timestamptz,coalesce((x->>'deleted')::boolean,false),
      left(coalesce(x->>'action','edit'),20),left(coalesce(x->>'device',p_device),80),'client',coalesce(nullif(x->>'at','')::timestamptz,now()))
    on conflict do nothing;
    get diagnostics c = row_count; n := n + c;
  end loop;
  return jsonb_build_object('ok',true,'written',n,'skipped',skipped);
end $$;

-- 6) قراية سجل تسجيل واحد (الأحدث الأول)
create or replace function public.serp_history(p_key text, p_coll text, p_id text, p_limit int default 300) returns jsonb language plpgsql security definer set search_path='' as $$
declare w uuid := serp.ws_of(p_key); r jsonb;
begin
  if w is null then raise exception 'serp: bad key' using errcode='28000'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('data',data,'ver_at',ver_at,'deleted',deleted,'action',action,'device',device,'src',src,'at',at) order by hid desc),'[]'::jsonb) into r
  from (select * from serp.history where ws=w and coll=p_coll and rec_id=p_id order by hid desc limit least(greatest(coalesce(p_limit,300),1),1000)) t;
  return jsonb_build_object('ok',true,'rows',r);
end $$;

revoke all on function public.serp_push(text,text,jsonb), public.serp_push_hist(text,text,jsonb), public.serp_history(text,text,text,int) from public;
grant execute on function public.serp_push(text,text,jsonb), public.serp_push_hist(text,text,jsonb), public.serp_history(text,text,text,int) to anon, authenticated;

-- 7) تعبئة السجل من الـ audit القديم (كل نسخة اترفعت قبل كده)
insert into serp.history(ws,coll,rec_id,data,ver_at,deleted,action,device,src,at)
select ws,coll,rec_id,data,updated_at,action='delete',action,device,'server',at from serp.audit where data is not null and jsonb_typeof(data)='object'
on conflict do nothing;
