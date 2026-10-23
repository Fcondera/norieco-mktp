# NoriEco Marketplace

Fonte oficial: https://github.com/Fcondera/norieco-mktp

Marketplace público do Amazonas em React/TypeScript/Vite, Node 24. Gestão/PDV e catálogos permanecem no repositório `vendapeixe`. Navegação e carrinho públicos; login ao comprar ou vender.

## Divisão de endereços

- `https://norieco.com.br/`: landing page institucional do ecossistema.
- A LP apresenta somente as ofertas atuais: PDV Nori Gestão, catálogo online integrado e marketplace regional. O hero tem três slides. PDV e catálogo têm contato pelo WhatsApp; o marketplace tem acesso direto. Não são anunciados serviços de criação de sites ou controle de ponto. Funcionalidades internas do Gestão continuam preservadas. O cabeçalho de compras mostra o acesso à conta somente pelo ícone, também no celular.
- `https://norieco.com.br/marketplace`: descoberta de lojas e serviços.
- `/:slug`: catálogo padrão Flutter da empresa, com logo, banners, cores, categorias, carrinho e pedidos (ex.: `/adega-asvluth`). A URL permanece no domínio NoriEco.
- `/marketplace/loja/:slug`: perfil informativo da empresa; lojas integradas têm um botão e link para seu catálogo. Cards e rankings levam ao perfil, sem encaminhamento automático.
- `/marketplace/carrinho` e `/marketplace/finalizar`: compatibilidade com carrinhos anteriores. O novo fluxo de compra fica no catálogo padrão da loja.
- O ícone de usuário e o item Gestão da barra inferior abrem o PWA existente em `gestao.norieco.com.br/inicio`, com sessão única e teste de 15 dias. Não abrem um painel de comprador.
- `/marketplace/conta`: entrada antiga encaminhada ao Gestão. Visitantes seguem direto; usuários já autenticados podem transferir a sessão pelo botão, sem repetir o login.
- `/marketplace/conta/compras` e `/marketplace/conta/pedidos`: área secundária de compras e acompanhamento de pedidos.
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

### Painel inicial para empresas

Desde 22/10/2026, `/marketplace/cadastrar-empresa` e `/marketplace/empresa` levam diretamente a `https://gestao.norieco.com.br/inicio`. Quem já entrou no marketplace abre o Gestão sem outro login por uma ponte de sessão com origem, janela e nonce verificados. Tokens não são colocados na URL; o painel recebe uma sessão independente. Novos vendedores criam a empresa e sua página `/:slug` com teste completo de 15 dias, sem documentos iniciais e sem cobrança automática. Empresas existentes mantêm seu acesso e dados.

O servidor provisiona um tenant vazio e seu administrador. Ao vencer o teste, preserva os dados e suspende operações até a administração liberar, prorrogar ou pausar em Clientes do sistema. Documentos podem ser enviados depois; o selo exige análise. O portal antigo de três módulos continua em `/pagina`. Lojas integradas mantêm estoque, carrinho, cozinha e pedidos. Consulte [acesso único e testes](docs/SELF_SERVICE_TRIALS_AND_SSO.md) para migrações, segurança e validação.

Migração `202610190001_starter_business_portal.sql` aplicada e registrada em 19/10/2026. Acrescenta campos públicos de ofertas, solicitações privadas, pedidos comerciais de plano e RPCs de acesso inicial. Preserva dados e permissões existentes. Callback Google adicionado somente para `/inicio` no domínio do Gestão.

Mantém o Supabase `nwksgeqkstbbcjpcwvqa`, Google, usuários, tenants, produtos e pedidos existentes. Separar o Git não duplica nem altera o banco. Login usa PKCE e armazenamento `norieco-marketplace-auth-v1`; sair encerra somente a sessão local do marketplace.

O catálogo compartilha o build público do Gestão por rewrites HTTP 200 na Netlify. Arquivos React e rotas reservadas têm prioridade. O Flutter resolve `/slug` pelo alias empresarial já cadastrado no backend; carrinho e preenchimento são separados por tenant. Não há cópia do PDV neste repositório. O catálogo nesse domínio não instala worker/manifesto na raiz; o PWA do Gestão continua em seu domínio. `npm run test:catalog` valida o Flutter compilado em `../vendapeixe/build/web` com dois tenants simulados e sem gravar pedidos reais.

Tabelas `marketplace_*` têm RLS e operações por RPC. O checkout resolve a empresa pelo slug verificado, valida itens, preços, endereço, estoque e idempotência e cria o pedido real no Gestão, incluindo cozinha. Produtos continuam administrados no Gestão. Documentos são privados; imagens públicas ficam em bucket separado.

As migrações `202610180003`, `202610180004` e `202610180005` já foram aplicadas. Não execute novamente, não faça reset nem push automático: dependem do esquema do Gestão. Mudanças futuras no banco compartilhado precisam ser coordenadas e aditivas.

## Publicação independente na Netlify

1. Crie um projeto conectado a `Fcondera/norieco-mktp`, branch `main`, base na raiz.
2. O `netlify.toml` define Node 24, build `node scripts/netlify-build.mjs` e publicação `dist`. A Netlify instala as dependências pelo lockfile.
3. Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` com os mesmos valores públicos atuais. Também são aceitos os nomes `SUPABASE_URL` e `SUPABASE_ANON_KEY`. WhatsApp opcional: `VITE_SUPPORT_WHATSAPP` ou `NORI_SUPPORT_WHATSAPP`.
4. Valide o endereço temporário Netlify. Para testar Google nele, adicione seu callback exato à lista de URLs permitidas no Supabase.
5. Transfira apenas `norieco.com.br` e `www.norieco.com.br` ao novo projeto e ajuste DNS/HTTPS conforme a Netlify. Preserve o projeto e os domínios do Gestão e dos catálogos.
6. O callback definitivo continua `https://norieco.com.br/auth/callback`; preserve os callbacks do Gestão e o `site_url` atual. Não precisa de novo provedor Google.
7. A cópia `apps/norieco` e a etapa de build React já foram retiradas do `vendapeixe`. Depois da transferência, confirme que os aliases raiz pertencem somente ao projeto deste repositório.

Este repositório é a única fonte do site e marketplace. A duplicação em `vendapeixe/apps/norieco` e a página institucional Flutter antiga foram retiradas. O projeto antigo exibe somente um aviso de atualização caso o domínio raiz ainda aponte para ele; a publicação deste site depende de conectar este Git na Netlify e transferir os aliases raiz. O script antigo de exportação foi removido. Não exporte o marketplace de volta para o Gestão.

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
