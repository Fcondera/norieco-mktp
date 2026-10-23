# Revisão web — NoriEco — 23/10/2026

## Escopo e arquitetura preservada

Revisão de código, build de produção, navegação em Chrome, acessibilidade automática, erros de rede/JavaScript, layout, autenticação e testes de integração. Larguras verificadas: 1440, 390 e 320 px. Catálogos compilados também testados em 1200 e 390 px.

- `norieco.com.br/`: landing page React/Vite.
- `/marketplace`: descoberta pública de lojas; `/marketplace/loja/:slug`: informações e link da loja.
- `norieco.com.br/:slug`: catálogo Flutter existente, servido por proxy HTTP 200, sem redirecionar o comprador para o subdomínio.
- `gestao.norieco.com.br`: aplicação Flutter compartilhada, autenticação e painel da empresa. O acesso da NoriEco transfere a identidade por uma ponte com origem, janela e nonce validados, obtendo sessão independente no servidor.
- Supabase compartilhado: contexto da empresa no backend e políticas RLS; catálogo usa sessão pública independente e domínio vinculado ao tenant. Carrinhos dos catálogos no mesmo domínio têm chaves separadas por empresa.
- Domínios existentes do Renato Pescados e da Asvluth permanecem compatíveis. O marketplace não substitui nem duplica o catálogo Flutter.

## Problemas encontrados e correções

| Problema | Correção | Evidência |
| --- | --- | --- |
| Link de suporte distinguível apenas pela cor | Sublinhado nos links dentro de textos, avisos e estados vazios | Auditoria axe em três larguras |
| Rodapé mudava de posição enquanto dados chegavam | Altura mínima da área principal durante carregamento | No perfil Asvluth, CLS observado caiu de 0,23/0,50/0,54 para 0 nas medições locais de 1440/390/320 px |
| Perfil sem capa reservava uma faixa vazia | Capa só é exibida quando há URL cadastrada | Teste de navegador com perfil sem capa |
| Capa com texto era cortada nas laterais no celular | Área proporcional e imagem inteira, sem recortar o anúncio | Inspeção visual com a capa real da Asvluth |
| Busca não tinha envio por Enter | Formulário de pesquisa com rótulo explícito e envio por teclado; respeita movimento reduzido | Teste de busca e deslocamento até resultados |
| Tentar novamente recarregava a página e perdia filtros | Repetição da consulta mantendo termo/cidade/categoria | Falha 503 simulada, recuperação e termo preservado |
| Perfil indisponível ou consulta com falha sem saída útil | Recuperação de consulta, link para outras lojas e título claro para perfil ausente | Teste de falha/recuperação e auditoria de loja inexistente |
| Título genérico nos perfis | Nome da loja no título da aba | Teste de navegador |
| Seletor de cidade não restaurava o valor atual; limpar exigia ação extra | Rascunho sincronizado ao abrir; Todo o Amazonas aplica a limpeza; Escape fecha e devolve foco | Testes de filtro e persistência |
| Resposta de perfil pendente podia chegar após logout/troca de sessão | Respostas são aceitas apenas na geração de autenticação que as iniciou; troca de usuário limpa o perfil anterior; refresh da mesma sessão preserva a página | Teste segura a resposta do perfil, encerra sessão, libera a resposta e verifica que o avatar anterior não retorna |
| Carrinho do catálogo sem nome acessível | Nome com quantidade de itens para leitor de tela | Teste Flutter de semântica e auditoria do catálogo |
| Banner sem título gerava imagem sem identificação | Descrição alternativa padrão e semântica de imagem/ação sem filhos duplicados | Auditoria do catálogo compilado |
| Arquivos Flutter sem hash tinham cache imutável por um ano | `/assets/*` passa a exigir revalidação HTTP | Configuração Netlify; arquivos principais continuam com revalidação |
| Teste público de produtos ainda simulava consulta antiga | Fixture passa a exigir `public_catalog_products`, mantendo verificações do domínio e chave pública | Suíte Flutter completa: 158 testes aprovados |
| Ajuda ainda descrevia compra dentro do marketplace e exigia Google para o catálogo | Texto orienta perfil → Abrir catálogo → pedido da loja; criação/administração passa pelo Gestão | Revisão de conteúdo e teste de navegador |

As medições de CLS são observações de laboratório, não métricas de usuários reais. Não foi feita promessa de uma pontuação de desempenho em produção. O primeiro carregamento do Flutter continua mais pesado que o site React; reescrever o catálogo não faz parte desta correção.

## Validação

- `flutter test --no-pub`: **158 aprovados**. Inclui estoque, receitas, mesas/comandas, cozinha, impressão, contingência e isolamento já cobertos pela suíte.
- `flutter analyze --no-pub lib/widgets/store_app_bar.dart lib/screens/home_screen.dart test/storefront_test.dart`: sem problemas.
- `flutter build web --release --no-pub --no-wasm-dry-run`: concluído.
- `npm test`: **10 aprovados**, incluindo rotas reservadas, URLs seguras, carrinho, rankings, migração de worker e validação da ponte de sessão.
- `npm run build`: concluído.
- `npm run test:browser`: navegação desktop/mobile, filtros, estados vazios, falhas/recuperação, perfil, onboarding, checkout legado, sessão e logout.
- `npm run test:database`: **5 aprovados** em banco isolado, incluindo RLS, documentos privados, idempotência de pedidos, cozinha em dois tenants, trial de 15 dias e bloqueio de elevação de acesso.
- `npm run test:catalog`: catálogo Flutter real compilado, duas lojas no mesmo domínio, carrinhos separados, sem redirecionamento e sem worker global sobre o marketplace.
- `npm run test:bridge`: Flutter compilado recebe a mesma identidade e abre o onboarding com sessão independente, sem segundo login.
- `npm audit --omit=dev`: **nenhuma vulnerabilidade conhecida** nas dependências de produção na data da revisão.
- Nova ferramenta `npm run audit:web`: relatório JSON em `test-results/web-audit-latest.json`; falha em erros de execução, transbordamento horizontal e violações graves/críticas de acessibilidade. Aceita `AUDIT_BASE_URL`, `AUDIT_REPORT_TAG` e `--react-only` para validação local.

Os testes de banco e os fluxos autenticados usam fixtures. A visita aos sites reais é somente leitura. Não foram criados usuários, pedidos, pagamentos ou vendas fictícias em produção.

## Infraestrutura, dados e publicação

Não há migração SQL, alteração de dados, variáveis de ambiente, DNS, certificado, CORS ou configuração de login nesta entrega. A alteração de infraestrutura é o cabeçalho de cache no projeto Gestão. A chave pública permanece pública; nenhuma chave administrativa foi adicionada ao navegador. A entrega é web; o pacote Windows existente não foi substituído por alterações apenas de apresentação/acessibilidade.

Arquivos principais: `src/public-pages.tsx`, `src/main.tsx`, `src/state.tsx`, `src/styles.css`, `src/marketplace-footer.tsx`, `tests/browser.mjs`, `tests/web-audit.mjs`; no Gestão: `lib/widgets/store_app_bar.dart`, `lib/screens/home_screen.dart`, `test/storefront_test.dart`, `netlify.toml`. Dependências e lockfiles incluem a ferramenta axe.

Rollback: reverter os commits desta revisão nos respectivos repositórios e publicar novamente. Não depende de restauração de banco.

## Limites e acompanhamento

- Login com consentimento real do Google requer conta interativa; o teste automatizado valida o protocolo e o código compilado com autenticação simulada.
- A suíte não prova ausência de todos os vazamentos possíveis. Ela comprova os cenários de dois tenants existentes nos testes; novas tabelas/RPCs precisam manter RLS e testes próprios.
- A auditoria automática não substitui uso manual com TalkBack/VoiceOver. O Flutter ainda apresenta avisos de regiões/landmarks na árvore semântica; não foram escondidos para melhorar o resultado.
- Impressora USB/Bluetooth, queda física de internet e fechamento de uma venda real precisam de homologação no caixa. Não foram acionados pela revisão pública web.
- Revalidar o cabeçalho novo não apaga retroativamente caches antigos do navegador. O novo build atualiza o worker do Gestão; os catálogos no domínio raiz continuam sem registrar worker sobre a NoriEco inteira.
- Conferir endereços, horários e imagens cadastrados por cada empresa: conteúdo cadastral incompleto não é preenchido com dados de outra loja.
