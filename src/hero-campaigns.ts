export type HeroCampaign = {
  key: string; label: string; title: string; description: string;
  primary: string; href: string; secondary: string; message: string;
  asset: string; width: number; height: number; layout: 'scene' | 'banner';
};

export const heroCampaigns: HeroCampaign[] = [
  {
    key: 'gestao', label: 'Nori Gestão para seu negócio',
    title: 'Seu negócio mais organizado.',
    description: 'Vendas, pedidos e estoque no mesmo painel. Mais controle para você e sua equipe.',
    primary: 'Conhecer o sistema', href: '#como-funciona', secondary: 'Falar com a equipe',
    message: 'Olá! Quero conhecer o Nori Gestão.',
    asset: 'nori-estudio', width: 1974, height: 797, layout: 'scene',
  },
  {
    key: 'assinatura', label: 'Consultar oferta de 1 mês grátis na assinatura do Nori Gestão',
    title: 'Assine o Nori Gestão e ganhe 1 mês grátis.',
    description: 'Conheça a oferta e confirme as condições com a nossa equipe.',
    primary: 'Consultar oferta', href: '', secondary: '',
    message: 'Olá! Quero conhecer a oferta de 1 mês grátis ao assinar o Nori Gestão.',
    asset: 'nori-assinatura', width: 1962, height: 802, layout: 'banner',
  },
  {
    key: 'ofertas', label: 'Consultar ofertas: 1 mês grátis na assinatura ou 3 meses grátis ao comprar o PDV completo',
    title: 'Compre o PDV completo e ganhe 3 meses grátis.',
    description: 'Ou assine o sistema e ganhe 1 mês grátis. Fale com a equipe para conhecer as condições.',
    primary: 'Falar com a nossa equipe', href: '', secondary: '',
    message: 'Olá! Quero conhecer as ofertas Nori Gestão: 1 mês grátis na assinatura ou 3 meses grátis na compra do PDV completo.',
    asset: 'nori-ofertas', width: 1966, height: 800, layout: 'banner',
  },
];
