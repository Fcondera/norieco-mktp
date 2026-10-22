-- Additive onboarding. Existing customers without a trial row keep their access.
begin;
create table public.pdv_trials(
 tenant_id uuid primary key references public.tenants(id),
 created_by uuid unique references auth.users(id) on delete set null,
 started_at timestamptz not null default now(),
 ends_at timestamptz not null default (now()+interval '15 days'),
 status text not null default 'TRIAL' check(status in ('TRIAL','ACTIVE','PAUSED')),
 updated_at timestamptz not null default now(),check(ends_at>started_at)
);
alter table public.pdv_trials enable row level security;
revoke all on public.pdv_trials from public,anon,authenticated;

create function public.pdv_tenant_allowed(p_tenant uuid) returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select not exists(select 1 from pdv_trials where tenant_id=p_tenant and
 (status='PAUSED' or (status='TRIAL' and ends_at<=now())));
$$;
revoke all on function public.pdv_tenant_allowed(uuid) from public,anon,authenticated;

create or replace function public.current_tenant_id() returns uuid language sql stable security definer set search_path=public,pg_temp as $$
 select p.tenant_id from profiles p join tenants t on t.id=p.tenant_id
 where p.id=auth.uid() and p.is_active and t.is_active and pdv_tenant_allowed(t.id) limit 1;
$$;
create or replace function public.current_app_role() returns app_role language sql stable security definer set search_path=public,pg_temp as $$
 select p.role from profiles p join tenants t on t.id=p.tenant_id
 where p.id=auth.uid() and p.is_active and t.is_active and pdv_tenant_allowed(t.id) limit 1;
$$;

create function public.pdv_trial_status() returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare trial pdv_trials; p profiles; t tenants;
begin
 if auth.uid() is null then raise exception 'Entre para continuar.';end if;
 select * into p from profiles where id=auth.uid();
 select * into trial from pdv_trials where tenant_id=p.tenant_id;
 select * into t from tenants where id=p.tenant_id;
 return jsonb_build_object('has_pdv',current_tenant_id() is not null,'tenant_id',case when p.is_active then p.tenant_id end,
 'status',case when trial.tenant_id is not null then case when trial.status='TRIAL' and trial.ends_at<=now() then 'EXPIRED' else trial.status end
 when p.is_active then 'EXISTING' when p.access_status='pending' and p.role='SERVICE' then 'NEW' else 'BLOCKED' end,
 'started_at',trial.started_at,'ends_at',trial.ends_at,'server_now',now(),
 'public_url',case when p.is_active then 'https://norieco.com.br/'||t.slug end);
end $$;
revoke all on function public.pdv_trial_status() from public,anon,authenticated;
grant execute on function public.pdv_trial_status() to authenticated;

-- Only the verified-user Edge Function may call this provisioner. No user ID,
-- existing tenant ID, role, deadline or approval is accepted from the browser.
create function public.pdv_start_trial_internal(p_user uuid,p_data jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare p profiles; trial pdv_trials; tid uuid; bid uuid; cid uuid; v_slug text:=lower(trim(p_data->>'slug'));
 kind text:=p_data->>'business_type'; fullname text:=trim(p_data->>'full_name'); shop text:=trim(p_data->>'name');
 phone text:=regexp_replace(coalesce(p_data->>'whatsapp',''),'\D','','g'); city text:=trim(p_data->>'city'); email text;
begin
 if auth.role() is distinct from 'service_role' then raise exception 'Operação exclusiva do servidor.';end if;
 perform pg_advisory_xact_lock(hashtextextended('trial:'||p_user::text,0));
 select * into trial from pdv_trials where created_by=p_user;
 if found then return jsonb_build_object('tenant_id',trial.tenant_id,'ends_at',trial.ends_at,'existing',true);end if;
 select * into p from profiles where id=p_user for update;
 if p.id is null or p.is_active or p.access_status<>'pending' or p.role<>'SERVICE' then raise exception 'Esta conta já possui acesso ou precisa de revisão pela NoriEco.';end if;
 if p_data ?| array['tenant_id','role','ends_at','status','is_active','verification_status'] then raise exception 'Campos de acesso não são permitidos.';end if;
 if coalesce((p_data->>'terms')::boolean,false) is not true then raise exception 'Aceite os termos para continuar.';end if;
 if coalesce(length(shop),0) not between 2 and 120 or coalesce(length(fullname),0) not between 3 and 120 or
 coalesce(length(city),0) not between 2 and 80 or phone !~ '^[0-9]{10,15}$' then raise exception 'Confira nome, loja, cidade e WhatsApp.';end if;
 if v_slug is null or v_slug !~ '^[a-z0-9][a-z0-9-]{2,99}$' or v_slug=any(array['marketplace','marktplace','markrplace','entrar','sair','auth','admin','administracao','gestao','inicio','conta','empresa','cadastrar-empresa','primeiro-acesso','carrinho','finalizar','ajuda','termos','privacidade','sobre','loja','assets','downloads','api','www','suporte','favicon','robots','sitemap']) then raise exception 'Escolha outro endereço para sua loja.';end if;
 if kind is null or kind not in ('FISH_MARKET','SNACK_BAR','RESTAURANT') then raise exception 'Selecione o tipo da loja.';end if;
 if exists(select 1 from tenants where tenants.slug=v_slug) or exists(select 1 from marketplace_businesses where marketplace_businesses.slug=v_slug) then raise exception 'Esse endereço já está em uso. Escolha outro.';end if;
 if length(coalesce(p_data->>'address',''))>240 or length(coalesce(p_data->>'neighborhood',''))>100 then raise exception 'Confira o endereço.';end if;
 select u.email into email from auth.users u where u.id=p_user;
 if email is null then raise exception 'Conta sem e-mail confirmado.';end if;
 insert into tenants(name,slug,business_type) values(shop,v_slug,kind) returning id into tid;
 insert into pdv_trials(tenant_id,created_by) values(tid,p_user) returning * into trial;
 insert into app_settings(id,tenant_id,company_name,business_type,logo_url,phone,whatsapp,pickup_address,cities,neighborhoods,
 delivery_windows,pickup_windows,pix_key,delivery_fee,default_safety_stock_kg,marketplace_is_open)
 values(true,tid,shop,kind,'',phone,phone,coalesce(p_data->>'address',''),array[city],
 case when coalesce(p_data->>'neighborhood','')='' then array[]::text[] else array[p_data->>'neighborhood'] end,
 array[]::text[],array[]::text[],'',0,0,false);
 update profiles set tenant_id=tid,role='ADMINISTRATOR',is_active=true,access_status='active',name=fullname where id=p_user;
 insert into marketplace_profiles(user_id,full_name,whatsapp,city,neighborhood,terms_version)
 values(p_user,fullname,phone,city,coalesce(nullif(p_data->>'neighborhood',''),'Não informado'),'2026-10-22')
 on conflict(user_id) do update set full_name=excluded.full_name,whatsapp=excluded.whatsapp,city=excluded.city,terms_version=excluded.terms_version;
 select id into cid from marketplace_categories where name=case kind when 'FISH_MARKET' then 'Peixarias' when 'SNACK_BAR' then 'Lanches' else 'Restaurantes' end;
 if cid is null then raise exception 'Categoria indisponível. Contate a NoriEco.';end if;
 insert into marketplace_businesses(slug,name,category_id,listing_type,verification_status,tenant_id,city,address,neighborhood,whatsapp,email,integration_status)
 values(v_slug,shop,cid,'INTEGRATED','VERIFIED',tid,city,coalesce(p_data->>'address',''),coalesce(p_data->>'neighborhood',''),phone,email,'CONNECTED') returning id into bid;
 insert into marketplace_members(business_id,user_id) values(bid,p_user);
 insert into marketplace_verifications(business_id) values(bid);
 insert into marketplace_audit(actor,action,entity_id,details) values(p_user,'PDV_TRIAL_STARTED',bid,jsonb_build_object('tenant_id',tid,'ends_at',trial.ends_at,'documentary_approval',false));
 return jsonb_build_object('tenant_id',tid,'business_id',bid,'ends_at',trial.ends_at,'public_url','https://norieco.com.br/'||v_slug,'existing',false);
exception when unique_violation then raise exception 'Esse endereço já está em uso. Escolha outro.';
end $$;
revoke all on function public.pdv_start_trial_internal(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.pdv_start_trial_internal(uuid,jsonb) to service_role;

-- Definer RPCs and public catalog ordering also cross this guard. Expired trials
-- cannot continue writing through a stale browser, an ID change or an RPC.
create function public.enforce_pdv_trial() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare tid uuid;
begin
 tid:=case when tg_op='DELETE' then old.tenant_id else new.tenant_id end;
 if not pdv_tenant_allowed(tid) and not coalesce(is_owner_admin(),false) and coalesce(auth.role(),'')<>'service_role' then raise exception 'O período de teste terminou. Fale com a NoriEco para continuar.';end if;
 if tg_op='UPDATE' and old.tenant_id is distinct from tid and not pdv_tenant_allowed(old.tenant_id) and not coalesce(is_owner_admin(),false) and coalesce(auth.role(),'')<>'service_role' then raise exception 'Empresa sem acesso ativo.';end if;
 return case when tg_op='DELETE' then old else new end;
end $$;
revoke all on function public.enforce_pdv_trial() from public,anon,authenticated;
do $$declare name text;begin
 foreach name in array array['products','home_banners','suppliers','purchases','purchase_items','batches','customers','customer_addresses','orders','order_items','payments','deliveries','pickups','stock_movements','audit_logs','dining_tables','dining_tabs','dining_tab_items','supplies','supply_movements','courier_profiles','whatsapp_messages','cash_movements','attendance_employees','attendance_records','app_settings'] loop
 execute format('create trigger aa_enforce_pdv_trial before insert or update or delete on public.%I for each row execute function public.enforce_pdv_trial()',name);
 end loop;
end $$;

create function public.pdv_trial_admin_list() returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
begin
 if not is_owner_admin() then raise exception 'Apenas a administração geral pode consultar testes.';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('tenant_id',r.tenant_id,'name',t.name,'email',u.email,'started_at',r.started_at,'ends_at',r.ends_at,'status',case when r.status='TRIAL' and r.ends_at<=now() then 'EXPIRED' else r.status end) order by r.ends_at)
 from pdv_trials r join tenants t on t.id=r.tenant_id left join auth.users u on u.id=r.created_by),'[]');
end $$;
create function public.pdv_trial_admin_action(p_tenant uuid,p_action text,p_days integer default 15) returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if not is_owner_admin() then raise exception 'Apenas a administração geral decide a continuidade.';end if;
 if p_action not in ('continue','pause','extend') or p_days not between 1 and 90 then raise exception 'Ação inválida.';end if;
 update pdv_trials set status=case p_action when 'continue' then 'ACTIVE' when 'pause' then 'PAUSED' else 'TRIAL' end,
 ends_at=case when p_action='extend' then greatest(ends_at,now())+make_interval(days=>p_days) else ends_at end,updated_at=now() where tenant_id=p_tenant;
 if not found then raise exception 'Teste não encontrado.';end if;
 insert into marketplace_audit(actor,action,entity_id,details) values(auth.uid(),'PDV_TRIAL_'||upper(p_action),p_tenant,jsonb_build_object('days',p_days));
end $$;
revoke all on function public.pdv_trial_admin_list(),public.pdv_trial_admin_action(uuid,text,integer) from public,anon,authenticated;
grant execute on function public.pdv_trial_admin_list(),public.pdv_trial_admin_action(uuid,text,integer) to authenticated;
create or replace function public.marketplace_public_business(p_business uuid) returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
 select jsonb_build_object('id',b.id,'slug',b.slug,'name',b.name,'category_id',b.category_id,'category_name',c.name,
 'document_verified',exists(select 1 from marketplace_verifications v where v.business_id=b.id and v.submitted_at is not null and v.reviewed_at is not null and exists(select 1 from storage.objects o where o.bucket_id='marketplace-verifications' and o.name=v.identity_path) and exists(select 1 from storage.objects o where o.bucket_id='marketplace-verifications' and o.name=v.proof_path)),'listing_type',b.listing_type,'verification_status',b.verification_status,'description',b.description,'logo_url',case when b.listing_type='INTEGRATED' then coalesce(nullif(s.logo_url,''),b.logo_url) else b.logo_url end,
 'cover_url',b.cover_url,'city',b.city,'state',b.state,'neighborhood',b.neighborhood,'address',case when b.listing_type='INTEGRATED' then case when lower(trim(s.pickup_address)) in ('endereco de retirada a configurar','endereço de retirada a configurar') then '' else coalesce(nullif(s.pickup_address,''),b.address) end else b.address end,
 'whatsapp',b.whatsapp,'instagram',b.instagram,'latitude',b.latitude,'longitude',b.longitude,'distance_km',null,
 'rating',(select round(avg(rating),1) from marketplace_reviews where business_id=b.id and status='PUBLISHED'),
 'review_count',(select count(*) from marketplace_reviews where business_id=b.id and status='PUBLISHED'),
 'is_open',case when b.listing_type='INTEGRATED' then (marketplace_open(s.marketplace_is_open,s.marketplace_opening_hours,s.marketplace_timezone) and pdv_tenant_allowed(b.tenant_id)) else marketplace_open(b.is_open,b.opening_hours,b.timezone) end,
 'opening_hours',case when b.listing_type='INTEGRATED' then s.marketplace_opening_hours else b.opening_hours end,
 'featured',b.featured,'delivery_minutes',b.delivery_minutes,'delivery_fee',coalesce(s.delivery_fee,0),'accepts_delivery',coalesce(s.marketplace_accepts_delivery,false),
 'services',coalesce((select jsonb_agg(jsonb_build_object('id',id,'business_id',business_id,'name',name,'description',description,'kind',kind,'price',price,'image_url',image_url)) from marketplace_services where business_id=b.id and is_active),'[]'),
 'reviews',coalesce((select jsonb_agg(r) from(select r.id,r.business_id,split_part(p.full_name,' ',1) display_name,r.rating,r.body,r.created_at from marketplace_reviews r join marketplace_profiles p on p.user_id=r.user_id where r.business_id=b.id and r.status='PUBLISHED' order by r.created_at desc limit 20) r),'[]'))
 from marketplace_businesses b join marketplace_categories c on c.id=b.category_id left join app_settings s on s.tenant_id=b.tenant_id
 where b.id=p_business and b.verification_status='VERIFIED' and c.active and (b.listing_type='STANDARD' or exists(select 1 from tenants t where t.id=b.tenant_id and t.is_active));
$$;

notify pgrst,'reload schema';
commit;
