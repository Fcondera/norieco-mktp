# Venda do PDV completo

O card abaixo do ecossistema abre `/equipamentos/pdv-completo`.
O botão **Comprar kit** abre `/equipamentos/pdv-completo/checkout`.
Produto: computador Intel E7400 (Dual Core), 4 GB de RAM, SSD 120 GB, monitor
de 15 polegadas, teclado e mouse USB e impressora. Valor dos equipamentos:
R$ 1.650,00. Garantia do fornecedor: 3 meses. Peso bruto informado: 8,1 kg
do kit do fornecedor + 800 g da impressora = 8,9 kg no total. Conex?es:
USB, ?udio, rede e v?deo. Bivolt. N?o foram presumidos marca/modelo dos
perif?ricos, vers?o do sistema operacional ou estoque.

O topo da p?gina usa galeria com miniaturas laterais, descri??o no centro e
coluna de compra ? direita. O carrinho armazena apenas o identificador de um
kit em sessionStorage; n?o reserva estoque ou confirma pagamento.

## Fotos

As cinco imagens de `C:\Users\maric\Downloads\pdvnorico` já foram copiadas
sem edição para a pasta pública e configuradas na galeria. A primeira foto
também aparece no card da página principal. O arquivo `traseira.cpu.webp`
mostra as conexões do monitor e foi identificado dessa forma na galeria.
Não há foto da impressora nessa pasta.

Adicione as fotos reais em `public/equipamentos/fotos/` e liste-as em
`public/equipamentos/pdv-completo.json`. Há um exemplo em
`public/equipamentos/fotos/README.md`. Sem fotos, são exibidos espaços identificados.

## Fluxo atual de compra

O cliente informa os dados, consulta o CEP, revisa equipamentos, entrega e taxas
e autoriza o contato. O botão final abre o WhatsApp oficial com o resumo da
solicitação para o cliente enviar. Não há cobrança automática, cartão, Pix
gerado, reserva de estoque nem confirmação fictícia de pagamento.
Os dados pessoais ficam somente em memória no navegador e não são gravados em
localStorage, logs ou banco pela página. O texto só vai ao WhatsApp após o clique.
O envio real e o pagamento são confirmados pela equipe.

## Frete automático

Uma função Netlify consulta o CEP pelo ViaCEP e pode cotar fretes no Melhor Envio.
Ela não precisa de Supabase e não utiliza as credenciais de assinaturas.
Enquanto a configuração estiver incompleta, a consulta localiza o endereço e
orienta que a equipe confirme o frete e o prazo antes do pagamento. Nenhum frete
grátis, taxa ou prazo é inventado.

Configure variáveis **privadas de Functions** na Netlify, sem prefixo VITE_:

- `HARDWARE_SHIPPING_ENABLED=true`
- `HARDWARE_ORIGIN_POSTAL_CODE`: CEP exato de postagem, 8 dígitos. Somente
  “São Paulo” não é suficiente para a transportadora calcular o frete.
- `MELHOR_ENVIO_TOKEN`: credencial da conta de frete.
- `MELHOR_ENVIO_CONTACT`: e-mail de contato para identificar a integração.
- `MELHOR_ENVIO_SANDBOX=true` apenas em deploys de teste com `CONTEXT` igual a
  `deploy-preview` ou `branch-deploy`. Cotações de teste ficam identificadas
  como simulação e são bloqueadas no ambiente de produção.
- `HARDWARE_PACKAGES_JSON`: lista de caixas com `width`, `height`, `length`
  em cm, `weight` em kg e `insurance` em reais. O seguro total deve somar 1650.
  O peso informado do conjunto com impressora é 8,9 kg. As medidas de
  35 × 30 × 17 cm na foto são somente do gabinete; não representam a caixa
  completa de transporte com monitor e impressora.
  Exemplo estrutural: `[{"width":LARGURA,"height":ALTURA,"length":COMPRIMENTO,"weight":PESO,"insurance":1650}]`.
- `HARDWARE_FEES_CONFIRMED=true`: somente após definir todas as taxas extras.
- `HARDWARE_FEES_JSON`: por exemplo `[]` para nenhuma taxa extra, ou
  `[{"label":"Embalagem","amountCents":VALOR_EM_CENTAVOS}]`.

Preços e prazos retornados pela transportadora são apresentados como estimativa,
com o prazo contado após a postagem. Sem taxas e frete confirmados, o resumo
identifica R$ 1.650 como **valor do kit**, sem chamá-lo de total final.
As cotações expiram em 15 minutos. Alterar o CEP invalida a cotação anterior.
O endpoint tem limitação de requisições por IP/domínio e não expõe credenciais.
O `custom_price` da transportadora já considera ajustes configurados na conta;
não duplique esses ajustes em `HARDWARE_FEES_JSON`.

Fontes: [ViaCEP](https://viacep.com.br/),
[cotação Melhor Envio](https://docs.melhorenvio.com.br/reference/calculo-de-fretes-por-produtos),
[Netlify Functions](https://docs.netlify.com/build/functions/api/).

Para habilitar pagamento automático depois, ainda é necessário definir com o
responsável o meio de pagamento e homologar a compra de equipamento separadamente
da assinatura do Nori Gestão.
