import { Link } from "./lib/router";
import { contactLink } from "./lib/core.mjs";
import { Icon } from "./ui";
import { ManagementLink } from "./management-link";

const support = () => contactLink(import.meta.env.VITE_SUPPORT_WHATSAPP || "5547992739983", "Olá! Preciso de ajuda com o marketplace NoriEco.");
export function MarketplaceFooter() {
  return <footer className="marketplace-footer"><div className="container"><div className="mkt-footer-grid">
    <div className="mkt-footer-brand"><Link href="/" className="brand"><img src={`${import.meta.env.BASE_URL}nori-logo-official.png`} alt="" /><strong>Nori<span>Eco</span></strong></Link><p>Lojas e serviços do Amazonas.</p><a href={support()} target="_blank" rel="noopener noreferrer" className="mkt-support-icon" aria-label="Falar com o suporte no WhatsApp"><Icon name="message" size={20} /></a></div>
    <nav aria-label="Acesso rápido"><h2>Acesso rápido</h2><Link href="/">Início</Link><Link href="/">Lojas e categorias</Link><Link href="/carrinho">Carrinho</Link><Link href="/ajuda">Como funciona</Link><a href="/">Ecossistema NoriEco</a></nav>
    <nav aria-label="Nori Gestão"><h2>Nori Gestão</h2><ManagementLink>Abrir Nori Gestão</ManagementLink><ManagementLink>Criar loja · 15 dias grátis</ManagementLink><Link href="/conta/pedidos">Meus pedidos</Link></nav>
    <nav aria-label="Suporte"><h2>Suporte</h2><Link href="/ajuda">Central de ajuda</Link><a href={support()} target="_blank" rel="noopener noreferrer">Fale com a NoriEco ↗</a></nav>
    <nav aria-label="Informações legais"><h2>Legal</h2><Link href="/termos">Termos de uso</Link><Link href="/privacidade">Política de privacidade</Link><Link href="/ajuda">Compras e cancelamentos</Link></nav>
  </div><div className="mkt-footer-bottom"><small>© {new Date().getFullYear()} NoriEco. Conectando o comércio local no Amazonas.</small></div></div></footer>;
}
export function MarketplaceHelp() {
  return <section className="narrow mkt-help"><span className="eyebrow">AJUDA NORIECO</span><h1>Compre perto. Entenda cada etapa.</h1><p>Informações para descobrir lojas, comprar e vender no marketplace.</p>{[
    ["Como encontro lojas da minha cidade?", "Use o seletor de cidade no topo, escolha uma categoria ou pesquise por loja, produto ou serviço. Sem cidade selecionada, você explora o Amazonas."],
    ["Preciso entrar para navegar?", "Não. O marketplace e os catálogos das lojas são públicos. No catálogo, informe os dados solicitados pela loja para fazer seu pedido. Para criar ou administrar uma loja, o ícone de usuário abre o Nori Gestão: faça um único login e comece seu teste de 15 dias."],
    ["Como faço meu pedido?", "Abra o perfil da loja e clique em Abrir catálogo. No catálogo da própria loja, adicione os produtos, confira o carrinho e escolha entrega, retirada e pagamento entre as opções disponíveis. O pedido segue para a empresa responsável no Nori Gestão. Outros perfis oferecem contato direto pelo WhatsApp."],
    ["Como funcionam pagamento e entrega?", "Confira os meios de pagamento, taxa e área de entrega apresentados pela loja antes de confirmar. O pagamento é combinado com a empresa; a plataforma não oferece carteira nem cobrança por gateway nesta versão."],
    ["Como são escolhidos os destaques e rankings?", "Em destaque reúne perfis selecionados pela administração. Top 3 vendedores considera a quantidade de avaliações publicadas, com desempate pela nota. Melhores lojas considera a nota média, com desempate pela quantidade de avaliações. Os rankings usam as lojas da seleção atual, não representam volume de vendas."],
    ["Preciso cancelar ou resolver um problema com a compra", "Acesse Meus pedidos e entre em contato com a loja responsável para solicitar cancelamento, correção ou reembolso e verificar o andamento. Se precisar de ajuda com a plataforma, fale com o suporte NoriEco. Não há cancelamento automático nesta página."],
    ["Como minha empresa aparece no marketplace?", "Abra o Nori Gestão pelo ícone de usuário e cadastre sua loja para testar o PDV por 15 dias, sem cobrança automática. Sua página recebe um endereço norieco.com.br/nomedaloja. Documentos podem ser enviados depois; o selo depende da análise. Produtos, estoque e pedidos são administrados no Gestão."],
  ].map(([question,answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}<div className="actions"><Link href="/" className="button primary">Explorar marketplace</Link><a href={support()} target="_blank" rel="noopener noreferrer" className="button secondary">Falar com o suporte ↗</a></div></section>;
}
