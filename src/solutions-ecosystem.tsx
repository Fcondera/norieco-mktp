import { useEffect, useRef } from 'react';
import type { CSSProperties, PointerEvent } from 'react';
import { Link } from './lib/router';
import { contactLink } from './lib/core.mjs';
import './solutions-ecosystem.css';

// Original local CGI artwork; responsive WebP exports preserve transparency.
function ProductRender({ asset, kind }: { asset: string; kind: string }) {
  const base = import.meta.env.BASE_URL + 'ecosystem/' + asset + '-3d-';
  return <div className={`ecosystem-render ecosystem-${kind} ecosystem-float`}><img
    src={base + '700.webp'} srcSet={`${base}420.webp 420w, ${base}700.webp 700w`}
    sizes="(min-width: 701px) and (max-width: 950px) 210px, 270px"
    width="700" height="700" alt="" loading="lazy" decoding="async" draggable={false}
  /></div>;
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
    { name: 'Gestão', description: 'Vendas, mesas, cozinha e estoque no mesmo painel. Mais controle para você, menos correria para a equipe.', cta: 'Conhecer o sistema', message: 'o Nori Gestão', illustration: <ProductRender asset="gestao" kind="pos" /> },
    { name: 'Catálogo online', description: 'Sua marca, seu cardápio e um link para compartilhar. Os pedidos chegam direto ao seu painel.', cta: 'Conhecer o catálogo', message: 'o catálogo online', illustration: <ProductRender asset="catalogo" kind="phone" /> },
    { name: 'Marketplace regional', description: 'Um lugar para descobrir lojas e serviços do Amazonas. Encontre uma empresa e conheça o catálogo dela.', cta: 'Explorar marketplace', href: '/marketplace', illustration: <ProductRender asset="marketplace-brasil" kind="map" /> },
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
