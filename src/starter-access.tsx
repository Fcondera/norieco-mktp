import { useEffect } from "react";
export function StarterAccess() {
  useEffect(() => { window.location.assign("https://gestao.norieco.com.br/inicio"); }, []);
  return <section className="narrow panel"><span className="eyebrow">NORI GESTÃO · ACESSO INICIAL</span><h1>Sua empresa começa com três módulos.</h1><p>Crie sua página, cadastre produtos e serviços e acompanhe contatos no Nori Gestão, com a mesma conta Google do marketplace.</p><ul><li>Minha empresa: logo, endereço, contato e horários.</li><li>Produtos e serviços: ofertas da sua página.</li><li>Contatos e solicitações: interessados no seu negócio.</li></ul><p>Quando precisar de caixa, estoque, mesas e cozinha, solicite o plano PDV dentro do painel.</p><a className="button primary" href="https://gestao.norieco.com.br/inicio">Continuar no Nori Gestão ↗</a><p><small>O acesso inicial não libera as funções do PDV. Se solicitado no Gestão, selecione a mesma conta Google usada aqui.</small></p></section>;
}
