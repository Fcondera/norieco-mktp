import { useEffect, useRef } from 'react';
import type { CSSProperties, PointerEvent } from 'react';
import { Link } from './lib/router';
import { contactLink } from './lib/core.mjs';
import './solutions-ecosystem.css';

// Small inline illustrations keep the section independent of remote images or WebGL.
function Food({ kind = 'burger' }: { kind?: 'burger' | 'plate' }) {
  return <svg viewBox="0 0 100 74" className="ecosystem-food" focusable="false">
    <ellipse cx="50" cy="61" rx="35" ry="6" fill="currentColor" opacity=".1" />
    {kind === 'burger' ? <>
      <path d="M18 32C19 7 79 6 82 32Z" fill="var(--eco-orange)" />
      <path d="M23 30C27 13 69 12 77 28" fill="none" stroke="var(--eco-panel)" strokeWidth="3" opacity=".3" />
      <path d="m37 21 2 2m10-6 2 2m12 2 2 2m-9-9 2 2" stroke="var(--eco-panel)" strokeWidth="2" strokeLinecap="round" />
      <rect x="18" y="35" width="64" height="10" rx="5" fill="var(--ecosystem-food-dark)" />
      <path d="m17 34 12-3 12 5 12-4 14 4 16-4-2 8-12-1-17 3-12-4-13 3Z" fill="var(--green)" />
      <path d="m21 43 22 1 14 9 10-9 12 1v5H21Z" fill="var(--eco-orange)" />
      <path d="M18 52h64c1 15-64 15-64 0" fill="var(--eco-orange)" />
    </> : <>
      <ellipse cx="50" cy="39" rx="39" ry="25" fill="var(--ecosystem-screen)" stroke="var(--ecosystem-ui-line)" strokeWidth="3" />
      <ellipse cx="50" cy="38" rx="30" ry="18" fill="var(--ecosystem-ui-line)" />
      <path d="M26 33c3-15 22-11 24-4l-1 15-20 2Z" fill="var(--ecosystem-screen)" />
      <path d="m47 26 18 1 12 11-8 12-24-6Z" fill="var(--eco-orange)" />
      <path d="m55 31 12 7m-13 0 10 7" stroke="var(--ecosystem-food-dark)" strokeWidth="2" opacity=".45" />
      <path d="m24 47 7-6 5 4 9-3 4 7-11 5Z" fill="var(--green)" />
    </>}
  </svg>;
}

function PosIllustration() {
  return <div className="ecosystem-pos ecosystem-float">
    <div className="ecosystem-pos-foot" /><div className="ecosystem-pos-neck" />
    <div className="ecosystem-terminal"><div className="ecosystem-terminal-screen">
      <div className="ecosystem-pos-nav"><i /><i /><i /><i /></div>
      <div className="ecosystem-pos-content"><div className="ecosystem-screen-heading"><b>Seu balcão</b><span>•••</span></div>
        <div className="ecosystem-pos-menu"><div><Food /><span>Hambúrguer</span></div><div><Food kind="plate" /><span>Prato do dia</span></div></div>
        <div className="ecosystem-order-line"><span>Pedido</span><b>02 itens</b></div><div className="ecosystem-screen-action">Finalizar venda <span>→</span></div>
      </div>
    </div><div className="ecosystem-terminal-chin" /></div>
    <div className="ecosystem-printer"><div className="ecosystem-printer-slot" /><div className="ecosystem-receipt"><i /><i /><i /><i /></div><span /></div>
  </div>;
}

function CatalogIllustration() {
  return <div className="ecosystem-phone ecosystem-float"><div className="ecosystem-phone-screen">
    <div className="ecosystem-phone-status"><span>9:41</span><span>•• ▰</span></div><div className="ecosystem-phone-camera" />
    <div className="ecosystem-phone-heading"><b>Seu cardápio</b><span>Escolha seu favorito</span></div>
    <div className="ecosystem-phone-feature"><Food /><div><b>Hambúrguer</b><span>R$ 28,00 <i>+</i></span></div></div>
    <div className="ecosystem-phone-item"><Food kind="plate" /><div><b>Prato do dia</b><span>R$ 32,00</span></div><i>+</i></div>
    <div className="ecosystem-phone-cart">Ver pedido <span>→</span></div><div className="ecosystem-phone-home" />
  </div></div>;
}

function Building({ x, y, size = 18 }: { x: number; y: number; size?: number }) {
  return <g transform={`translate(${x} ${y})`}>
    <path d={`M0 0 ${size} -9 ${size + 16} -1 16 9Z`} fill="var(--ecosystem-roof)" />
    <path d={`M0 0 16 9 16 29 0 20Z`} fill="var(--ecosystem-building-side)" />
    <path d={`M16 9 ${size + 16} -1 ${size + 16} 19 16 29Z`} fill="var(--ecosystem-building)" />
    <path d="m5 8 6 3v8l-6-3Zm17 5 6-3v8l-6 3Z" fill="var(--ecosystem-window)" />
  </g>;
}

function MapIllustration() {
  const outline = 'M42 63 81 54 95 34 128 46 153 37 179 53 217 42 228 62 260 69 272 99 254 119 270 140 239 153 213 180 181 169 153 189 126 172 92 178 75 152 45 145 52 118 31 96Z';
  return <svg className="ecosystem-map ecosystem-float" viewBox="0 0 310 230" focusable="false">
    <ellipse cx="155" cy="200" rx="107" ry="12" fill="var(--ecosystem-shadow)" opacity=".23" />
    <path d={outline} transform="translate(0 12)" fill="var(--ecosystem-terrain-side)" />
    <path d={outline} fill="var(--ecosystem-terrain)" stroke="var(--ecosystem-terrain-edge)" strokeWidth="1.5" />
    <path d="M43 94c29 2 22 26 49 23s25-20 46-12 19 30 49 27 36-15 70-6" fill="none" stroke="var(--ecosystem-river-bank)" strokeWidth="12" strokeLinecap="round" />
    <path d="M43 94c29 2 22 26 49 23s25-20 46-12 19 30 49 27 36-15 70-6" fill="none" stroke="var(--ecosystem-river)" strokeWidth="7" strokeLinecap="round" />
    <path d="M82 78 144 69 209 89 223 150 165 162 106 144" fill="none" stroke="var(--ecosystem-road)" strokeWidth="3" strokeLinejoin="round" />
    <path className="ecosystem-map-route" d="M82 78 144 69 209 89 223 150 165 162 106 144" fill="none" stroke="var(--eco-orange)" strokeWidth="2" pathLength="100" />
    <Building x={69} y={69} size={20} /><Building x={132} y={58} size={17} /><Building x={193} y={80} size={23} /><Building x={96} y={137} size={16} /><Building x={202} y={145} size={16} />
    {[[87,47],[215,55],[118,116]].map(([x,y], index) => <g key={x} className="ecosystem-map-marker" style={{ '--marker-delay': `${index * -.8}s` } as CSSProperties}>
      <ellipse cx={x} cy={y+14} rx="8" ry="3" fill="var(--ecosystem-shadow)" opacity=".15" />
      <path d={`M${x} ${y+12}c-3-4-8-8-8-13a8 8 0 0 1 16 0c0 5-5 9-8 13Z`} fill="var(--eco-primary)" /><circle cx={x} cy={y-1} r="3" fill="var(--ecosystem-screen)" />
    </g>)}
  </svg>;
}

export function SolutionsEcosystem() {
  const section = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = section.current;
    if (!root || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        (entry.target as HTMLElement).dataset.revealed = 'true';
        observer.unobserve(entry.target);
      }
    }), { threshold: .12 });
    root.querySelectorAll('.ecosystem-card,.ecosystem-panel').forEach(element => observer.observe(element));
    const visibility = new IntersectionObserver(([entry]) => {
      root.dataset.visible = String(entry.isIntersecting);
    });
    visibility.observe(root);
    return () => { observer.disconnect(); visibility.disconnect(); };
  }, []);
  function tilt(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== 'mouse' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const card = event.currentTarget, rect = card.getBoundingClientRect();
    card.style.setProperty('--tilt-x', `${(event.clientY - rect.top) / rect.height * -6 + 3}deg`);
    card.style.setProperty('--tilt-y', `${(event.clientX - rect.left) / rect.width * 10 - 5}deg`);
  }
  function reset(event: PointerEvent<HTMLElement>) {
    event.currentTarget.style.setProperty('--tilt-x', '0deg');
    event.currentTarget.style.setProperty('--tilt-y', '0deg');
  }
  const phone = import.meta.env.VITE_SUPPORT_WHATSAPP || '5547992739983';
  const solutions = [
    { name: 'Gestão', description: 'Vendas, mesas, cozinha e estoque no mesmo painel. Mais controle para você, menos correria para a equipe.', cta: 'Conhecer o sistema', message: 'o Nori Gestão', illustration: <PosIllustration /> },
    { name: 'Catálogo online', description: 'Sua marca, seu cardápio e um link para compartilhar. Os pedidos chegam direto ao seu painel.', cta: 'Conhecer o catálogo', message: 'o catálogo online', illustration: <CatalogIllustration /> },
    { name: 'Marketplace regional', description: 'Um lugar para descobrir lojas e serviços do Amazonas. Encontre uma empresa e conheça o catálogo dela.', cta: 'Explorar marketplace', href: '/marketplace', illustration: <MapIllustration /> },
  ];
  return <div className="ecosystem-solutions" ref={section}>
    <div className="eco-products eco-solutions ecosystem-cards">
      {solutions.map((solution, index) => <article className="eco-product eco-market ecosystem-card" key={solution.name} style={{ '--card-order': index } as CSSProperties} onPointerMove={tilt} onPointerLeave={reset}>
        <div className="ecosystem-illustration" aria-hidden="true"><div className="ecosystem-perspective">{solution.illustration}</div></div>
        <h3>{solution.name}</h3><p>{solution.description}</p>
        {solution.href ? <Link className="eco-product-link" href={solution.href}>{solution.cta}<span aria-hidden="true">→</span></Link> : <a className="eco-product-link" href={contactLink(phone, `Olá! Quero conhecer ${solution.message}.`)} target="_blank" rel="noopener noreferrer">{solution.cta}<span aria-hidden="true">→</span></a>}
      </article>)}
    </div>
    <svg className="ecosystem-connections" viewBox="0 0 1144 116" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      {[['M184 1V28Q184 56 212 56H544Q572 56 572 84',0],['M572 1V84',1],['M960 1V28Q960 56 932 56H600Q572 56 572 84',2]].map(([d, index]) => <g key={d}>
        <path d={String(d)} className="ecosystem-connection" /><path d={String(d)} className="ecosystem-signal" pathLength="100" style={{ animationDelay: `${Number(index)*.6}s` }} />
      </g>)}
      <path className="ecosystem-connection" d="M572 84V116" /><circle cx="184" cy="2" r="3" /><circle cx="572" cy="2" r="3" /><circle cx="960" cy="2" r="3" /><circle className="ecosystem-node" cx="572" cy="84" r="5" />
    </svg>
    <div className="ecosystem-panel"><h3>Tudo em um único <span>ecossistema</span><br className="ecosystem-desktop-break" /> para sua gestão</h3><p>Gerencie vendas, catálogo online e presença no marketplace regional em uma estrutura integrada, simples e pronta para crescer com seu negócio.</p></div>
  </div>;
}
