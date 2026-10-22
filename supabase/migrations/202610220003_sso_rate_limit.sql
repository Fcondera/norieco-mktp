begin;
create function public.norieco_sso_rate() returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null then raise exception 'Entre para continuar.';end if;
 perform marketplace_rate('panel-sso',6);
end $$;
revoke all on function public.norieco_sso_rate() from public,anon,authenticated;
grant execute on function public.norieco_sso_rate() to authenticated;
commit;
