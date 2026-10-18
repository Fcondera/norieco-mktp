begin;
-- Staff may update their own app_settings through the existing PDV API. Validate
-- those writes too: malformed hours/timezones must never break the public search
-- across other stores, even when a caller bypasses the marketplace settings UI.
alter table public.app_settings add constraint marketplace_store_timezone_valid
 check(marketplace_timezone in ('America/Manaus','America/Eirunepe'));
create function public.marketplace_validate_store_settings() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 perform marketplace_validate_hours(new.marketplace_opening_hours);
 return new;
end $$;
revoke all on function public.marketplace_validate_store_settings() from public,anon,authenticated;
create trigger marketplace_store_settings_valid before insert or update of marketplace_opening_hours,marketplace_timezone
 on public.app_settings for each row execute function public.marketplace_validate_store_settings();
commit;
