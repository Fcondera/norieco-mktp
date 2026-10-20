-- Publication approval is separate from documentary verification.
begin;
insert into public.marketplace_categories(name,icon,group_name,sort_order) values
 ('Peixarias','shop','commerce',13),('Conveniências','bag','commerce',14)
 on conflict(name) do nothing;

-- Repair only the old automatic classification of unpublished PDV stores.
update public.marketplace_businesses b set category_id=c.id
 from public.tenants t, public.marketplace_categories c
 where b.tenant_id=t.id and b.listing_type='INTEGRATED' and b.verification_status='DRAFT'
 and b.category_id=(select id from public.marketplace_categories where name='Mercados')
 and c.name=case t.business_type when 'FISH_MARKET' then 'Peixarias' when 'SNACK_BAR' then 'Lanches' end;

-- Internal deployment helper. No browser role may execute it directly.
create function public.marketplace_publish_pdv_internal(p_business uuid,p_category uuid) returns void
 language plpgsql security definer set search_path=public,pg_temp as $$
declare b marketplace_businesses; s app_settings;
begin
 select * into b from marketplace_businesses where id=p_business for update;
 if b.id is null or b.listing_type<>'INTEGRATED' or b.tenant_id is null then raise exception 'Selecione uma loja integrada ao PDV.';end if;
 if b.verification_status in ('SUSPENDED','REJECTED') then raise exception 'Revise a restrição desta loja antes de publicar.';end if;
 if not exists(select 1 from tenants where id=b.tenant_id and is_active) then raise exception 'Empresa inativa no PDV.';end if;
 if not exists(select 1 from marketplace_categories where id=p_category and active) then raise exception 'Categoria inválida.';end if;
 select * into s from app_settings where tenant_id=b.tenant_id;
 if not found then raise exception 'Configure a empresa no PDV antes de publicar.';end if;
 update marketplace_businesses set verification_status='VERIFIED',category_id=p_category,integration_status='CONNECTED',
 city=coalesce(nullif(s.cities[1],''),b.city),whatsapp=coalesce(nullif(s.whatsapp,''),b.whatsapp),updated_at=now()
 where id=b.id;
 -- Do not mark documents as reviewed, open the store, change delivery or duplicate products.
 insert into marketplace_audit(actor,action,entity_id,details) values(auth.uid(),'PDV_PUBLICATION_APPROVED',b.id,
 jsonb_build_object('tenant_id',b.tenant_id,'previous_status',b.verification_status,'previous_category_id',b.category_id,
 'category_id',p_category,'documentary_approval',false,'source',case when auth.uid() is null then 'AUTHORIZED_DEPLOYMENT' else 'MARKETPLACE_ADMIN' end));
end $$;
revoke all on function public.marketplace_publish_pdv_internal(uuid,uuid) from public,anon,authenticated;

create function public.marketplace_publish_pdv(p_business uuid,p_category uuid) returns void
 language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if not marketplace_is_admin() then raise exception 'Acesso exclusivo da administração NoriEco.';end if;
 perform marketplace_rate('admin',60);
 perform marketplace_publish_pdv_internal(p_business,p_category);
end $$;
revoke all on function public.marketplace_publish_pdv(uuid,uuid) from public,anon,authenticated;
grant execute on function public.marketplace_publish_pdv(uuid,uuid) to authenticated;

-- The public projection is appended below; private document paths stay private.
create or replace function public.marketplace_public_business(p_business uuid) returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
 select jsonb_build_object('id',b.id,'slug',b.slug,'name',b.name,'category_id',b.category_id,'category_name',c.name,
 'document_verified',exists(select 1 from marketplace_verifications v where v.business_id=b.id and v.submitted_at is not null and v.reviewed_at is not null and exists(select 1 from storage.objects o where o.bucket_id='marketplace-verifications' and o.name=v.identity_path) and exists(select 1 from storage.objects o where o.bucket_id='marketplace-verifications' and o.name=v.proof_path)),'listing_type',b.listing_type,'verification_status',b.verification_status,'description',b.description,'logo_url',case when b.listing_type='INTEGRATED' then coalesce(nullif(s.logo_url,''),b.logo_url) else b.logo_url end,
 'cover_url',b.cover_url,'city',b.city,'state',b.state,'neighborhood',b.neighborhood,'address',case when b.listing_type='INTEGRATED' then case when lower(trim(s.pickup_address)) in ('endereco de retirada a configurar','endereço de retirada a configurar') then '' else coalesce(nullif(s.pickup_address,''),b.address) end else b.address end,
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

notify pgrst,'reload schema';
commit;
