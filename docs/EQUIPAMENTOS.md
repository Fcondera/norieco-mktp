# Venda do PDV completo

O card abaixo do ecossistema abre `/equipamentos/pdv-completo`.
O botão **Comprar kit** abre `/equipamentos/pdv-completo/checkout`.
Produto: computador Intel Core i3, 4 GB de RAM, monitor, teclado, mouse e
impressora. Valor dos equipamentos: R$ 1.650,00. Não foram presumidos marca,
geração, armazenamento, tamanho do monitor, modelo da impressora ou estoque.

## Fotos

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
