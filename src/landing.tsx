import { HeroCarousel } from "./hero-carousel";
import { useEffect } from "react";
import { Link } from "./lib/router";
import { Icon } from "./ui";
import { contactLink } from "./lib/core.mjs";

export function Landing() {
  useEffect(() => { document.title = "NoriEco · PDV, catálogo online e marketplace regional"; }, []);
  const phone = import.meta.env.VITE_SUPPORT_WHATSAPP || "5547992739983";
  const contact = (product = "soluções da NoriEco") => contactLink(phone, `Olá! Quero conhecer ${product} e solicitar uma proposta para minha empresa.`);
  const solutions = [
    { number: "01", icon: "shop", name: "Nori Gestão", label: "PDV PARA SUA OPERAÇÃO", description: "Organize as vendas do balcão, pedidos, mesas e cozinha. Acompanhe produtos e estoque com o PDV conectado ao seu catálogo.", tags: ["PDV e vendas", "Estoque", "Mesas e cozinha"], cta: "Conhecer o PDV", message: "o PDV Nori Gestão" },
    { number: "02", icon: "bag", name: "Catálogo online", label: "SUA LOJA RECEBENDO PEDIDOS", description: "Apresente seus produtos em um catálogo próprio, com carrinho e pedidos conectados ao Nori Gestão. Sua marca, seus produtos e sua operação no mesmo fluxo.", tags: ["Produtos", "Carrinho", "Pedidos integrados"], cta: "Conhecer o catálogo", message: "o catálogo online integrado ao Nori Gestão" },
    { number: "03", icon: "pin", name: "Marketplace regional", label: "O COMÉRCIO DA SUA REGIÃO", description: "Encontre lojas, restaurantes, produtos e serviços da região. As empresas aprovadas aparecem no marketplace, e os catálogos integrados recebem pedidos pelo Nori Gestão.", tags: ["Comércio local", "Lojas", "Descoberta por cidade"], cta: "Explorar marketplace", message: "o marketplace regional NoriEco", href: "/marketplace" },
  ];
  return <div className="eco-site">
    <a className="skip-link" href="#eco-main">Pular para o conteúdo</a>
    <header className="eco-header"><a className="eco-brand" href="/" aria-label="NoriEco início"><img src={`${import.meta.env.BASE_URL}nori-logo.png`} alt="" /><span>Nori<span>Eco</span></span></a>
      <nav aria-label="Navegação institucional"><a href="#solucoes">Soluções</a><a href="#como-funciona">Como funciona</a><a href="https://gestao.norieco.com.br/">Acessar gestão ↗</a></nav>
      <Link href="/" className="eco-button eco-small">Marketplace <Icon name="arrow" size={16} /></Link>
    </header>
    <main id="eco-main">
      <HeroCarousel />
      <div className="eco-strip"><span>Sua venda conectada, do balcão à internet.</span><span><Icon name="shop" size={18} /> PDV</span><span><Icon name="bag" size={18} /> Catálogo online</span><span><Icon name="pin" size={18} /> Marketplace regional</span></div>
      <section id="solucoes" className="eco-section"><div className="eco-section-intro"><span className="eco-kicker">SOLUÇÕES NORIECO</span><h2>Menos improviso.<br />Mais espaço para crescer.</h2><p>Escolha o que sua empresa precisa agora. Converse com a gente sobre implantação e condições.</p></div><div className="eco-products eco-solutions">{solutions.map((solution) => <article key={solution.number} className="eco-product eco-market"><span className="eco-product-number">{solution.number} / {solution.label}</span><div className="eco-product-symbol"><Icon name={solution.icon} size={36} /></div><h3>{solution.name}</h3><p>{solution.description}</p><div className="eco-tags">{solution.tags.map(tag => <span key={tag}>{tag}</span>)}</div>{solution.href ? <Link className="eco-product-link" href={solution.href}>{solution.cta} <span aria-hidden="true">↗</span></Link> : <a className="eco-product-link" href={contact(solution.message)} target="_blank" rel="noopener noreferrer">{solution.cta} <span aria-hidden="true">↗</span></a>}</article>)}</div></section>
      <section id="como-funciona" className="eco-business"><div><span className="eco-kicker">DO PRIMEIRO CONTATO À IMPLANTAÇÃO</span><h2>A solução começa<br />entendendo sua empresa.</h2><p>Cada negócio tem sua rotina. Conte o que você precisa organizar e receba uma proposta com escopo, implantação e condições de contratação.</p><a href={contact()} target="_blank" rel="noopener noreferrer" className="eco-button">Conversar com a equipe <Icon name="arrow" size={18} /></a></div><ol className="eco-steps"><li><span>01</span><div><h3>Conte o que precisa</h3><p>Explique sua operação e os desafios do dia a dia.</p></div></li><li><span>02</span><div><h3>Conheça sua proposta</h3><p>Alinhe as funcionalidades, o escopo e as condições.</p></div></li><li><span>03</span><div><h3>Prepare sua implantação</h3><p>Combine a configuração e a orientação para sua equipe.</p></div></li></ol></section>
      <section className="eco-market-callout"><div><span className="eco-kicker">QUER COMPRAR NA SUA REGIÃO?</span><h2>O comércio local tem seu lugar.</h2><p>No marketplace NoriEco, descubra lojas, produtos e serviços. Explore sem cadastro e entre na sua conta quando quiser comprar.</p></div><Link href="/" className="eco-button">Conhecer o marketplace <Icon name="arrow" size={18} /></Link></section>
      <section className="eco-contact"><span className="eco-kicker">VAMOS TIRAR SUA IDEIA DO PAPEL?</span><h2>Sua próxima etapa<br />pode começar aqui.</h2><a className="eco-button" href={contact()} target="_blank" rel="noopener noreferrer">Solicitar uma proposta ↗</a></section>
    </main><footer className="eco-footer"><div><a className="eco-brand" href="/">Nori<span>Eco</span></a><p>PDV, catálogo online e marketplace regional.</p></div><nav aria-label="Rodapé institucional"><a href="#solucoes">Soluções</a><Link href="/">Marketplace</Link><a href="https://gestao.norieco.com.br/">Nori Gestão</a><Link href="/privacidade">Privacidade</Link><Link href="/termos">Termos</Link><a href={contact()} target="_blank" rel="noopener noreferrer">Contato</a></nav><small>© {new Date().getFullYear()} NoriEco.</small></footer>
  </div>;
}
