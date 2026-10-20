-- Authorized by the platform owner: publish only these two real businesses.
-- Condera remains a draft. No orders, stock, domains or opening hours change.
begin;
do $$
declare r record; total integer:=0;
begin
 for r in
 select b.id,c.id category_id from public.marketplace_businesses b
 join public.tenants t on t.id=b.tenant_id
 join (values
 ('866214a2-5357-4f03-8b4b-c98c8703bfb9'::uuid,'renato-pescados','Peixarias'),
 ('803683e5-efda-43e8-b974-dee5e565ebe4'::uuid,'adega-asvluth','Restaurantes')) expected(tenant_id,slug,category)
 on t.id=expected.tenant_id and b.slug=expected.slug
 join public.marketplace_categories c on c.name=expected.category
 loop
  perform public.marketplace_publish_pdv_internal(r.id,r.category_id);
  total:=total+1;
 end loop;
 if total<>2 then raise exception 'Publicação cancelada: as duas empresas esperadas não foram encontradas.';end if;
 -- Classify the inactive listing without publishing it or altering its tenant.
 update public.marketplace_businesses set category_id=(select id from public.marketplace_categories where name='Conveniências')
 where tenant_id='21df6e99-d74c-44c9-bad8-57f3f8eeb22b' and verification_status='DRAFT';
end $$;
commit;
