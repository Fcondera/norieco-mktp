-- Additive starter access. Does not activate staff, tenants, billing or PDV roles.
begin;
alter table public.marketplace_services add column if not exists kind text not null default 'SERVICE' check(kind in ('PRODUCT','SERVICE'));
alter table public.marketplace_services add column if not exists price numeric(12,2) check(price>=0);
alter table public.marketplace_services add column if not exists image_url text not null default '';
alter table public.marketplace_services add column if not exists is_active boolean not null default true;

create table public.marketplace_inquiries(
 id uuid primary key default gen_random_uuid(),business_id uuid not null references public.marketplace_businesses(id),
 offer_id uuid references public.marketplace_services(id) on delete set null,
 customer_name text not null check(length(customer_name) between 2 and 120),phone text not null check(phone ~ '^[0-9]{10,15}$'),
 message text not null check(length(message) between 5 and 1000),status text not null default 'OPEN' check(status in ('OPEN','CONTACTED','CLOSED')),
 created_at timestamptz not null default now()
);
create index on public.marketplace_inquiries(business_id,created_at desc);
create table public.marketplace_plan_requests(
 business_id uuid primary key references public.marketplace_businesses(id),requested_by uuid not null references auth.users(id),
 plan_code text not null default 'PDV' check(plan_code='PDV'),status text not null default 'REQUESTED' check(status in ('REQUESTED','CONTACTED','RESOLVED')),
 created_at timestamptz not null default now()
);
alter table public.marketplace_inquiries enable row level security;
alter table public.marketplace_plan_requests enable row level security;
revoke all on public.marketplace_inquiries,public.marketplace_plan_requests from public,anon,authenticated;

create function public.starter_assert_member(p_business uuid) returns void language plpgsql stable security definer set search_path=public,pg_temp as $$
begin
 perform marketplace_require_profile();
 if not marketplace_is_member(p_business) or not exists(select 1 from marketplace_businesses where id=p_business and verification_status<>'SUSPENDED') then raise exception 'Sem acesso à empresa.';end if;
end $$;
revoke all on function public.starter_assert_member(uuid) from public,anon,authenticated;

create function public.starter_dashboard() returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
begin
 perform marketplace_require_profile();
 return coalesce((select jsonb_agg(item||jsonb_build_object(
 'plan_code',case when exists(select 1 from marketplace_businesses b join profiles p on p.tenant_id=b.tenant_id join tenants t on t.id=b.tenant_id where b.id=(item->>'id')::uuid and p.id=auth.uid() and p.is_active and t.is_active) then 'PDV' else 'INITIAL' end,
 'modules',jsonb_build_array('company','offers','inquiries'),
 'inquiries',coalesce((select jsonb_agg(i order by created_at desc) from (select id,offer_id,customer_name,phone,message,status,created_at from marketplace_inquiries where business_id=(item->>'id')::uuid order by created_at desc limit 100)i),'[]'),
 'plan_request',(select jsonb_build_object('status',status,'created_at',created_at) from marketplace_plan_requests where business_id=(item->>'id')::uuid)))
 from jsonb_array_elements(marketplace_my_businesses()) item),'[]');
end $$;

create function public.starter_save_business(p_business uuid,p_data jsonb,p_submit boolean default false) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare data jsonb:=p_data;existing jsonb;
begin
 perform marketplace_require_profile();
 if p_data ?| array['tenant_id','plan_code','role','verification_status','integration_status'] then raise exception 'Campos de acesso não podem ser alterados.'; end if;
 if p_business is not null then
 perform starter_assert_member(p_business);
 if not exists(select 1 from marketplace_businesses where id=p_business and listing_type='STANDARD') then raise exception 'Edite esta empresa no painel PDV autorizado.';end if;
 select item into existing from jsonb_array_elements(marketplace_my_businesses()) item where item->>'id'=p_business::text;
 data:=existing||p_data||jsonb_build_object('id',p_business);
 else data:=data-'id';end if;
 data:=data||jsonb_build_object('listing_type','STANDARD','legal_name',coalesce(nullif(data->>'legal_name',''),data->>'name'));
 return marketplace_save_business(data,p_submit);
end $$;

create function public.starter_save_offer(p_business uuid,p_data jsonb,p_delete boolean default false) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare i uuid:=coalesce(nullif(p_data->>'id','')::uuid,gen_random_uuid()); photo text:=coalesce(p_data->>'image_url','');
begin
 perform starter_assert_member(p_business);
 if not p_delete then
 if coalesce(p_data->>'kind','SERVICE') not in ('PRODUCT','SERVICE') then raise exception 'Tipo de oferta inválido.';end if;
 if photo<>'' and (photo !~ '^https://' or length(photo)>2048) then raise exception 'Use uma imagem HTTPS válida.';end if;
 if length(coalesce(p_data->>'name','')) not between 2 and 100 or length(coalesce(p_data->>'description','')) not between 2 and 500 then raise exception 'Confira o nome e a descrição.';end if;
 end if;
 perform marketplace_save_service(p_business,p_data||jsonb_build_object('id',i),p_delete);
 if not p_delete then
 update marketplace_services set kind=coalesce(p_data->>'kind','SERVICE'),price=nullif(p_data->>'price','')::numeric,image_url=photo,is_active=coalesce((p_data->>'is_active')::boolean,true) where id=i and business_id=p_business;
 end if;
end $$;

create function public.starter_inquiry_status(p_business uuid,p_id uuid,p_status text) returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 perform starter_assert_member(p_business);
 if p_status not in ('OPEN','CONTACTED','CLOSED') then raise exception 'Status inválido.';end if;
 update marketplace_inquiries set status=p_status where id=p_id and business_id=p_business;
 if not found then raise exception 'Solicitação não encontrada.';end if;
end $$;

create function public.starter_request_pdv(p_business uuid) returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 perform starter_assert_member(p_business);perform marketplace_rate('plan-request',5);
 insert into marketplace_plan_requests(business_id,requested_by) values(p_business,auth.uid()) on conflict(business_id) do nothing;
 insert into marketplace_audit(actor,action,entity_id) values(auth.uid(),'PDV_PLAN_REQUESTED',p_business);
end $$;

create function public.marketplace_send_inquiry(p_slug text,p_offer uuid,p_name text,p_phone text,p_message text) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare b marketplace_businesses;
begin
 perform marketplace_rate('inquiry',5);
 select * into b from marketplace_businesses where slug=p_slug and listing_type='STANDARD';
 if b.id is null or marketplace_public_business(b.id) is null then raise exception 'Empresa indisponível.';end if;
 if p_offer is not null and not exists(select 1 from marketplace_services where id=p_offer and business_id=b.id and is_active) then raise exception 'Oferta indisponível.';end if;
 insert into marketplace_inquiries(business_id,offer_id,customer_name,phone,message) values(b.id,p_offer,trim(p_name),regexp_replace(p_phone,'\D','','g'),trim(p_message));
end $$;

-- Keep the existing projection, adding only public offer fields. No private contacts or staff data.
create or replace function public.marketplace_public_business(p_business uuid) returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
 select jsonb_build_object('id',b.id,'slug',b.slug,'name',b.name,'category_id',b.category_id,'category_name',c.name,
 'listing_type',b.listing_type,'verification_status',b.verification_status,'description',b.description,'logo_url',case when b.listing_type='INTEGRATED' then coalesce(nullif(s.logo_url,''),b.logo_url) else b.logo_url end,
 'cover_url',b.cover_url,'city',b.city,'state',b.state,'neighborhood',b.neighborhood,'address',case when b.listing_type='INTEGRATED' then coalesce(nullif(s.pickup_address,''),b.address) else b.address end,
 'whatsapp',b.whatsapp,'instagram',b.instagram,'latitude',b.latitude,'longitude',b.longitude,'distance_km',null,
 'rating',(select round(avg(rating),1) from marketplace_reviews where business_id=b.id and status='PUBLISHED'),
 'review_count',(select count(*) from marketplace_reviews where business_id=b.id and status='PUBLISHED'),
 'is_open',case when b.listing_type='INTEGRATED' then marketplace_open(s.marketplace_is_open,s.marketplace_opening_hours,s.marketplace_timezone) else marketplace_open(b.is_open,b.opening_hours,b.timezone) end,
 'opening_hours',case when b.listing_type='INTEGRATED' then s.marketplace_opening_hours else b.opening_hours end,
 'featured',b.featured,'delivery_minutes',b.delivery_minutes,'delivery_fee',coalesce(s.delivery_fee,0),'accepts_delivery',coalesce(s.marketplace_accepts_delivery,false),
 'services',coalesce((select jsonb_agg(jsonb_build_object('id',id,'business_id',business_id,'name',name,'description',description,'kind',kind,'price',price,'image_url',image_url)) from marketplace_services where business_id=b.id and is_active),'[]'),
 'reviews',coalesce((select jsonb_agg(r) from(select r.id,r.business_id,split_part(p.full_name,' ',1) display_name,r.rating,r.body,r.created_at from marketplace_reviews r join marketplace_profiles p on p.user_id=r.user_id where r.business_id=b.id and r.status='PUBLISHED' order by r.created_at desc limit 20) r),'[]'))
 from marketplace_businesses b join marketplace_categories c on c.id=b.category_id left join app_settings s on s.tenant_id=b.tenant_id
 where b.id=p_business and b.verification_status='VERIFIED' and c.active and (b.listing_type='STANDARD' or exists(select 1 from tenants t where t.id=b.tenant_id and t.is_active));
$$;

revoke all on function starter_dashboard(),starter_save_business(uuid,jsonb,boolean),starter_save_offer(uuid,jsonb,boolean),starter_inquiry_status(uuid,uuid,text),starter_request_pdv(uuid),marketplace_send_inquiry(text,uuid,text,text,text) from public,anon,authenticated;
grant execute on function starter_dashboard(),starter_save_business(uuid,jsonb,boolean),starter_save_offer(uuid,jsonb,boolean),starter_inquiry_status(uuid,uuid,text),starter_request_pdv(uuid) to authenticated;
grant execute on function marketplace_send_inquiry(text,uuid,text,text,text) to anon,authenticated;
notify pgrst,'reload schema';
commit;
