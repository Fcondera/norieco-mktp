# NoriEco: acesso único e teste do PDV

## Entrada e criação da loja

Vendedores vão diretamente a `gestao.norieco.com.br/inicio`. O Google é solicitado
uma vez. O cadastro pede nome, loja, slug, tipo, contato, cidade e aceite dos termos.
Bairro/endereço físico e documentos podem ser completados depois. Quem já possui
empresa ativa abre o painel existente, sem repetir cadastro ou iniciar outro teste.

`norieco-start-trial` verifica o usuário no Auth e chama um provisionador exclusivo
do service role. O browser não escolhe IDs, roles, aprovação ou datas. O servidor
cria um tenant vazio, o administrador da própria empresa, a página sem selo e um
teste de exatamente 15 dias. Não copia produtos, estoque, contatos ou configurações
do Renato. O endereço público é `norieco.com.br/slug`; o perfil pode ser publicado
sem documentação, mas o recebimento de pedidos depende do atendimento no PDV.
Não é necessário DNS ou outro deploy para cada caminho. Rotas da plataforma são
reservadas. Domínios próprios e `/marketplace/loja/slug` continuam funcionando.

## Quem já entrou no marketplace

O botão abre `/auth/bridge?state=nonce`. O browser confere origem, janela e nonce;
somente o JWT temporário e o ID esperado são enviados por postMessage à origem
exata do Gestão. Não há JWT, refresh token ou senha na URL. O estado é capturado
antes de Auth/Flutter consumirem a URL inicial. O source da mensagem é comparado
como referência nativa: wrappers Window do Dart não têm igualdade entre chamadas.

`norieco-panel-session` valida a conta confirmada e limita pedidos por usuário.
Gera e consome uma prova de uso único dentro do Auth, sem enviar e-mail. A identidade
resultante deve corresponder à original. O painel recebe uma sessão independente;
a renovação não disputa o refresh token do marketplace. As permissões continuam
vindo de profiles/tenant no banco. Abas bloqueadas recebem orientação para permitir
a abertura. Referências: [generateLink](https://supabase.com/docs/reference/javascript/auth-admin-generatelink)
e [verifyOtp](https://supabase.com/docs/reference/javascript/auth-verifyotp).

## Prazo, continuidade e documentos

`pdv_trials` guarda criador, início, fim e TRIAL/ACTIVE/PAUSED. Uma conta tem no
máximo um teste; repetir o cadastro não reinicia o prazo. Não há cobrança automática.
Ao vencer, o acesso operacional é interrompido até decisão da NoriEco, preservando
os dados. Em Clientes do sistema → Testes grátis e continuidade, somente a
administração geral pode liberar, prorrogar 15 dias ou pausar. Há auditoria.

O backend verifica o prazo em current_tenant_id/current_app_role e em triggers
operacionais, inclusive pedidos públicos e RPCs SECURITY DEFINER. Páginas vencidas
aparecem fechadas. Empresas sem registro de teste mantêm o acesso anterior. A fila
offline é preservada; a sincronização depende da autorização atual do servidor.

Página e documentos abre `/pagina`, preservando o portal antigo. pdv_save_documents
exige vínculo empresarial e arquivos próprios no bucket privado. Enviar documentos
não remove a publicação, concede selo ou estende o teste; o selo depende da análise.

## Implantação e testes

Aplicar as migrações 202610220001, 202610220002 e 202610220003, nessa ordem. Publicar
somente as funções norieco-start-trial e norieco-panel-session: elas validam JWT no
próprio código. Service role fica apenas no servidor. Não sobrescrever o Auth remoto
com o config.toml de desenvolvimento; Google, cadastro e callback /inicio já estão
habilitados. A LP/marketplace ficam em norieco-mktp; o Gestão fica em vendapeixe.

Validar Flutter onboarding/portal/sessão/offline e, no norieco-mktp, npm test,
test:database, test:browser e test:bridge. O último serve o Flutter compilado e simula
Auth/Edge para conferir a sessão independente sem segunda tela de login. Consentimento
Google real exige conta interativa. Testes não criam dados de demonstração na produção.
