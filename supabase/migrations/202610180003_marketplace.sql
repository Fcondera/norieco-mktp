-- Additive marketplace. Existing catalog domains, orders and PDV data are retained.
begin;
alter table public.app_settings add column if not exists marketplace_is_open boolean not null default false;
alter table public.app_settings add column if not exists marketplace_opening_hours jsonb not null default '[]';
alter table public.app_settings add column if not exists marketplace_timezone text not null default 'America/Manaus';
alter table public.app_settings add column if not exists marketplace_accepts_delivery boolean not null default false;

create table public.marketplace_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null check(length(full_name) between 3 and 120), avatar_url text not null default '',
 whatsapp text not null check(whatsapp ~ '^[0-9]{10,15}$'), city text not null check(length(city) between 2 and 80),
 state text not null default 'AM' check(state='AM'), neighborhood text not null check(length(neighborhood) between 2 and 100),
 terms_version text not null, completed_at timestamptz not null default now(),
 notification_preferences jsonb not null default '{"orders":true,"news":false}', updated_at timestamptz not null default now()
);
create table public.marketplace_addresses (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 label text not null,recipient text not null,postal_code text not null check(postal_code ~ '^[0-9]{8}$'),
 street text not null,number text not null,complement text not null default '',neighborhood text not null,city text not null,
 state text not null default 'AM' check(state='AM'),reference text not null default '',created_at timestamptz not null default now()
);
create table public.marketplace_categories (
 id uuid primary key default gen_random_uuid(),name text not null unique,icon text not null default 'shop',
 group_name text not null default 'commerce',active boolean not null default true,sort_order integer not null default 0
);
insert into public.marketplace_categories(name,icon,group_name,sort_order) values
 ('Restaurantes','food','food',1),('Lanches','food','food',2),('Bares','drink','food',3),('Roupas','shop','commerce',4),
 ('Mercados','bag','commerce',5),('Farmácias','shop','commerce',6),('Balneários','sun','experience',7),
 ('Diversão','sun','experience',8),('Pôr do sol','sun','experience',9),('Passeios','pin','experience',10),
 ('Beleza','tools','service',11),('Serviços','tools','service',12);
create table public.marketplace_businesses (
 id uuid primary key default gen_random_uuid(),slug text not null unique check(slug ~ '^[a-z0-9][a-z0-9-]{2,99}$'),
 name text not null check(length(name) between 2 and 120),category_id uuid not null references public.marketplace_categories(id),
 listing_type text not null default 'STANDARD' check(listing_type in ('STANDARD','INTEGRATED')),
 verification_status text not null default 'DRAFT' check(verification_status in ('DRAFT','PENDING','VERIFIED','REJECTED','SUSPENDED')),
 tenant_id uuid unique references public.tenants(id),description text not null default '' check(length(description)<=500),
 logo_url text not null default '',cover_url text not null default '',city text not null default '',state text not null default 'AM' check(state='AM'),
 neighborhood text not null default '',address text not null default '',whatsapp text not null default '',email text not null default '',
 instagram text not null default '',latitude numeric check(latitude between -90 and 90),longitude numeric check(longitude between -180 and 180),
 opening_hours jsonb not null default '[]',timezone text not null default 'America/Manaus' check(timezone in ('America/Manaus','America/Eirunepe')),
 is_open boolean not null default false,delivery_minutes integer check(delivery_minutes between 1 and 1440),featured boolean not null default false,
 integration_status text not null default 'NONE' check(integration_status in ('NONE','REQUESTED','CONNECTED')),
 rejection_reason text not null default '',created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check(verification_status<>'VERIFIED' or listing_type<>'INTEGRATED' or tenant_id is not null)
);
create table public.marketplace_members (
 business_id uuid not null references public.marketplace_businesses(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,role text not null default 'OWNER' check(role='OWNER'),
 primary key(business_id,user_id)
);
create table public.marketplace_verifications (
 business_id uuid primary key references public.marketplace_businesses(id) on delete cascade,
 legal_name text not null default '',cpf text not null default '',cnpj text not null default '',identity_path text not null default '',proof_path text not null default '',
 submitted_at timestamptz,reviewed_at timestamptz,reviewed_by uuid references auth.users(id)
);
create table public.marketplace_services (
 id uuid primary key default gen_random_uuid(),business_id uuid not null references public.marketplace_businesses(id) on delete cascade,
 name text not null check(length(name) between 2 and 100),description text not null check(length(description) between 2 and 500)
);
create table public.marketplace_orders (
 id uuid primary key references public.orders(id),business_id uuid not null references public.marketplace_businesses(id),
 user_id uuid not null references auth.users(id),request_key uuid not null,payload_hash text not null,
 integration_source text not null default 'NORIECO' check(integration_source='NORIECO'),created_at timestamptz not null default now(),
 unique(user_id,request_key)
);
create table public.marketplace_favorites (
 user_id uuid not null references auth.users(id) on delete cascade,business_id uuid not null references public.marketplace_businesses(id) on delete cascade,
 primary key(user_id,business_id)
);
create table public.marketplace_reviews (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id),business_id uuid not null references public.marketplace_businesses(id),
 rating integer not null check(rating between 1 and 5),body text not null check(length(body) between 10 and 1000),
 status text not null default 'PENDING' check(status in ('PENDING','PUBLISHED','REJECTED')),created_at timestamptz not null default now(),unique(user_id,business_id)
);
create table public.marketplace_reports (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id),business_id uuid not null references public.marketplace_businesses(id),
 body text not null check(length(body) between 10 and 1000),status text not null default 'OPEN' check(status in ('OPEN','RESOLVED')),created_at timestamptz not null default now()
);
create table public.marketplace_leads (
 id uuid primary key default gen_random_uuid(),business_id uuid not null references public.marketplace_businesses(id),created_at timestamptz not null default now()
);
create table public.marketplace_admins (user_id uuid primary key references auth.users(id));
create table public.marketplace_audit (
 id uuid primary key default gen_random_uuid(),actor uuid references auth.users(id),action text not null,entity_id uuid,
 details jsonb not null default '{}',created_at timestamptz not null default now()
);
create table public.marketplace_rate_limits (key text not null,window_start timestamptz not null,hits integer not null default 1,primary key(key,window_start));
create index on public.marketplace_businesses(verification_status,city,category_id);
create index on public.marketplace_orders(user_id,created_at desc);
create index on public.marketplace_leads(business_id,created_at desc);
create index on public.marketplace_addresses(user_id);
create index on public.marketplace_reviews(business_id,status);
create index on public.marketplace_members(user_id);
create index on public.marketplace_rate_limits(window_start);

create function public.marketplace_is_admin() returns boolean language sql stable security definer set search_path=public as $$
 select auth.uid() is not null and (coalesce(is_owner_admin(),false) or exists(select 1 from marketplace_admins where user_id=auth.uid()))
$$;
create function public.marketplace_is_member(p_business uuid) returns boolean language sql stable security definer set search_path=public as $$
 select auth.uid() is not null and exists(select 1 from marketplace_members where business_id=p_business and user_id=auth.uid())
$$;
create function public.marketplace_require_profile() returns uuid language plpgsql stable security definer set search_path=public as $$
begin
 if auth.uid() is null or not exists(select 1 from marketplace_profiles where user_id=auth.uid()) then raise exception 'Conclua seu cadastro para continuar.'; end if;
 return auth.uid();
end $$;
create function public.marketplace_rate(p_action text,p_limit integer) returns void language plpgsql security definer set search_path=public as $$
declare k text; n integer; h jsonb:=coalesce(nullif(current_setting('request.headers',true),'')::jsonb,'{}');
begin
 if auth.uid() is null then
 insert into marketplace_rate_limits(key,window_start) values('anonymous-global:'||p_action,date_trunc('minute',clock_timestamp()))
 on conflict(key,window_start) do update set hits=marketplace_rate_limits.hits+1 returning hits into n;
 if n>500 then raise exception 'Muitas consultas neste momento. Tente novamente em um minuto.';end if;
 end if;
 -- Gateway forwarded IP is hashed, never stored in clear. Authenticated writes bind to JWT uid.
 k:=p_action||':'||md5(coalesce(auth.uid()::text,nullif(split_part(coalesce(h->>'x-nf-client-connection-ip',h->>'x-forwarded-for','anonymous'),',',1),''),'anonymous'));
 insert into marketplace_rate_limits(key,window_start) values(k,date_trunc('minute',clock_timestamp()))
 on conflict(key,window_start) do update set hits=marketplace_rate_limits.hits+1 returning hits into n;
 if n>p_limit then raise exception 'Muitas tentativas. Aguarde um minuto e tente novamente.'; end if;
 delete from marketplace_rate_limits where window_start<now()-interval '1 day';
end $$;
-- Default-deny on every new relation. Mutations are exclusively validated RPCs.
do $$ declare t text; begin
 foreach t in array array['profiles','addresses','categories','businesses','members','verifications','services','orders','favorites','reviews','reports','leads','admins','audit','rate_limits'] loop
 execute format('alter table public.marketplace_%I enable row level security',t);
 execute format('revoke all on public.marketplace_%I from public,anon,authenticated',t);
 end loop;
end $$;
grant select on marketplace_profiles,marketplace_addresses,marketplace_members,marketplace_verifications,marketplace_orders,marketplace_favorites,marketplace_reviews,marketplace_reports to authenticated;
create policy own_profile on marketplace_profiles for select to authenticated using(user_id=auth.uid());
create policy own_address on marketplace_addresses for select to authenticated using(user_id=auth.uid());
create policy own_member on marketplace_members for select to authenticated using(user_id=auth.uid());
create policy own_verification on marketplace_verifications for select to authenticated using(marketplace_is_member(business_id) or marketplace_is_admin());
create policy own_order on marketplace_orders for select to authenticated using(user_id=auth.uid() or marketplace_is_member(business_id) or marketplace_is_admin());
create policy own_favorite on marketplace_favorites for select to authenticated using(user_id=auth.uid());
create policy own_review on marketplace_reviews for select to authenticated using(user_id=auth.uid());
create policy own_report on marketplace_reports for select to authenticated using(user_id=auth.uid());

create function public.marketplace_my_profile() returns jsonb language sql stable security definer set search_path=public as $$
 select to_jsonb(p)||jsonb_build_object('is_admin',marketplace_is_admin()) from marketplace_profiles p where user_id=auth.uid()
$$;
create function public.marketplace_save_profile(p_data jsonb) returns void language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); photo text;
begin
 if u is null then raise exception 'Entre para continuar.'; end if;
 perform marketplace_rate('profile',20);
 if coalesce((p_data->>'terms')::boolean,false) is not true then raise exception 'Aceite os termos e a política de privacidade.'; end if;
 select coalesce(raw_user_meta_data->>'avatar_url','') into photo from auth.users where id=u;
 insert into marketplace_profiles(user_id,full_name,avatar_url,whatsapp,city,state,neighborhood,terms_version,notification_preferences)
 values(u,trim(p_data->>'full_name'),photo,regexp_replace(p_data->>'whatsapp','\D','','g'),trim(p_data->>'city'),'AM',trim(p_data->>'neighborhood'),'2026-10-18',
 jsonb_build_object('orders',true,'news',coalesce((p_data->'notification_preferences'->>'news')::boolean,false)))
 on conflict(user_id) do update set full_name=excluded.full_name,whatsapp=excluded.whatsapp,city=excluded.city,neighborhood=excluded.neighborhood,
 notification_preferences=excluded.notification_preferences,updated_at=now();
end $$;
create function public.marketplace_addresses() returns jsonb language sql stable security definer set search_path=public as $$
 select coalesce(jsonb_agg(to_jsonb(a)-'user_id' order by created_at desc),'[]') from marketplace_addresses a where user_id=auth.uid()
$$;
create function public.marketplace_save_address(p_data jsonb) returns uuid language plpgsql security definer set search_path=public as $$
declare u uuid:=marketplace_require_profile(); a uuid:=coalesce(nullif(p_data->>'id','')::uuid,gen_random_uuid()); k text;
begin
 perform marketplace_rate('address',20);
 foreach k in array array['label','recipient','street','number','neighborhood','city'] loop
 if length(trim(coalesce(p_data->>k,''))) not between 1 and 160 then raise exception 'Preencha corretamente o endereço.'; end if; end loop;
 if exists(select 1 from marketplace_addresses where id=a and user_id<>u) then raise exception 'Endereço não pertence à sua conta.'; end if;
 if (select count(*) from marketplace_addresses where user_id=u)>=20 and not exists(select 1 from marketplace_addresses where id=a) then raise exception 'Limite de 20 endereços.'; end if;
 insert into marketplace_addresses(id,user_id,label,recipient,postal_code,street,number,complement,neighborhood,city,state,reference)
 values(a,u,p_data->>'label',p_data->>'recipient',regexp_replace(p_data->>'postal_code','\D','','g'),p_data->>'street',p_data->>'number',left(coalesce(p_data->>'complement',''),160),p_data->>'neighborhood',p_data->>'city','AM',left(coalesce(p_data->>'reference',''),160))
 on conflict(id) do update set label=excluded.label,recipient=excluded.recipient,postal_code=excluded.postal_code,street=excluded.street,number=excluded.number,complement=excluded.complement,neighborhood=excluded.neighborhood,city=excluded.city,reference=excluded.reference where marketplace_addresses.user_id=u;
 return a;
end $$;
create function public.marketplace_delete_address(p_id uuid) returns void language sql security definer set search_path=public as $$delete from marketplace_addresses where id=p_id and user_id=auth.uid()$$;
create function public.marketplace_categories() returns jsonb language sql stable security definer set search_path=public as $$select coalesce(jsonb_agg(c order by sort_order),'[]') from marketplace_categories c where active$$;

create function public.marketplace_validate_hours(p_hours jsonb) returns void language plpgsql immutable as $$
declare h jsonb; days integer[]:='{}'; d integer;
begin
 if jsonb_typeof(p_hours)<>'array' or jsonb_array_length(p_hours)>7 then raise exception 'Horários inválidos.'; end if;
 for h in select * from jsonb_array_elements(p_hours) loop
 d:=(h->>'day')::integer;
 if d is null or d not between 0 and 6 or d=any(days) or coalesce(h->>'open','') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or coalesce(h->>'close','') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or coalesce(jsonb_typeof(h->'enabled'),'null')<>'boolean' then raise exception 'Horários inválidos.'; end if;
 days:=array_append(days,d);
 end loop;
end $$;
create function public.marketplace_open(p_enabled boolean,p_hours jsonb,p_timezone text) returns boolean language sql stable as $$
 with local as(select now() at time zone p_timezone as ts), periods as(select (h->>'day')::int weekday,(h->>'open')::time start_at,(h->>'close')::time end_at from jsonb_array_elements(p_hours) h where (h->>'enabled')::boolean)
 select p_enabled and exists(select 1 from periods,local where
 (weekday=extract(dow from ts) and ((start_at<end_at and ts::time>=start_at and ts::time<end_at) or (start_at>=end_at and ts::time>=start_at)))
 or (weekday=(extract(dow from ts)::int+6)%7 and start_at>=end_at and ts::time<end_at))
$$;
create function public.marketplace_public_business(p_business uuid) returns jsonb language sql stable security definer set search_path=public as $$
 select jsonb_build_object('id',b.id,'slug',b.slug,'name',b.name,'category_id',b.category_id,'category_name',c.name,
 'listing_type',b.listing_type,'verification_status',b.verification_status,'description',b.description,'logo_url',case when b.listing_type='INTEGRATED' then coalesce(nullif(s.logo_url,''),b.logo_url) else b.logo_url end,
 'cover_url',b.cover_url,'city',b.city,'state',b.state,'neighborhood',b.neighborhood,'address',case when b.listing_type='INTEGRATED' then coalesce(nullif(s.pickup_address,''),b.address) else b.address end,
 'whatsapp',b.whatsapp,'instagram',b.instagram,'latitude',b.latitude,'longitude',b.longitude,'distance_km',null,
 'rating',(select round(avg(rating),1) from marketplace_reviews where business_id=b.id and status='PUBLISHED'),
 'review_count',(select count(*) from marketplace_reviews where business_id=b.id and status='PUBLISHED'),
 'is_open',case when b.listing_type='INTEGRATED' then marketplace_open(s.marketplace_is_open,s.marketplace_opening_hours,s.marketplace_timezone) else marketplace_open(b.is_open,b.opening_hours,b.timezone) end,
 'opening_hours',case when b.listing_type='INTEGRATED' then s.marketplace_opening_hours else b.opening_hours end,
 'featured',b.featured,'delivery_minutes',b.delivery_minutes,'delivery_fee',coalesce(s.delivery_fee,0),'accepts_delivery',coalesce(s.marketplace_accepts_delivery,false),
 'services',coalesce((select jsonb_agg(jsonb_build_object('id',id,'business_id',business_id,'name',name,'description',description)) from marketplace_services where business_id=b.id),'[]'),
 'reviews',coalesce((select jsonb_agg(r) from(select r.id,r.business_id,split_part(p.full_name,' ',1) display_name,r.rating,r.body,r.created_at from marketplace_reviews r join marketplace_profiles p on p.user_id=r.user_id where r.business_id=b.id and r.status='PUBLISHED' order by r.created_at desc limit 20) r),'[]'))
 from marketplace_businesses b join marketplace_categories c on c.id=b.category_id left join app_settings s on s.tenant_id=b.tenant_id
 where b.id=p_business and b.verification_status='VERIFIED' and c.active and (b.listing_type='STANDARD' or exists(select 1 from tenants t where t.id=b.tenant_id and t.is_active));
$$;
create function public.marketplace_search(p_query text default '',p_city text default '',p_category text default '') returns jsonb language plpgsql security definer set search_path=public as $$
begin
 perform marketplace_rate('search',120);
 if length(p_query)>100 or length(p_city)>80 then raise exception 'Busca muito longa.'; end if;
 return coalesce((select jsonb_agg(public_data order by featured desc,name) from(
 select marketplace_public_business(b.id) public_data,b.featured,b.name from marketplace_businesses b join marketplace_categories c on c.id=b.category_id
 where b.verification_status='VERIFIED' and c.active and (p_city='' or lower(b.city)=lower(p_city)) and (p_category='' or b.category_id::text=p_category or c.name=p_category)
 and (p_query='' or b.name ilike '%'||p_query||'%' or b.description ilike '%'||p_query||'%' or c.name ilike '%'||p_query||'%'
 or exists(select 1 from marketplace_services where business_id=b.id and name ilike '%'||p_query||'%')
 or exists(select 1 from products p where p.tenant_id=b.tenant_id and p.is_active and p.is_published and p.is_available and p.name ilike '%'||p_query||'%'))
 and (b.listing_type='STANDARD' or exists(select 1 from tenants t where t.id=b.tenant_id and t.is_active))
 order by b.featured desc,b.name limit 60) q),'[]');
end $$;
create function public.marketplace_business(p_slug text) returns jsonb language plpgsql security definer set search_path=public as $$
declare b marketplace_businesses; data jsonb; items jsonb:='[]';
begin
 perform marketplace_rate('catalog',120);
 select * into b from marketplace_businesses where slug=p_slug and verification_status='VERIFIED';
 data:=marketplace_public_business(b.id);
 if data is null then return jsonb_build_object('business',null,'products','[]'::jsonb); end if;
 if b.listing_type='INTEGRATED' then
 select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'category',p.species,'image_url',p.main_image_url,'description',p.short_description,
 'price',coalesce(p.promotional_price_per_kg,p.price_per_kg),'sale_mode',p.sale_mode,'average_weight',p.average_weight_kg,
 'available',qty,'min_quantity',p.minimum_quantity,'featured',p.is_featured,'options',p.preparation_options,'price_tiers',p.price_tiers) order by p.is_featured desc,p.name),'[]') into items
 from products p cross join lateral(select catalog_stock_available(p.id,p.tenant_id) qty) stock
 where p.tenant_id=b.tenant_id and p.is_active and p.is_published and p.is_available and qty>0;
 end if;
 return jsonb_build_object('business',data,'products',items);
end $$;

create function public.marketplace_my_businesses() returns jsonb language sql stable security definer set search_path=public as $$
 select coalesce(jsonb_agg((to_jsonb(b)-'tenant_id')||to_jsonb(v)||jsonb_build_object('leads_count',(select count(*) from marketplace_leads where business_id=b.id),
 'services',coalesce((select jsonb_agg(s) from marketplace_services s where business_id=b.id),'[]')) order by b.created_at desc),'[]')
 from marketplace_businesses b join marketplace_verifications v on v.business_id=b.id where marketplace_is_member(b.id)
$$;
create function public.marketplace_valid_document(p_number text,p_kind text) returns boolean language plpgsql immutable as $$
declare n text:=regexp_replace(coalesce(p_number,''),'\D','','g');base integer;pass integer;i integer;weight integer;total integer;digit integer;
begin
 base:=case when p_kind='CPF' then 9 when p_kind='CNPJ' then 12 else 0 end;
 if base=0 or length(n)<>base+2 or n ~ '^([0-9])\1+$' then return false;end if;
 for pass in 0..1 loop
 total:=0;
 for i in 1..base+pass loop
 weight:=case when p_kind='CPF' then base+pass+2-i else ((base+pass-i)%8)+2 end;
 total:=total+substr(n,i,1)::integer*weight;
 end loop;
 digit:=case when total%11<2 then 0 else 11-total%11 end;
 if digit<>substr(n,base+pass+1,1)::integer then return false;end if;
 end loop;
 return true;
end $$;
create function public.marketplace_save_business(p_data jsonb,p_submit boolean default false) returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=marketplace_require_profile(); i uuid:=coalesce(nullif(p_data->>'id','')::uuid,gen_random_uuid()); b marketplace_businesses; k text; val text; cat uuid;
begin
 perform marketplace_rate('business',12);
 select * into b from marketplace_businesses where id=i for update;
 if found and not marketplace_is_member(i) then raise exception 'Sem acesso à empresa.'; end if;
 if b.verification_status='SUSPENDED' then raise exception 'Empresa suspensa. Contate o suporte.'; end if;
 if b.id is null and (select count(*) from marketplace_members where user_id=u)>=5 then raise exception 'Contate o suporte para cadastrar mais empresas.'; end if;
 cat:=(p_data->>'category_id')::uuid;
 if not exists(select 1 from marketplace_categories where id=cat and active) then raise exception 'Selecione uma categoria.'; end if;
 perform marketplace_validate_hours(coalesce(p_data->'opening_hours','[]'));
 foreach k in array array['name','whatsapp','email','city','neighborhood','address','description','legal_name'] loop
 val:=trim(coalesce(p_data->>k,'')); if length(val)<2 or length(val)>(case when k='description' then 500 when k='address' then 240 else 120 end) then raise exception 'Preencha corretamente: %.',k; end if;
 end loop;
 if regexp_replace(p_data->>'whatsapp','\D','','g') !~ '^[0-9]{10,15}$' or p_data->>'email' !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Contato inválido.'; end if;
 if coalesce(p_data->>'listing_type','STANDARD') not in ('STANDARD','INTEGRATED') then raise exception 'Tipo inválido.'; end if;
 foreach k in array array['logo_url','cover_url','instagram'] loop if coalesce(p_data->>k,'')<>'' and (p_data->>k !~ '^https://' or length(p_data->>k)>2048) then raise exception 'Use uma URL HTTPS válida.'; end if; end loop;
 foreach k in array array['identity_path','proof_path'] loop
 if coalesce(p_data->>k,'')<>'' and (split_part(p_data->>k,'/',1)<>u::text or split_part(p_data->>k,'/',2)<>i::text or p_data->>k like '%..%') then raise exception 'Documento de outra empresa.'; end if;
 end loop;
 if p_submit and (not marketplace_valid_document(p_data->>'cpf','CPF') or coalesce(p_data->>'identity_path','')='' or coalesce(p_data->>'proof_path','')='') then raise exception 'Preencha um CPF válido e envie os dois documentos.'; end if;
 if p_submit and coalesce(p_data->>'cnpj','')<>'' and not marketplace_valid_document(p_data->>'cnpj','CNPJ') then raise exception 'CNPJ inválido.';end if;
 if p_submit and (not exists(select 1 from storage.objects where bucket_id='marketplace-verifications' and name=p_data->>'identity_path') or not exists(select 1 from storage.objects where bucket_id='marketplace-verifications' and name=p_data->>'proof_path')) then raise exception 'Envie os documentos antes de concluir.'; end if;
 insert into marketplace_businesses(id,slug,name,category_id,listing_type,verification_status,description,logo_url,cover_url,city,neighborhood,address,whatsapp,email,instagram,opening_hours,timezone,is_open,integration_status)
 values(i,'empresa-'||replace(i::text,'-',''),trim(p_data->>'name'),cat,coalesce(p_data->>'listing_type','STANDARD'),case when p_submit then 'PENDING' else 'DRAFT' end,
 p_data->>'description',coalesce(p_data->>'logo_url',''),coalesce(p_data->>'cover_url',''),p_data->>'city',p_data->>'neighborhood',p_data->>'address',regexp_replace(p_data->>'whatsapp','\D','','g'),p_data->>'email',coalesce(p_data->>'instagram',''),coalesce(p_data->'opening_hours','[]'),coalesce(p_data->>'timezone','America/Manaus'),coalesce((p_data->>'is_open')::boolean,false),case when p_data->>'listing_type'='INTEGRATED' then 'REQUESTED' else 'NONE' end)
 on conflict(id) do update set name=excluded.name,category_id=excluded.category_id,description=excluded.description,logo_url=excluded.logo_url,cover_url=excluded.cover_url,city=excluded.city,neighborhood=excluded.neighborhood,address=excluded.address,whatsapp=excluded.whatsapp,email=excluded.email,instagram=excluded.instagram,opening_hours=excluded.opening_hours,timezone=excluded.timezone,is_open=excluded.is_open,
 verification_status=case when p_submit then 'PENDING' else 'DRAFT' end,updated_at=now();
 insert into marketplace_members(business_id,user_id) values(i,u) on conflict do nothing;
 insert into marketplace_verifications(business_id,legal_name,cpf,cnpj,identity_path,proof_path,submitted_at)
 values(i,p_data->>'legal_name',regexp_replace(coalesce(p_data->>'cpf',''),'\D','','g'),regexp_replace(coalesce(p_data->>'cnpj',''),'\D','','g'),coalesce(p_data->>'identity_path',''),coalesce(p_data->>'proof_path',''),case when p_submit then now() end)
 on conflict(business_id) do update set legal_name=excluded.legal_name,cpf=excluded.cpf,cnpj=excluded.cnpj,identity_path=excluded.identity_path,proof_path=excluded.proof_path,submitted_at=excluded.submitted_at;
 return jsonb_build_object('id',i);
end $$;
create function public.marketplace_request_integration(p_business uuid) returns void language plpgsql security definer set search_path=public as $$
begin
 perform marketplace_require_profile(); if not marketplace_is_member(p_business) then raise exception 'Sem acesso.'; end if;
 update marketplace_businesses set integration_status='REQUESTED' where id=p_business and integration_status<>'CONNECTED';
 insert into marketplace_audit(actor,action,entity_id) values(auth.uid(),'INTEGRATION_REQUESTED',p_business);
end $$;
create function public.marketplace_save_service(p_business uuid,p_data jsonb,p_delete boolean default false) returns void language plpgsql security definer set search_path=public as $$
declare i uuid:=coalesce(nullif(p_data->>'id','')::uuid,gen_random_uuid());
begin
 perform marketplace_require_profile();perform marketplace_rate('service',30);
 if not marketplace_is_member(p_business) or not exists(select 1 from marketplace_businesses where id=p_business and listing_type='STANDARD' and verification_status<>'SUSPENDED') then raise exception 'Sem acesso.'; end if;
 if exists(select 1 from marketplace_services where id=i and business_id<>p_business) then raise exception 'Sem acesso ao serviço.'; end if;
 if p_delete then delete from marketplace_services where id=i and business_id=p_business; return; end if;
 insert into marketplace_services(id,business_id,name,description) values(i,p_business,p_data->>'name',p_data->>'description') on conflict(id) do update set name=excluded.name,description=excluded.description;
end $$;

create function public.marketplace_toggle_favorite(p_business uuid) returns void language plpgsql security definer set search_path=public as $$
declare u uuid:=marketplace_require_profile(); begin
 perform marketplace_rate('favorite',40);if marketplace_public_business(p_business) is null then raise exception 'Empresa indisponível.'; end if;
 delete from marketplace_favorites where user_id=u and business_id=p_business;if not found then insert into marketplace_favorites values(u,p_business);end if;
end $$;
create function public.marketplace_favorites() returns jsonb language sql stable security definer set search_path=public as $$select coalesce(jsonb_agg(data),'[]') from(select marketplace_public_business(business_id) data from marketplace_favorites where user_id=auth.uid()) f where data is not null$$;
create function public.marketplace_lead(p_slug text) returns void language plpgsql security definer set search_path=public as $$
declare i uuid; begin perform marketplace_rate('lead',15);select id into i from marketplace_businesses where slug=p_slug and verification_status='VERIFIED';if i is null then raise exception 'Empresa indisponível.';end if;insert into marketplace_leads(business_id) values(i);end $$;
create function public.marketplace_review(p_business uuid,p_rating integer,p_body text) returns void language plpgsql security definer set search_path=public as $$
declare u uuid:=marketplace_require_profile();begin perform marketplace_rate('review',5);if marketplace_public_business(p_business) is null then raise exception 'Empresa indisponível.';end if;if marketplace_is_member(p_business) then raise exception 'Você não pode avaliar sua empresa.';end if;
 insert into marketplace_reviews(user_id,business_id,rating,body) values(u,p_business,p_rating,trim(p_body)) on conflict(user_id,business_id) do update set rating=excluded.rating,body=excluded.body,status='PENDING';end $$;
create function public.marketplace_my_reviews() returns jsonb language sql stable security definer set search_path=public as $$select coalesce(jsonb_agg(r order by created_at desc),'[]') from marketplace_reviews r where user_id=auth.uid()$$;
create function public.marketplace_report(p_business uuid,p_body text) returns void language plpgsql security definer set search_path=public as $$declare u uuid:=marketplace_require_profile();begin perform marketplace_rate('report',5);if marketplace_public_business(p_business) is null then raise exception 'Empresa indisponível.';end if;insert into marketplace_reports(user_id,business_id,body) values(u,p_business,trim(p_body));end $$;

create function public.marketplace_checkout(p_slug text,p_key uuid,p_items jsonb,p_receiving text,p_address uuid,p_payment text,p_notes text default '',p_expected_total numeric default null) returns jsonb language plpgsql security definer set search_path=public as $$
declare
 u uuid:=marketplace_require_profile(); b marketplace_businesses; p marketplace_profiles; a marketplace_addresses;s app_settings;
 h text:=md5(jsonb_build_array(p_slug,p_items,p_receiving,p_address,p_payment,p_notes)::text);existing marketplace_orders;
 old_sub text:=current_setting('request.jwt.claim.sub',true);old_claims text:=current_setting('request.jwt.claims',true);old_headers text:=current_setting('request.headers',true);
 domain text;oid uuid;payload jsonb;item jsonb;clean_items jsonb:='[]';
begin
 perform pg_advisory_xact_lock(hashtextextended('marketplace:'||u::text||':'||p_key::text,0));
 select * into existing from marketplace_orders where user_id=u and request_key=p_key;
 if found then if existing.payload_hash<>h then raise exception 'Pedido repetido com dados diferentes.';end if;return jsonb_build_object('id',existing.id);end if;
 perform marketplace_rate('checkout',10);
 select * into b from marketplace_businesses where slug=p_slug and verification_status='VERIFIED' and listing_type='INTEGRATED';
 if b.id is null or marketplace_public_business(b.id) is null then raise exception 'Loja indisponível.';end if;
 select * into s from app_settings where tenant_id=b.tenant_id;
 if not coalesce(marketplace_open(s.marketplace_is_open,s.marketplace_opening_hours,s.marketplace_timezone),false) then raise exception 'A loja está fechada.';end if;
 if p_receiving not in ('pickup','delivery') or p_payment not in ('Pix','Dinheiro','Cartão na entrega/retirada') or length(p_notes)>500 then raise exception 'Dados do pedido inválidos.';end if;
 select * into p from marketplace_profiles where user_id=u;
 if p_receiving='delivery' then
 if not s.marketplace_accepts_delivery then raise exception 'Loja aceita somente retirada.';end if;
 select * into a from marketplace_addresses where id=p_address and user_id=u;
 if a.id is null then raise exception 'Selecione um endereço da sua conta.';end if;
 if not (a.city=any(s.cities)) or (cardinality(s.neighborhoods)>0 and not(a.neighborhood=any(s.neighborhoods))) then raise exception 'Este endereço não está na área atendida pela loja.';end if;
 end if;
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items) not between 1 and 100 then raise exception 'Carrinho inválido.';end if;
 for item in select * from jsonb_array_elements(p_items) loop
 if coalesce((item->>'quantity')::numeric,0) not between 1 and 999 or (item->>'quantity')::numeric<>trunc((item->>'quantity')::numeric) or length(coalesce(item->>'notes',''))>500 then raise exception 'Quantidade ou observação inválida.';end if;
 if not exists(select 1 from products where id=(item->>'productId')::uuid and tenant_id=b.tenant_id and is_active and is_published and is_available) then raise exception 'Produto indisponível nesta loja.';end if;
 clean_items:=clean_items||jsonb_build_array(jsonb_build_object('productId',item->>'productId','quantity',(item->>'quantity')::integer,'preparationId',left(coalesce(item->>'preparationId',''),100)));
 end loop;
 select hostname into domain from tenant_domains where tenant_id=b.tenant_id and is_active order by created_at limit 1;
 if domain is null then select custom_domain into domain from tenants where id=b.tenant_id and is_active;end if;
 if domain is null or tenant_id_for_domain(domain) is distinct from b.tenant_id then raise exception 'Integração de domínio indisponível. Contate a loja.';end if;
 payload:=jsonb_build_object('origin','WEBSITE','requestKey',p_key,'orderId','NE-'||upper(substr(replace(p_key::text,'-',''),1,12)),
 'customer',jsonb_build_object('name',p.full_name,'phone',p.whatsapp),'items',clean_items,
 'receivingType',case when p_receiving='delivery' then 'Entrega' else 'Retirada no local' end,
 'address',case when p_receiving='delivery' then concat_ws(', ',a.street,a.number,nullif(a.complement,''),a.neighborhood,a.city,a.state,a.postal_code) else '' end,
 'reference',coalesce(a.reference,''),'recipientName',coalesce(a.recipient,p.full_name),'paymentMethod',p_payment,
 'observation',left('NoriEco. '||coalesce(p_notes,'')||coalesce((select string_agg(E'\n'||pr.name||': '||(i->>'notes'),'') from jsonb_array_elements(p_items) i join products pr on pr.id=(i->>'productId')::uuid and pr.tenant_id=b.tenant_id where coalesce(i->>'notes','')<>''),''),8000),
 'deliveryFee',case when p_receiving='delivery' then s.delivery_fee else 0 end);
 -- Reuse existing anonymous catalog checkout with a server-resolved domain.
 -- Both auth.uid formats are cleared locally and restored even after failure.
 begin
 perform set_config('request.jwt.claim.sub','',true);
 perform set_config('request.jwt.claims',(coalesce(nullif(old_claims,'')::jsonb,'{}')-'sub')::text,true);
 perform set_config('request.headers',jsonb_build_object('x-catalog-domain',domain)::text,true);
 oid:=create_website_order(payload)::uuid;
 perform set_config('request.jwt.claim.sub',coalesce(old_sub,''),true);
 perform set_config('request.jwt.claims',coalesce(old_claims,''),true);
 perform set_config('request.headers',coalesce(old_headers,''),true);
 exception when others then
 perform set_config('request.jwt.claim.sub',coalesce(old_sub,''),true);perform set_config('request.jwt.claims',coalesce(old_claims,''),true);perform set_config('request.headers',coalesce(old_headers,''),true);raise;
 end;
 if not exists(select 1 from orders where id=oid and tenant_id=b.tenant_id) then raise exception 'Falha na atribuição do pedido.';end if;
 if p_expected_total is null or not exists(select 1 from orders where id=oid and round(estimated_total,2)=round(p_expected_total,2)) then raise exception 'O preço ou a taxa mudou. Volte ao cardápio e confira os valores antes de confirmar.';end if;
 insert into marketplace_orders(id,business_id,user_id,request_key,payload_hash) values(oid,b.id,u,p_key,h);
 return jsonb_build_object('id',oid);
end $$;
create function public.marketplace_my_orders() returns jsonb language sql stable security definer set search_path=public as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',o.id,'business_slug',b.slug,'business_name',b.name,'number',o.number,'status',o.status,'payment_status',p.payment_status,
 'total',case when o.final_total>0 then o.final_total else o.estimated_total end,'created_at',o.created_at,'receiving_type',o.receiving_type,
 'items',(select coalesce(jsonb_agg(jsonb_build_object('product_name',product_name,'quantity',quantity,'subtotal',case when final_subtotal>0 then final_subtotal else estimated_subtotal end)),'[]') from order_items where order_id=o.id and tenant_id=b.tenant_id)) order by o.created_at desc),'[]')
 from marketplace_orders mo join marketplace_businesses b on b.id=mo.business_id join orders o on o.id=mo.id and o.tenant_id=b.tenant_id left join payments p on p.order_id=o.id and p.tenant_id=b.tenant_id where mo.user_id=auth.uid()
$$;

create function public.marketplace_admin_data() returns jsonb language plpgsql stable security definer set search_path=public as $$
begin if not marketplace_is_admin() then raise exception 'Acesso exclusivo da administração NoriEco.';end if;
 return jsonb_build_object('businesses',coalesce((select jsonb_agg(to_jsonb(b)||to_jsonb(v)) from marketplace_businesses b left join marketplace_verifications v on v.business_id=b.id),'[]'),
 'reviews',coalesce((select jsonb_agg(r) from marketplace_reviews r),'[]'),'reports',coalesce((select jsonb_agg(r) from marketplace_reports r),'[]'),
 'orders',coalesce((select jsonb_agg(q) from(select o.id,b.name business_name,o.number,o.estimated_total total,o.created_at from marketplace_orders mo join marketplace_businesses b on b.id=mo.business_id join orders o on o.id=mo.id and o.tenant_id=b.tenant_id order by o.created_at desc limit 200) q),'[]'),
 'categories',(select jsonb_agg(c order by sort_order) from marketplace_categories c),'tenants',(select jsonb_agg(jsonb_build_object('id',id,'name',name)) from tenants where is_active),
 'audit',coalesce((select jsonb_agg(q) from(select id,action,entity_id,created_at from marketplace_audit order by created_at desc limit 200) q),'[]'));
end $$;
create function public.marketplace_admin_action(p_action text,p_id uuid,p_data jsonb default '{}') returns void language plpgsql security definer set search_path=public as $$
declare b marketplace_businesses;t uuid;
begin
 if not marketplace_is_admin() then raise exception 'Acesso exclusivo da administração NoriEco.';end if;
 perform marketplace_rate('admin',60);
 if p_action in ('approve','reject','suspend','feature') then
 select * into b from marketplace_businesses where id=p_id for update;if not found then raise exception 'Empresa não encontrada.';end if;
 if p_action in ('reject','suspend') and length(trim(coalesce(p_data->>'reason','')))<5 then raise exception 'Informe o motivo da decisão.';end if;
 if p_action='approve' then
 t:=coalesce(nullif(p_data->>'tenant_id','')::uuid,b.tenant_id);
 if (b.listing_type='INTEGRATED' or (b.integration_status='REQUESTED' and t is not null)) and not exists(select 1 from tenants where id=t and is_active) then raise exception 'Vincule uma empresa ativa no Nori Gestão.';end if;
 if not exists(select 1 from marketplace_verifications v where business_id=b.id and submitted_at is not null
 and exists(select 1 from storage.objects where bucket_id='marketplace-verifications' and name=v.identity_path)
 and exists(select 1 from storage.objects where bucket_id='marketplace-verifications' and name=v.proof_path)) then raise exception 'Documentação de verificação ausente ou cadastro ainda não enviado.';end if;
 update marketplace_businesses set verification_status='VERIFIED',tenant_id=case when listing_type='INTEGRATED' or (integration_status='REQUESTED' and t is not null) then t else null end,listing_type=case when integration_status='REQUESTED' and t is not null then 'INTEGRATED' else listing_type end,integration_status=case when listing_type='INTEGRATED' or (integration_status='REQUESTED' and t is not null) then 'CONNECTED' else integration_status end,rejection_reason='',updated_at=now() where id=b.id;
 update marketplace_verifications set reviewed_at=now(),reviewed_by=auth.uid() where business_id=b.id;
 elsif p_action='feature' then update marketplace_businesses set featured=not featured where id=b.id;
 else update marketplace_businesses set verification_status=case when p_action='reject' then 'REJECTED' else 'SUSPENDED' end,rejection_reason=left(p_data->>'reason',500),updated_at=now() where id=b.id;end if;
 elsif p_action='category' then update marketplace_categories set active=(p_data->>'active')::boolean where id=p_id;
 elsif p_action in ('review_publish','review_reject') then update marketplace_reviews set status=case when p_action='review_publish' then 'PUBLISHED' else 'REJECTED' end where id=p_id;
 elsif p_action='report_resolve' then update marketplace_reports set status='RESOLVED' where id=p_id;
 else raise exception 'Ação inválida.';end if;
 insert into marketplace_audit(actor,action,entity_id,details) values(auth.uid(),p_action,p_id,jsonb_build_object('reason',left(p_data->>'reason',500)));
end $$;

create function public.marketplace_store_settings(p_data jsonb default null) returns jsonb language plpgsql security definer set search_path=public as $$
declare t uuid:=current_tenant_id();s app_settings;
begin
 if t is null or not coalesce(current_app_role()='ADMINISTRATOR',false) then raise exception 'Apenas o administrador da empresa pode configurar.';end if;
 if p_data is not null then
 perform marketplace_validate_hours(p_data->'hours');
 if p_data->>'timezone' not in ('America/Manaus','America/Eirunepe') then raise exception 'Fuso inválido.';end if;
 update app_settings set marketplace_is_open=(p_data->>'enabled')::boolean,marketplace_opening_hours=p_data->'hours',marketplace_timezone=p_data->>'timezone',marketplace_accepts_delivery=(p_data->>'delivery')::boolean where tenant_id=t;
 end if;
 select * into s from app_settings where tenant_id=t;
 return jsonb_build_object('enabled',s.marketplace_is_open,'hours',s.marketplace_opening_hours,'timezone',s.marketplace_timezone,'delivery',s.marketplace_accepts_delivery);
end $$;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('marketplace-verifications','marketplace-verifications',false,5242880,array['image/jpeg','image/png','application/pdf']),
 ('marketplace-images','marketplace-images',true,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create function public.marketplace_can_upload(p_path text) returns boolean language sql stable security definer set search_path=public as $$
 select split_part(p_path,'/',1)=auth.uid()::text and p_path not like '%..%' and exists(
 select 1 from marketplace_members m join marketplace_businesses b on b.id=m.business_id where m.business_id::text=split_part(p_path,'/',2) and m.user_id=auth.uid() and b.verification_status<>'SUSPENDED')
$$;
create policy marketplace_document_read on storage.objects for select to authenticated using(bucket_id='marketplace-verifications' and
 (marketplace_is_admin() or (split_part(name,'/',1)=auth.uid()::text and exists(select 1 from marketplace_members where business_id::text=split_part(name,'/',2) and user_id=auth.uid()))));
create policy marketplace_file_insert on storage.objects for insert to authenticated with check(bucket_id in ('marketplace-verifications','marketplace-images') and marketplace_can_upload(name));
create policy marketplace_image_public on storage.objects for select to anon,authenticated using(bucket_id='marketplace-images');
-- Deliberately no UPDATE/DELETE: reviewed document evidence cannot be overwritten.

-- Import real PDV accounts privately. No store is represented as verified before
-- its representative supplies documents and an administrator reviews them.
insert into marketplace_businesses(slug,name,category_id,listing_type,verification_status,tenant_id,description,logo_url,cover_url,city,address,whatsapp,integration_status)
 select t.slug,t.name,(select id from marketplace_categories where name=case when t.business_type in ('RESTAURANT','SNACKBAR') then 'Restaurantes' else 'Mercados' end),
 'INTEGRATED','DRAFT',t.id,'',coalesce(s.logo_url,''),coalesce((select image_url from home_banners where tenant_id=t.id and is_active order by display_order limit 1),''),
 coalesce(s.cities[1],''),coalesce(s.pickup_address,''),coalesce(s.whatsapp,''),'CONNECTED'
 from tenants t join app_settings s on s.tenant_id=t.id where t.is_active;
insert into marketplace_members(business_id,user_id) select b.id,p.id from marketplace_businesses b join profiles p on p.tenant_id=b.tenant_id where p.is_active and p.role='ADMINISTRATOR';
insert into marketplace_verifications(business_id) select id from marketplace_businesses;

-- Function allowlist: internal helpers are never callable as arbitrary privileged RPCs.
do $$ declare r record; begin
 for r in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'marketplace_%' loop
 execute 'revoke all on function '||r.signature||' from public,anon,authenticated';end loop;
end $$;
grant execute on function marketplace_is_admin(),marketplace_is_member(uuid),marketplace_can_upload(text) to authenticated;
grant execute on function marketplace_categories(),marketplace_search(text,text,text),marketplace_business(text),marketplace_lead(text) to anon,authenticated;
grant execute on function marketplace_my_profile(),marketplace_save_profile(jsonb),marketplace_addresses(),marketplace_save_address(jsonb),marketplace_delete_address(uuid),marketplace_my_businesses(),marketplace_save_business(jsonb,boolean),marketplace_request_integration(uuid),marketplace_save_service(uuid,jsonb,boolean),marketplace_toggle_favorite(uuid),marketplace_favorites(),marketplace_review(uuid,integer,text),marketplace_my_reviews(),marketplace_report(uuid,text),marketplace_checkout(text,uuid,jsonb,text,uuid,text,text,numeric),marketplace_my_orders(),marketplace_admin_data(),marketplace_admin_action(text,uuid,jsonb),marketplace_store_settings(jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
