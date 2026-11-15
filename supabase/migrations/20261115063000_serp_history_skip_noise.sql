-- v1.2.8: السجل على السيرفر ما يتمليش بنسخ الإعدادات اللي اتغير فيها وقت التعديل/علامة النسخة الاحتياطية بس
create or replace function serp.tg_history() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if ((old.data - 'updatedAt' - 'changedSince' - 'lastBackup') is distinct from (new.data - 'updatedAt' - 'changedSince' - 'lastBackup'))
     or old.deleted is distinct from new.deleted then
    insert into serp.history(ws,coll,rec_id,data,ver_at,deleted,action,device,src)
    values(old.ws,old.coll,old.id,old.data,old.updated_at,old.deleted,
      case when new.deleted and not old.deleted then 'delete' when old.deleted and not new.deleted then 'restore' else 'edit' end,
      old.device,'server')
    on conflict do nothing;
  end if;
  return new;
end $$;
revoke all on function serp.tg_history() from public, anon, authenticated;
