import {useEffect} from 'react';
import {useApp} from './state';
import {ManagementLink} from './management-link';
export function StarterAccess(){
 const {user,authLoading}=useApp();
 useEffect(()=>{if(!authLoading&&!user)window.location.replace('https://gestao.norieco.com.br/inicio');},[user,authLoading]);
 return <section className="narrow panel"><span className="eyebrow">NORI GESTÃO</span><h1>Sua loja começa com 15 dias grátis.</h1><p>Um único acesso ao painel, PDV e catálogo. Cadastre os dados da loja agora; os documentos podem ser enviados depois. Sem cobrança automática.</p><ManagementLink className="button primary">Abrir meu painel</ManagementLink></section>;
}