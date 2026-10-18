begin;
-- Explicitly put temporary objects last in every privileged marketplace RPC.
do $$ declare r record;begin
 for r in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname like 'marketplace_%' and p.prosecdef loop
 execute 'alter function '||r.signature||' set search_path = public, pg_temp';
 end loop;
end $$;

create function public.marketplace_audit_access() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare entry jsonb;entity uuid;
begin
 entry:=case when tg_op='DELETE' then to_jsonb(old) else to_jsonb(new) end;
 entity:=case when tg_table_name='marketplace_members' then (entry->>'business_id')::uuid else (entry->>'user_id')::uuid end;
 insert into marketplace_audit(actor,action,entity_id,details) values(auth.uid(),
 case when tg_op='DELETE' then 'ACCESS_REVOKED' when tg_op='UPDATE' then 'ACCESS_CHANGED' else 'ACCESS_GRANTED' end,
 entity,jsonb_build_object('scope',tg_table_name,'user_id',entry->>'user_id','role',coalesce(entry->>'role','PLATFORM_ADMIN')));
 return case when tg_op='DELETE' then old else new end;
end $$;
revoke all on function public.marketplace_audit_access() from public,anon,authenticated;
create trigger marketplace_admin_access_audit after insert or update or delete on public.marketplace_admins for each row execute function public.marketplace_audit_access();
create trigger marketplace_member_access_audit after insert or update or delete on public.marketplace_members for each row execute function public.marketplace_audit_access();
notify pgrst,'reload schema';
commit;
