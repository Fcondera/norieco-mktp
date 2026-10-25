import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { hardwareProduct as product, cepDigits, formatCep, validHardwarePhotos } from './lib/hardware.mjs';
import { brl, contactLink } from './lib/core.mjs';
import { ThemeToggle, useSiteTheme } from './site-theme';
import { ManagementLink } from './management-link';
import './hardware-shop.css';

type Photo = {src: string; alt: string};
type ShippingOption = {id: string; name: string; company: string; amountCents: number; days: number | null};
type Quote = {cep: string; address: {street: string; district: string; city: string; state: string}; fees: {label: string; amountCents: number}[]; feesConfirmed: boolean; options: ShippingOption[]; mode: 'manual' | 'quoted'; message: string; expiresAt: string};
const money = (cents: number) => brl(cents / 100);
const supportNumber = import.meta.env.VITE_SUPPORT_WHATSAPP || '5547992739983';
const support = contactLink(supportNumber, 'Olá! Quero saber mais sobre o PDV completo de R$ 1.650,00.');

function EquipmentIcon({kind = 'kit', size = 42}: {kind?: string; size?: number}) {
  const paths: Record<string, React.ReactNode> = {
    kit: <><rect x="2" y="3" width="16" height="12" rx="2"/><path d="M10 15v5m-4 0h8"/><rect x="19" y="8" width="4" height="13" rx="1"/></>,
    computer: <><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 7h8M8 10h8m-8 8h2"/></>,
    monitor: <><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M12 17v4m-5 0h10"/></>,
    keyboard: <><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M5 9h1m3 0h1m3 0h1m3 0h2M5 12h1m3 0h1m3 0h1m3 0h2M7 15h10"/></>,
    mouse: <><rect x="6" y="2" width="12" height="20" rx="6"/><path d="M12 3v7m-6 0h12"/></>,
    printer: <><path d="M6 8V2h12v6M6 17H3V8h18v9h-3M6 14h12v8H6Z"/><path d="M17 11h1M9 18h6"/></>,
    truck: <><path d="M2 5h12v12H2Zm12 5h5l3 4v3h-8"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[kind] || paths.kit}</svg>;
}

let photoRequest: Promise<Photo[]> | null = null;
function useProductPhotos() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  useEffect(() => {
    let active = true;
    photoRequest ||= fetch('/equipamentos/pdv-completo.json', {cache: 'no-cache'}).then(response => response.ok ? response.json() : null).then(data => validHardwarePhotos(data?.photos)).catch(() => []);
    void photoRequest.then(data => { if (active) setPhotos(data); });
    return () => { active = false; };
  }, []);
  return photos;
}

function ProductPhoto({photo, kind = 'kit', compact = false}: {photo?: Photo; kind?: string; compact?: boolean}) {
  const [broken, setBroken] = useState(false);
  return photo && !broken ? <img className="hw-real-photo" src={photo.src} alt={photo.alt} width="700" height="700" onError={() => setBroken(true)} loading={compact ? 'lazy' : 'eager'} decoding="async" /> : <div className={`hw-photo-placeholder${compact ? ' is-compact' : ''}`}><EquipmentIcon kind={kind} size={compact ? 72 : 100}/>{!compact && <><span>PDV completo</span><small>Fotos em breve</small></>}</div>;
}

export function HardwareOfferCard() {
  const photos = useProductPhotos();
  return <section id="equipamentos" className="hardware-offer" aria-labelledby="hardware-offer-title"><h2 id="hardware-offer-title">Complete seu balcão.</h2>
    <a className="hw-offer-card" href={product.path}>
      <div className="hw-offer-image"><ProductPhoto key={photos[0]?.src || 'empty'} photo={photos[0]} compact /></div>
      <div className="hw-offer-copy"><h3>PDV completo</h3><p>Computador Intel E7400, 4 GB de RAM, SSD de 120 GB, monitor, teclado, mouse e impressora.</p><span>Conhecer o kit <span aria-hidden="true">→</span></span></div>
      <div className="hw-offer-price"><strong>{money(product.priceCents)}</strong><span>+ frete e taxas informados antes da compra</span></div>
    </a>
  </section>;
}

function Gallery() {
  const photos = useProductPhotos();
  const [selected, select] = useState(0);
  const slots = photos.length ? photos.map((photo, index) => ({label: `Foto ${index + 1}`, kind: 'kit', photo})) : [{label:'Kit completo',kind:'kit'},{label:'Computador',kind:'computer'},{label:'Monitor',kind:'monitor'},{label:'Impressora',kind:'printer'},{label:'Teclado e mouse',kind:'keyboard'}];
  const item = slots[Math.min(selected, slots.length - 1)] as {label: string; kind: string; photo?: Photo};
  return <div className="hw-gallery"><div className="hw-gallery-main" aria-live="polite"><ProductPhoto key={item.photo?.src || item.kind} photo={item.photo} kind={item.kind}/></div>
    <div className="hw-thumbnails" role="group" aria-label="Imagens do produto">{slots.map((slot, index) => <button type="button" key={index} aria-label={slot.label} aria-pressed={index === selected} onClick={() => select(index)}>{'photo' in slot ? <img src={(slot.photo as Photo).src} alt="" onError={event => {event.currentTarget.style.visibility='hidden';}}/> : <EquipmentIcon kind={slot.kind} size={24}/>}</button>)}</div>
    <p className="hw-photo-note">{photos.length ? 'Confira as fotos e os itens incluídos antes de concluir.' : 'As fotos reais do kit serão adicionadas aqui.'}</p>
  </div>;
}

function useDelivery() {
  const [cep, setValue] = useState(() => formatCep(new URLSearchParams(location.search).get('cep') || ''));
  const [quote, setQuote] = useState<Quote | null>(null), [selected, select] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  function setCep(value: string) {
    controller.current?.abort(); setBusy(false); setQuote(null); select(''); setError(''); setValue(formatCep(value));
  }
  async function calculate() {
    if (cepDigits(cep).length !== 8) { setError('Informe um CEP com 8 dígitos.'); return; }
    controller.current?.abort(); const current = new AbortController(); controller.current = current;
    setBusy(true); setError(''); setQuote(null); select('');
    try {
      const response = await fetch('/.netlify/functions/hardware-shipping', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cep:cepDigits(cep)}),signal:current.signal});
      const data = await response.json();
      if (!response.ok) throw Error(response.status === 429 ? 'Aguarde um momento antes de consultar novamente.' : data.error || 'Não foi possível consultar a entrega.');
      if (data.cep !== cepDigits(cep) || !Array.isArray(data.options) || !data.address) throw Error('Não foi possível consultar a entrega.');
      if (!current.signal.aborted) setQuote(data as Quote);
    } catch (reason) { if (!current.signal.aborted) setError(reason instanceof Error && reason.message !== 'Failed to fetch' && !reason.message.includes('JSON') ? reason.message : 'Não foi possível consultar a entrega. Tente novamente ou fale com a equipe.'); }
    finally { if (!current.signal.aborted) setBusy(false); }
  }
  return {cep,setCep,quote,selected,select,busy,error,calculate};
}
type Delivery = ReturnType<typeof useDelivery>;

function DeliveryForm({delivery}: {delivery: Delivery}) {
  const {cep,setCep,quote,selected,select,busy,error,calculate} = delivery;
  return <div className="hw-delivery"><h3><EquipmentIcon kind="truck" size={21}/> Entrega para você</h3><p>Enviamos de São Paulo até o seu endereço.</p>
    <div className="hw-cep-row"><label>CEP de entrega<input aria-label="CEP de entrega" value={cep} onChange={event => setCep(event.target.value)} inputMode="numeric" autoComplete="shipping postal-code" maxLength={9} placeholder="00000-000" onKeyDown={event => {if(event.key==='Enter'){event.preventDefault();void calculate();}}}/></label><button className="hw-button hw-button-secondary" type="button" disabled={busy} onClick={() => void calculate()}>{busy ? 'Consultando…' : 'Consultar'}</button></div>
    {error && <p className="hw-error" role="alert">{error}</p>}
    {quote && <div className="hw-shipping-result" role="status"><p><strong>{quote.address.city} / {quote.address.state}</strong></p>
      {quote.options.length > 0 && <fieldset className="hw-shipping-options"><legend>Escolha a entrega</legend>{quote.options.map(option => <label key={option.id}><input type="radio" name="shipping-option" value={option.id} checked={selected === option.id} onChange={() => select(option.id)}/><span><strong>{option.company} · {option.name}</strong><small>{option.days ? `Até ${option.days} dias úteis após a postagem` : 'Prazo a confirmar'}</small></span><b>{money(option.amountCents)}</b></label>)}</fieldset>}
      <p>{quote.message}</p>
    </div>}
  </div>;
}

function OrderSummary({delivery}: {delivery: Delivery}) {
  const selected = delivery.quote?.options.find(option => option.id === delivery.selected);
  const fees = delivery.quote?.fees || [], feesKnown = delivery.quote?.feesConfirmed === true;
  const complete = !!selected && feesKnown;
  const total = product.priceCents + (selected?.amountCents || 0) + (feesKnown ? fees.reduce((sum,fee) => sum+fee.amountCents,0) : 0);
  return <div className="hw-order-summary"><h2>Resumo do pedido</h2><div className="hw-summary-product"><EquipmentIcon size={45}/><span><b>PDV completo</b><small>Intel E7400 · 4 GB de RAM</small><small>1 kit · monitor e periféricos incluídos</small></span></div><dl>
    <div><dt>Equipamentos</dt><dd>{money(product.priceCents)}</dd></div><div><dt>Frete</dt><dd>{selected ? money(selected.amountCents) : 'A confirmar'}</dd></div>
    {feesKnown ? fees.length ? fees.map((fee,index) => <div key={index}><dt>{fee.label}</dt><dd>{money(fee.amountCents)}</dd></div>) : <div><dt>Outras taxas</dt><dd>{money(0)}</dd></div> : <div><dt>Outras taxas</dt><dd>A confirmar</dd></div>}
    <div className="hw-summary-total"><dt>{complete ? 'Total previsto' : 'Valor do kit'}</dt><dd>{money(complete ? total : product.priceCents)}</dd></div>
  </dl>{!complete && <p>O frete e as taxas pendentes não estão incluídos no valor acima. Você confirma o total antes de pagar.</p>}</div>;
}

function ProductDetails({delivery}: {delivery: Delivery}) {
  const [inCart,setInCart] = useState(() => {try{return sessionStorage.getItem('norieco-hardware-cart')===product.id;}catch{return false;}});
  function toggleCart(){const next=!inCart;setInCart(next);try{if(next)sessionStorage.setItem('norieco-hardware-cart',product.id);else sessionStorage.removeItem('norieco-hardware-cart');}catch{/* A private browsing session can still proceed directly to checkout. */}}
  const checkout=product.checkoutPath+(cepDigits(delivery.cep).length===8?'?cep='+cepDigits(delivery.cep):'');
  return <><nav className="hw-breadcrumbs" aria-label="Você está em"><a href="/">Início</a><span aria-hidden="true">/</span><a href="/#equipamentos">Equipamentos</a><span aria-hidden="true">/</span><span>PDV completo</span></nav>
    <div className="hw-product-grid"><div className="hw-overview-panel"><Gallery/><div className="hw-product-description">
      <h1>PDV completo Intel E7400, 4 GB, SSD 120 GB, monitor 15″ e impressora</h1>
      <p className="hw-seller">Vendido e entregue por: <a href={support} target="_blank" rel="noopener noreferrer">NoriEco</a></p>
      <section className="hw-product-highlights" aria-labelledby="hw-product-about"><h2 id="hw-product-about">Sobre o produto</h2><ul>
        <li><strong>Kit para o balcão:</strong> computador, monitor de 15″, teclado e mouse USB, além da impressora do kit NoriEco.</li>
        <li><strong>Uso no dia a dia:</strong> processador Intel E7400 e 4 GB de RAM para navegação, tarefas básicas e sistemas de empresa.</li>
        <li><strong>Armazenamento em SSD:</strong> 120 GB para o sistema, programas e arquivos da sua operação.</li>
        <li><strong>Mais espaço na bancada:</strong> monitor compacto de 15 polegadas para ambientes menores.</li>
      </ul><div className="hw-description-links"><a href="#sobre-kit">Ver descrição</a><a href="#ficha-kit">Ver informações técnicas</a></div></section>
    </div></div><aside className="hw-buy-column" aria-label="Comprar PDV completo"><section className="hw-purchase-box"><p className="hw-price">{money(product.priceCents)}</p><p className="hw-price-note">Valor do kit. Frete e eventuais taxas à parte.</p><DeliveryForm delivery={delivery}/><a className="hw-button hw-button-primary" href={checkout}>Comprar agora <span aria-hidden="true">→</span></a><button type="button" className="hw-button hw-button-cart" aria-pressed={inCart} onClick={toggleCart}>{inCart?'Remover do carrinho':'Adicionar ao carrinho'}</button>
      {inCart&&<p className="hw-cart-notice" role="status">1 kit no carrinho. <a href={checkout}>Ver pedido →</a></p>}
    </section><section className="hw-merchant-card"><h2>NoriEco</h2><p>Venda, atendimento e organização da entrega pela nossa equipe.</p><dl><div><dt>Origem do envio</dt><dd>São Paulo / SP</dd></div><div><dt>Garantia do fornecedor</dt><dd>{product.warranty}</dd></div></dl><a href={support} target="_blank" rel="noopener noreferrer">Falar com a NoriEco ↗</a></section></aside></div>
    <nav className="hw-section-nav" aria-label="Detalhes do produto"><a href="#sobre-kit">Sobre o kit</a><a href="#itens-kit">O que acompanha</a><a href="#ficha-kit">Ficha técnica</a><a href="#entrega-kit">Entrega</a></nav>
    <section id="sobre-kit" className="hw-content-block"><h2>Descrição do produto</h2><p>Um computador completo para quem busca praticidade em tarefas básicas, navegação na internet e uso em escritórios, comércios e balcões. O processador Intel E7400 (Dual Core), os 4 GB de RAM e o SSD de 120 GB compõem uma configuração para o uso cotidiano.</p><p>O monitor de 15 polegadas ocupa pouco espaço na bancada. Teclado e mouse USB acompanham o computador, e o kit NoriEco também inclui a impressora para a operação do PDV.</p><p>Indicado para estudos, internet, redes sociais, sistemas de empresa e uso básico diário. A compra é dos equipamentos; a assinatura do Nori Gestão é contratada separadamente.</p></section>
    <section id="itens-kit" className="hw-content-block"><h2>O que acompanha seu PDV</h2><div className="hw-included-grid">{[['computer','Computador','Intel E7400, 4 GB de RAM e SSD 120 GB'],['monitor','Monitor','15 polegadas'],['keyboard','Teclado','Conexão USB'],['mouse','Mouse','Conexão USB'],['printer','Impressora','Incluída no kit NoriEco']].map(([kind,title,description]) => <div key={kind}><EquipmentIcon kind={kind} size={32}/><h3>{title}</h3><p>{description}</p></div>)}</div></section>
    <section id="ficha-kit" className="hw-content-block"><h2>Informações técnicas</h2><dl className="hw-specs">{[['Produto','PDV completo'],['Processador',product.processor],['Memória RAM',product.ram],['Armazenamento',product.storage],['Monitor',product.monitor],['Teclado e mouse','USB'],['Sistema','Pronto para uso, conforme descrição do fornecedor'],['Conexões','USB / Áudio / Rede / Vídeo'],['Voltagem','Bivolt'],['Garantia do fornecedor',product.warranty],['Peso bruto do kit','8.900 g (8,9 kg): kit do fornecedor de 8,1 kg + impressora de 800 g'],['Itens incluídos','Computador, monitor, teclado, mouse e impressora'],['Origem do envio','São Paulo / SP'],['Marcas e modelos dos periféricos','Confirme com a equipe antes da compra']].map(([key,value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl></section>
    <section id="entrega-kit" className="hw-content-block hw-delivery-info"><EquipmentIcon kind="truck" size={36}/><div><h2>Nós cuidamos da entrega.</h2><p>Informe seu CEP para consultar as opções. A equipe confirma frete, prazo e eventuais taxas antes do pagamento. O envio é organizado após a confirmação da compra.</p><p>Precisa confirmar um detalhe do equipamento? <a href={support} target="_blank" rel="noopener noreferrer">Fale com a NoriEco.</a></p></div></section>
  </>;
}

type Customer = {name:string;email:string;phone:string;street:string;number:string;district:string;city:string;state:string;complement:string};
function HardwareCheckout({delivery}: {delivery: Delivery}) {
  const [customer,setCustomer] = useState<Customer>({name:'',email:'',phone:'',street:'',number:'',district:'',city:'',state:'',complement:''});
  const [review,setReview] = useState(false), [accepted,setAccepted] = useState(false), [error,setError] = useState('');
  const reviewTitle = useRef<HTMLHeadingElement>(null);
  useEffect(() => {setCustomer(previous=>({...previous,street:'',district:'',city:'',state:''}));setReview(false);setAccepted(false);},[delivery.cep]);
  useEffect(() => {if(delivery.quote)setCustomer(previous=>({...previous,...delivery.quote!.address}));},[delivery.quote]);
  useEffect(() => {if(review)reviewTitle.current?.focus();},[review]);
  const selected = delivery.quote?.options.find(option=>option.id===delivery.selected);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();setError('');
    if (!delivery.quote) {setError('Consulte seu CEP de entrega antes de revisar o pedido.');return;}
    if (delivery.quote.options.length && !selected) {setError('Escolha uma opção de entrega.');return;}
    if (Date.parse(delivery.quote.expiresAt)<Date.now()) {setError('A consulta de entrega expirou. Consulte novamente para atualizar.');return;}
    const phoneDigits=customer.phone.replace(/\D/g,'');
    const nationalPhone=phoneDigits.length>11&&phoneDigits.startsWith('55')?phoneDigits.slice(2):phoneDigits;
    if (customer.name.trim().length<3 || !/^\d{10,11}$/.test(nationalPhone) || !customer.street.trim() || !customer.number.trim() || !customer.district.trim()) {setError('Confira seu nome, WhatsApp e endereço antes de continuar.');return;}
    setReview(true);
  }
  const fees = delivery.quote?.feesConfirmed ? delivery.quote.fees.length ? delivery.quote.fees.map(f=>`${f.label}: ${money(f.amountCents)}`).join('\n') : 'Outras taxas: R$ 0,00' : 'Outras taxas: a confirmar';
  const message = `Olá! Quero comprar o PDV completo NoriEco.\nEquipamentos: ${money(product.priceCents)}\nKit: computador Intel E7400, 4 GB de RAM, SSD 120 GB, monitor de 15 polegadas, teclado, mouse e impressora.\nFrete: ${selected ? `${selected.company} / ${selected.name} — ${money(selected.amountCents)}` : 'a confirmar para meu CEP'}\n${fees}\n\nNome: ${customer.name.trim()}\nE-mail: ${customer.email.trim()}\nWhatsApp: ${customer.phone}\nEntrega: ${customer.street}, ${customer.number}${customer.complement ? ' — '+customer.complement : ''}, ${customer.district}, ${customer.city}/${customer.state}, CEP ${delivery.cep}.\n\nAguardo a confirmação do total, prazo e forma de pagamento antes de concluir a compra.`;
  return <><a className="hw-back" href={product.path}>← Voltar ao produto</a><h1>Seu PDV, a caminho do seu negócio.</h1><p className="hw-checkout-intro">Preencha seus dados, confira a entrega e revise sua solicitação.</p><ol className="hw-checkout-steps" aria-label="Etapas do pedido"><li className={!review?'active':''}>1. Dados e entrega</li><li className={review?'active':''}>2. Revisão</li><li>3. Confirmação com a equipe</li></ol>
    <div className="hw-checkout-grid"><div>{!review ? <form className="hw-checkout-form" onSubmit={submit}><section><h2>Quem vai receber?</h2><div className="hw-form-grid">
      <label className="hw-full">Nome completo<input value={customer.name} onChange={e=>setCustomer({...customer,name:e.target.value})} required minLength={3} maxLength={100} autoComplete="name"/></label>
      <label>E-mail<input type="email" value={customer.email} onChange={e=>setCustomer({...customer,email:e.target.value})} required maxLength={160} autoComplete="email"/></label>
      <label>WhatsApp com DDD<input type="tel" value={customer.phone} onChange={e=>setCustomer({...customer,phone:e.target.value.replace(/[^\d()+ -]/g,'')})} required maxLength={18} autoComplete="tel-national" placeholder="(11) 99999-9999"/></label>
    </div></section><section><h2>Onde vamos entregar?</h2><DeliveryForm delivery={delivery}/><div className="hw-form-grid">
      <label className="hw-full">Rua ou avenida<input value={customer.street} onChange={e=>setCustomer({...customer,street:e.target.value})} required maxLength={180} autoComplete="shipping address-line1"/></label>
      <label>Número<input value={customer.number} onChange={e=>setCustomer({...customer,number:e.target.value})} required maxLength={20} autoComplete="off"/></label>
      <label>Complemento <span>(opcional)</span><input value={customer.complement} onChange={e=>setCustomer({...customer,complement:e.target.value})} maxLength={100} autoComplete="shipping address-line2"/></label>
      <label>Bairro<input value={customer.district} onChange={e=>setCustomer({...customer,district:e.target.value})} required maxLength={100} autoComplete="shipping address-level3"/></label>
      <label>Cidade / UF<input value={customer.city ? customer.city+' / '+customer.state : ''} readOnly required aria-describedby="hw-city-help" autoComplete="shipping address-level2"/></label>
    </div><p id="hw-city-help" className="hw-field-note">A cidade e o estado são preenchidos ao consultar o CEP.</p></section>
    {error && <p className="hw-error" role="alert">{error}</p>}<button className="hw-button hw-button-primary" type="submit">Revisar pedido →</button><p className="hw-field-note">Nenhuma cobrança é feita nesta etapa.</p></form> : <section className="hw-review"><h2 ref={reviewTitle} tabIndex={-1}>Confira antes de continuar.</h2><h3>Seus dados</h3><p>{customer.name}<br/>{customer.email}<br/>{customer.phone}</p><h3>Entrega</h3><p>{customer.street}, {customer.number}<br/>{customer.complement && <>{customer.complement}<br/></>}{customer.district} · {customer.city} / {customer.state}<br/>CEP {delivery.cep}</p><h3>Pagamento e envio</h3><p>A equipe confirma o total, a forma de pagamento e o prazo com você pelo WhatsApp. Esta solicitação ainda não é uma compra paga.</p><label className="hw-consent"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)}/><span>Autorizo o contato da NoriEco para confirmar esta compra e a entrega. <a href="/marketplace/privacidade" target="_blank" rel="noopener noreferrer">Política de privacidade</a>.</span></label>
      {accepted ? <a className="hw-button hw-button-primary" href={contactLink(supportNumber,message)} target="_blank" rel="noopener noreferrer">Solicitar compra pelo WhatsApp ↗</a> : <button type="button" className="hw-button hw-button-primary" disabled>Solicitar compra pelo WhatsApp ↗</button>}<button type="button" className="hw-edit" onClick={()=>{setReview(false);setAccepted(false);}}>Editar meus dados</button>
    </section>}</div><aside><OrderSummary delivery={delivery}/><div className="hw-checkout-help"><EquipmentIcon kind="truck" size={26}/><p>Envio organizado pela NoriEco.<br/>Frete e taxas confirmados antes do pagamento.</p></div></aside></div>
  </>;
}

export function HardwarePage({checkout = false}: {checkout?: boolean}) {
  const {theme,toggle} = useSiteTheme(), delivery = useDelivery();
  useEffect(()=>{document.title=checkout?'Entrega e pedido do PDV completo · NoriEco':'PDV completo Intel E7400, 4 GB · NoriEco';},[checkout]);
  return <div className={`eco-site eco-halloween hardware-site${checkout ? "" : " hw-product-page"}`} data-theme={theme}><a className="skip-link" href="#hardware-main">Pular para o conteúdo</a><header className="hw-header"><a className="eco-brand" href="/" aria-label="NoriEco início"><img src="/nori-logo-official.png" alt=""/><span>Nori<span>Eco</span></span></a><nav aria-label="Navegação de equipamentos"><a href="/#equipamentos">Equipamentos</a><ManagementLink>Nori Gestão ↗</ManagementLink><a href={support} target="_blank" rel="noopener noreferrer">Atendimento</a></nav><ThemeToggle theme={theme} toggle={toggle}/></header>
    <main id="hardware-main" className="hw-main">{checkout ? <HardwareCheckout delivery={delivery}/> : <ProductDetails delivery={delivery}/>}</main>
    <footer className="hw-footer"><a className="eco-brand" href="/">Nori<span>Eco</span></a><p>Equipamentos para acompanhar seu negócio.</p><nav aria-label="Rodapé de equipamentos"><a href="/marketplace/privacidade">Privacidade</a><a href="/marketplace/termos">Termos de uso</a><a href={support} target="_blank" rel="noopener noreferrer">Falar com a equipe</a></nav><small>© {new Date().getFullYear()} NoriEco</small></footer>
  </div>;
}
