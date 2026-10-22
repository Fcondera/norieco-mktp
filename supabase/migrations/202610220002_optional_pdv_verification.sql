begin;
-- Documents can be sent after the store exists, without unpublishing its page.
create function public.pdv_save_documents(p_business uuid,p_data jsonb,p_submit boolean default false) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare b marketplace_businesses; data jsonb; k text; path text;
begin
 select * into b from marketplace_businesses where id=p_business;
 if auth.uid() is null or not marketplace_is_member(p_business) or b.tenant_id is distinct from current_tenant_id() or b.listing_type<>'INTEGRATED' or b.verification_status='SUSPENDED' then raise exception 'Sem acesso a esta empresa.';end if;
 if exists(select 1 from jsonb_object_keys(p_data) key where key not in ('legal_name','cpf','cnpj','identity_path','proof_path')) then raise exception 'Campos de documento inválidos.';end if;
 perform marketplace_rate('documents',20);
 select to_jsonb(v) into data from marketplace_verifications v where business_id=p_business;
 data:=coalesce(data,'{}')||p_data;
 foreach k in array array['identity_path','proof_path'] loop
 path:=coalesce(data->>k,'');
 if path<>'' and (split_part(path,'/',1)<>auth.uid()::text or split_part(path,'/',2)<>p_business::text or path like '%..%' or not exists(select 1 from storage.objects where bucket_id='marketplace-verifications' and name=path)) then raise exception 'Documento inválido ou de outra empresa.';end if;
 end loop;
 if p_submit and (length(trim(coalesce(data->>'legal_name','')))<3 or not marketplace_valid_document(data->>'cpf','CPF') or coalesce(data->>'identity_path','')='' or coalesce(data->>'proof_path','')='') then raise exception 'Confira o nome, CPF e envie os dois documentos.';end if;
 if p_submit and coalesce(data->>'cnpj','')<>'' and not marketplace_valid_document(data->>'cnpj','CNPJ') then raise exception 'CNPJ inválido.';end if;
 insert into marketplace_verifications(business_id,legal_name,cpf,cnpj,identity_path,proof_path,submitted_at)
 values(p_business,coalesce(data->>'legal_name',''),regexp_replace(coalesce(data->>'cpf',''),'\D','','g'),regexp_replace(coalesce(data->>'cnpj',''),'\D','','g'),coalesce(data->>'identity_path',''),coalesce(data->>'proof_path',''),case when p_submit then now() end)
 on conflict(business_id) do update set legal_name=excluded.legal_name,cpf=excluded.cpf,cnpj=excluded.cnpj,identity_path=excluded.identity_path,proof_path=excluded.proof_path,submitted_at=excluded.submitted_at,reviewed_at=null,reviewed_by=null;
 insert into marketplace_audit(actor,action,entity_id) values(auth.uid(),case when p_submit then 'PDV_DOCUMENTS_SUBMITTED' else 'PDV_DOCUMENTS_SAVED' end,p_business);
end $$;
revoke all on function public.pdv_save_documents(uuid,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.pdv_save_documents(uuid,jsonb,boolean) to authenticated;
notify pgrst,'reload schema';
commit;
