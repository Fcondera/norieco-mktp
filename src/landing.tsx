import { ManagementLink } from './management-link';
import { HeroCarousel } from './hero-carousel';
import { GhostFlights } from './ghost-flights';
import { useEffect } from 'react';
import {useSiteTheme, ThemeToggle} from './site-theme';
import { Link } from './lib/router';
import { Icon } from './ui';
import { contactLink } from './lib/core.mjs';

function Ghost({ className = '' }: { className?: string }) {
  return <img className={`eco-ghost ${className}`} src={`${import.meta.env.BASE_URL}halloween/ghost-3d.webp`} width="280" height="280" alt="" aria-hidden="true" loading="lazy" decoding="async" />;
}
export function Landing() {
  const {theme, toggle} = useSiteTheme();
  useEffect(() => { document.title = 'NoriEco · Seu negócio conectado'; }, []);
  const phone = import.meta.env.VITE_SUPPORT_WHATSAPP || '5547992739983';
  const contact = (product = 'o Nori Gestão') => contactLink(phone, `Olá! Quero conhecer ${product}.`);
  const solutions = [
    { icon: 'shop', name: 'Nori Gestão', label: 'NO BALCÃO', description: 'Vendas, mesas, cozinha e estoque no mesmo painel. Mais controle para você, menos correria para a equipe.', cta: 'Conhecer o PDV', message: 'o Nori Gestão' },
    { icon: 'bag', name: 'Catálogo online', label: 'NA INTERNET', description: 'Sua marca, seu cardápio e um link para compartilhar. Os pedidos chegam direto ao seu painel.', cta: 'Conhecer o catálogo', message: 'o catálogo online' },
    { icon: 'pin', name: 'Marketplace regional', label: 'NA SUA REGIÃO', description: 'Um lugar para descobrir lojas e serviços do Amazonas. Encontre uma empresa e conheça o catálogo dela.', cta: 'Explorar marketplace', href: '/marketplace' },
  ];
  return <div className="eco-site eco-halloween" data-theme={theme}>
    <GhostFlights />
    <a className="skip-link" href="#eco-main">Pular para o conteúdo</a>
    <header className="eco-header">
      <a className="eco-brand" href="/" aria-label="NoriEco início"><img src={`${import.meta.env.BASE_URL}nori-logo-official.png`} alt="" /><span>Nori<span>Eco</span></span></a>
      <nav aria-label="Navegação institucional"><a href="#solucoes">Soluções</a><a href="#como-funciona">Como começar</a><ManagementLink>Acessar gestão ↗</ManagementLink></nav>
      <div className="eco-header-actions">
        <ThemeToggle theme={theme} toggle={toggle}/>
        <Link href="/marketplace" className="eco-button eco-small">Marketplace <Icon name="arrow" size={16} /></Link>
      </div>
    </header>
    <main id="eco-main">
      <div className="eco-season-hero"><HeroCarousel /><Ghost className="eco-ghost-hero" /><span className="eco-season-star" aria-hidden="true">✧</span></div>
      <section id="solucoes" className="eco-section eco-season-section">
        <Ghost className="eco-ghost-left" />
        <div className="eco-section-intro"><h2>Seu negócio inteiro.<br />Tudo mais simples.</h2><p>Gerencie a operação, receba pedidos e apareça para novos clientes.</p></div>
        <div className="eco-products eco-solutions">{solutions.map(solution => <article key={solution.name} className="eco-product eco-market"><div className="eco-product-symbol"><Icon name={solution.icon} size={32} /></div><h3>{solution.name}</h3><p>{solution.description}</p>{solution.href ? <Link className="eco-product-link" href={solution.href}>{solution.cta}<span aria-hidden="true">↗</span></Link> : <a className="eco-product-link" href={contact(solution.message)} target="_blank" rel="noopener noreferrer">{solution.cta}<span aria-hidden="true">↗</span></a>}</article>)}</div>
      </section>
      <section id="como-funciona" className="eco-business eco-season-section">
        <div><h2>Crie sua loja.<br />Conheça na prática.</h2><p>Entre no Nori Gestão, cadastre seus produtos e compartilhe seu catálogo. Teste por 15 dias, sem cartão para começar.</p><ManagementLink className="eco-button">Começar meu teste grátis <Icon name="arrow" size={18} /></ManagementLink></div>
        <ol className="eco-steps"><li><span>01</span><div><h3>Crie sua conta</h3><p>Entre com Google e cadastre sua empresa.</p></div></li><li><span>02</span><div><h3>Deixe a loja do seu jeito</h3><p>Adicione a logo, os produtos e os preços.</p></div></li><li><span>03</span><div><h3>Comece a vender</h3><p>Use o PDV e compartilhe o link do catálogo.</p></div></li></ol>
        <Ghost className="eco-ghost-right" />
      </section>
      <section className="eco-plan eco-season-section" aria-labelledby="eco-plan-title">
        <div className="eco-plan-copy"><h2 id="eco-plan-title">Mais controle.<br />Sem complicar.</h2><p>PDV, catálogo online e todos os módulos do Nori Gestão.</p></div>
        <div className="eco-plan-price"><p><strong>R$ 197</strong><span>/mês</span></p><span>15 dias grátis. A contratação é feita por você.</span><ManagementLink className="eco-button">Criar minha loja <Icon name="arrow" size={18} /></ManagementLink><a className="eco-plan-help" href={contact()} target="_blank" rel="noopener noreferrer">Ficou com dúvida? Fale com a gente ↗</a></div>
        <Ghost className="eco-ghost-plan" />
      </section>
    </main>
    <footer className="eco-footer"><div><a className="eco-brand" href="/">Nori<span>Eco</span></a><p>Seu negócio conectado. Do balcão ao Amazonas.</p></div><nav aria-label="Rodapé institucional"><Link href="/marketplace">Marketplace</Link><ManagementLink>Nori Gestão</ManagementLink><Link href="/privacidade">Privacidade</Link><Link href="/termos">Termos</Link><a href={contact()} target="_blank" rel="noopener noreferrer">Contato</a></nav><small>© {new Date().getFullYear()} NoriEco.<span className="eco-footer-ghost" aria-hidden="true"><Ghost /></span></small></footer>
  </div>;
}
