import { useState, type FormEvent } from 'react';
import { rpc } from './lib/api';
import { Field, Notice } from './ui';
export function BusinessInquiry({slug,offer,name}:{slug:string;offer:string|null;name:string}) {
  const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[sent,setSent]=useState(false);
  const save=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();const form=new FormData(event.currentTarget);setBusy(true);setError('');
    try{await rpc('marketplace_send_inquiry',{p_slug:slug,p_offer:offer,p_name:form.get('name'),p_phone:form.get('phone'),p_message:form.get('message')});setSent(true);setOpen(false);}catch(e){setError((e as Error).message);}finally{setBusy(false);}
  };
  return <div>{sent?<Notice>Solicitação enviada para a empresa. Aguarde o contato dela.</Notice>:<button className="button secondary" onClick={()=>setOpen(value=>!value)}>Enviar solicitação</button>}{open&&<form className="form-stack" onSubmit={save}><h3>Solicitar: {name}</h3><Field label="Seu nome"><input name="name" required minLength={2} maxLength={120} autoComplete="name" /></Field><Field label="WhatsApp com DDD"><input name="phone" required type="tel" minLength={10} maxLength={20} autoComplete="tel" /></Field><Field label="O que você precisa?"><textarea name="message" required minLength={5} maxLength={1000} /></Field><small>Ao enviar, seu nome, telefone e mensagem serão compartilhados com esta empresa para responder à solicitação. Isto não confirma pedido nem pagamento.</small>{error&&<Notice error>{error}</Notice>}<div className="actions"><button className="button primary" disabled={busy}>{busy?'Enviando…':'Enviar para a empresa'}</button><button type="button" className="text-button" onClick={()=>setOpen(false)}>Cancelar</button></div></form>}</div>;
}
