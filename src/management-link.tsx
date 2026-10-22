import {useState,type ReactNode} from 'react';
import {useApp} from './state';
import {supabase} from './lib/api';
import {connectManagement,MANAGEMENT_ORIGIN} from './lib/management-access.mjs';
export function ManagementLink({children,className}:{children:ReactNode;className?:string}) {
 const {user}=useApp();const [error,setError]=useState(''),[busy,setBusy]=useState(false);
 return <><a className={className} href={MANAGEMENT_ORIGIN+'/inicio'} aria-busy={busy} onClick={e=>{
   if(!user||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
   e.preventDefault();if(busy)return;setBusy(true);setError('');
   void connectManagement(()=>supabase.auth.getSession()).catch(e=>setError(e.message)).finally(()=>setBusy(false));
 }}>{busy?'Abrindo painel…':children}</a>{error&&<p role="alert">{error}</p>}</>;
}
