-- برنامج تكاليف الفراولة (مشروع Supabase مستقل strawberry-erp) — نفس مخطط serp من المشروع القديم
-- مفيش أي صلاحية لـ anon/authenticated على مخطط serp؛ بس 3 دوال RPC محتاجة رمز الجهاز السري
create schema if not exists serp;
revoke all on schema serp from public, anon, authenticated;
create sequence if not exists serp.seq;
create table serp.workspaces(id uuid primary key default gen_random_uuid(), name text not null, key_hash text unique not null, created_at timestamptz not null default now());
create table serp.records(ws uuid not null references serp.workspaces(id), coll text not null, id text not null, data jsonb not null, updated_at timestamptz not null, deleted boolean not null default false, device text, seq bigint not null default nextval('serp.seq'), server_at timestamptz not null default now(), primary key(ws,coll,id));
create index records_ws_seq on serp.records(ws,seq);
create table serp.audit(aid bigserial primary key, ws uuid not null, coll text not null, rec_id text not null, action text not null, data jsonb, updated_at timestamptz, device text, at timestamptz not null default now());
create index audit_rec on serp.audit(ws,coll,rec_id);
create table serp.backups(id bigserial primary key, ws uuid not null, day date not null, json_path text, xlsx_path text, records int, bytes int, emailed_to text, email_status text, created_at timestamptz not null default now());
create table serp.config(k text primary key, v text not null);
alter table serp.workspaces enable row level security; alter table serp.records enable row level security; alter table serp.audit enable row level security; alter table serp.backups enable row level security; alter table serp.config enable row level security;
revoke all on all tables in schema serp from public, anon, authenticated;
revoke all on all sequences in schema serp from public, anon, authenticated;
-- audit trail for every write
create or replace function serp.tg_audit() returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into serp.audit(ws,coll,rec_id,action,data,updated_at,device)
  values(new.ws,new.coll,new.id,case when tg_op='INSERT' then 'insert' when new.deleted and not old.deleted then 'delete' when old.deleted and not new.deleted then 'restore' else 'update' end,new.data,new.updated_at,new.device);
  return new;
end $$;
create trigger records_audit after insert or update on serp.records for each row execute function serp.tg_audit();
-- nothing is ever hard-deleted
create or replace function serp.tg_nodelete() returns trigger language plpgsql set search_path='' as $$ begin raise exception 'serp: hard delete is not allowed (use soft delete)'; end $$;
create trigger records_nodelete before delete on serp.records for each row execute function serp.tg_nodelete();
create trigger records_notrunc before truncate on serp.records for each statement execute function serp.tg_nodelete();
create trigger audit_nodelete before delete or update on serp.audit for each row execute function serp.tg_nodelete();
create trigger audit_notrunc before truncate on serp.audit for each statement execute function serp.tg_nodelete();
create trigger backups_nodelete before delete on serp.backups for each row execute function serp.tg_nodelete();
create or replace function serp.ws_of(p_key text) returns uuid language sql stable security definer set search_path='' as $$
  select id from serp.workspaces where key_hash = encode(sha256(convert_to(coalesce(p_key,''),'UTF8')),'hex') $$;
revoke all on function serp.ws_of(text) from public, anon, authenticated;
-- public RPCs (need the secret device key)
create or replace function public.serp_check(p_key text) returns jsonb language plpgsql security definer set search_path='' as $$
declare w uuid := serp.ws_of(p_key); r jsonb;
begin
  if w is null then return jsonb_build_object('ok',false); end if;
  select jsonb_build_object('ok',true,'name',(select name from serp.workspaces where id=w),'records',count(*) filter (where not deleted),'deleted',count(*) filter (where deleted),'max_seq',coalesce(max(seq),0),
    'last_backup',(select max(created_at) from serp.backups where ws=w)) into r from serp.records where ws=w;
  return r;
end $$;
create or replace function public.serp_push(p_key text, p_device text, p_rows jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare w uuid := serp.ws_of(p_key); x jsonb; n int := 0; skipped int := 0; c int;
begin
  if w is null then raise exception 'serp: bad key' using errcode='28000'; end if;
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 500 then raise exception 'serp: bad batch'; end if;
  for x in select * from jsonb_array_elements(p_rows) loop
    if (x->>'coll') not in ('settings','factories','varieties','items','parties','purchases','transports','payments','supplyIn','transfers','runs','sales') or coalesce(x->>'id','')='' or length(x::text) > 200000 then skipped := skipped+1; continue; end if;
    insert into serp.records(ws,coll,id,data,updated_at,deleted,device)
    values(w,x->>'coll',x->>'id',x->'data',(x->>'updated_at')::timestamptz,coalesce((x->>'deleted')::boolean,false),left(p_device,80))
    on conflict (ws,coll,id) do update set data=excluded.data,updated_at=excluded.updated_at,deleted=excluded.deleted,device=excluded.device,seq=nextval('serp.seq'),server_at=now()
      where serp.records.updated_at <= excluded.updated_at and (serp.records.data is distinct from excluded.data or serp.records.deleted is distinct from excluded.deleted);
    get diagnostics c = row_count; n := n + c;
  end loop;
  return jsonb_build_object('ok',true,'written',n,'skipped',skipped);
end $$;
create or replace function public.serp_pull(p_key text, p_since bigint, p_limit int default 1000) returns jsonb language plpgsql security definer set search_path='' as $$
declare w uuid := serp.ws_of(p_key); r jsonb;
begin
  if w is null then raise exception 'serp: bad key' using errcode='28000'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('coll',coll,'id',id,'data',data,'updated_at',updated_at,'deleted',deleted,'seq',seq) order by seq),'[]'::jsonb) into r
  from (select * from serp.records where ws=w and seq > coalesce(p_since,0) order by seq limit least(greatest(coalesce(p_limit,1000),1),2000)) t;
  return jsonb_build_object('ok',true,'rows',r);
end $$;
revoke all on function public.serp_check(text), public.serp_push(text,text,jsonb), public.serp_pull(text,bigint,int) from public;
grant execute on function public.serp_check(text), public.serp_push(text,text,jsonb), public.serp_pull(text,bigint,int) to anon, authenticated;
insert into storage.buckets(id,name,public) values('serp-backups','serp-backups',false) on conflict (id) do nothing;
-- نكمل الترقيم بعد آخر رقم في المشروع القديم (291) عشان أي جهاز عنده مؤشر قديم ما يفوتش سطور
select setval('serp.seq', 1000, true);
