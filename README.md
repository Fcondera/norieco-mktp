# NoriEco Marketplace

Fonte oficial: https://github.com/Fcondera/norieco-mktp

Marketplace público do Amazonas em React/TypeScript/Vite, Node 24. Gestão/PDV e catálogos permanecem no repositório `vendapeixe`. Navegação e carrinho públicos; login ao comprar ou vender.

## Divisão de endereços

- `https://norieco.com.br/`: landing page institucional do ecossistema.
- A LP apresenta Nori Gestão, controle de ponto e NoriEco Sites. Propostas são solicitadas pelo WhatsApp, com mensagem específica de cada solução, sem preços ou planos inventados. O marketplace tem botão próprio no navbar; o cabeçalho de compras mostra o acesso à conta somente pelo ícone, também no celular.
- `https://norieco.com.br/marketplace`: descoberta de lojas e serviços.
- `/marketplace/loja/:slug`: página da empresa.
- `/marketplace/carrinho` e `/marketplace/finalizar`: compra.
- `/marketplace/conta` e `/marketplace/conta/pedidos`: cliente.
- `/marketplace/cadastrar-empresa` e `/marketplace/empresa`: vendedor.
- `/marketplace/administracao`: administração do marketplace.
- `https://gestao.norieco.com.br`: Gestão/PDV, no projeto original.

O callback Google existente `/auth/callback` continua aceito para não invalidar a configuração de autenticação. Ao concluir, retorna à área `/marketplace`. Links antigos da loja/conta continuam acessíveis e são normalizados. A LP não exige login; a sessão e o carrinho permanecem os mesmos.

Na descoberta do marketplace, destaques são perfis selecionados pela administração. Top 3 vendedores usa a quantidade de avaliações publicadas, com desempate pela nota; melhores lojas usa nota média, com desempate pela quantidade de avaliações. As listas usam as lojas da seleção atual retornada pela busca (até 60), nunca números de vendas ou dados fictícios. Sem avaliações, não há posições inventadas. O filtro de cidade restringe todas essas listas. `/marketplace/ajuda` explica o funcionamento e os critérios. O rodapé contém acesso rápido, conta, suporte e informações legais, com links funcionais e contato oficial disponível.

## Desenvolvimento

```powershell
git clone https://github.com/Fcondera/norieco-mktp.git
cd norieco-mktp
npm ci
Copy-Item .env.example .env.local
# Preencha URL e chave pública do MESMO Supabase atual.
npm run dev
```

Pasta de trabalho atual: `C:\Users\maric\OneDrive\Documentos\norieco`. Acesso: http://127.0.0.1:5174. `.env.local`, dependências e compilados não são versionados. Nunca use `service_role` no frontend.

## Backend compartilhado

Mantém o Supabase `nwksgeqkstbbcjpcwvqa`, Google, usuários, tenants, produtos e pedidos existentes. Separar o Git não duplica nem altera o banco. Login usa PKCE e armazenamento `norieco-marketplace-auth-v1`; sair encerra somente a sessão local do marketplace.

Tabelas `marketplace_*` têm RLS e operações por RPC. O checkout resolve a empresa pelo slug verificado, valida itens, preços, endereço, estoque e idempotência e cria o pedido real no Gestão, incluindo cozinha. Produtos continuam administrados no Gestão. Documentos são privados; imagens públicas ficam em bucket separado.

As migrações `202610180003`, `202610180004` e `202610180005` já foram aplicadas. Não execute novamente, não faça reset nem push automático: dependem do esquema do Gestão. Mudanças futuras no banco compartilhado precisam ser coordenadas e aditivas.

## Publicação independente na Netlify

1. Crie um projeto conectado a `Fcondera/norieco-mktp`, branch `main`, base na raiz.
2. O `netlify.toml` define Node 24, build `node scripts/netlify-build.mjs` e publicação `dist`. A Netlify instala as dependências pelo lockfile.
3. Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` com os mesmos valores públicos atuais. Também são aceitos os nomes `SUPABASE_URL` e `SUPABASE_ANON_KEY`. WhatsApp opcional: `VITE_SUPPORT_WHATSAPP` ou `NORI_SUPPORT_WHATSAPP`.
4. Valide o endereço temporário Netlify. Para testar Google nele, adicione seu callback exato à lista de URLs permitidas no Supabase.
5. Transfira apenas `norieco.com.br` e `www.norieco.com.br` ao novo projeto e ajuste DNS/HTTPS conforme a Netlify. Preserve o projeto e os domínios do Gestão e dos catálogos.
6. O callback definitivo continua `https://norieco.com.br/auth/callback`; preserve os callbacks do Gestão e o `site_url` atual. Não precisa de novo provedor Google.
7. Depois de confirmar o novo site, retire `apps/norieco`, o build do marketplace e suas regras exclusivas de domínio do `vendapeixe`.

Durante a transição, o site atual continua publicado no projeto Netlify antigo. A cópia em `vendapeixe/apps/norieco` permanece congelada para não interromper o site antes da transferência. Este repositório é a fonte oficial; não edite nem sincronize as duas cópias. O script antigo de exportação foi removido.

O bundle publica assets na raiz e usa fallback SPA no Netlify para a LP e todas as rotas `/marketplace`. A regra do antigo worker Flutter permanece para retirar caches antigos. A mudança de hospedagem não exige migração de dados nem troca do armazenamento de login/carrinho.

## Operação e testes

Empresas importadas entram como rascunho: responsável completa cadastro/documentos; administrador revisa em `/administracao`. No Gestão, Configurações → Atendimento na NoriEco controla horários e recebimento no marketplace sem fechar os catálogos próprios. Pix, dinheiro e cartão são combinados com a loja; não há gateway de pagamento nesta versão.

Suporte temporário: +55 (47) 99273-9983. Revise identificação jurídica e termos antes da divulgação em escala.

```powershell
npm test
npm run build
# Em outro terminal, deixe npm run dev aberto:
npm run test:browser
node scripts/verificar-integracao.mjs
```

O último comando depende de `.env.local` e só lê o Supabase real; não cria pedidos.

`npm run test:database` usa PGlite isolado e exige o checkout `vendapeixe` ao lado desta pasta, pois testa o esquema real do Gestão junto às migrações do marketplace. Não usa credenciais nem altera banco remoto. Cobre dois tenants, RLS, documentos, privilégios, itens cruzados, idempotência, preços, rollback, pedido e cozinha. O navegador usa dados simulados; consentimento Google real exige teste interativo.
