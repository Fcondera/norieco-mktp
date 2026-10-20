# Lojas do PDV no marketplace

A publicação comercial e a análise documental são decisões distintas. O campo
legado `verification_status = VERIFIED` autoriza a listagem; o novo campo público
`document_verified` só concede o selo quando houve envio, revisão e existem os
dois arquivos privados. A publicação de uma loja do PDV não fabrica uma revisão.

Na administração do marketplace, uma loja INTEGRATED com tenant vinculado possui
um seletor de categoria e o botão **Publicar loja do PDV sem selo documental**.
Somente administradores da plataforma podem executar essa ação. Administradores
das lojas, visitantes e consumidores não podem publicar empresas. Empresas
suspensas/reprovadas ou tenants inativos precisam de revisão antes da publicação.
Cada ação fica registrada em `marketplace_audit`, incluindo o estado anterior.

Produtos, preços, disponibilidade e pedidos continuam vinculados ao mesmo
`tenant_id` do PDV. A publicação não copia produtos nem ativa recebimento de
pedidos, entrega ou horários. Configure o atendimento no PDV para receber pedidos.

## Publicação inicial autorizada

1. Aplicar a migração `202610200001_pdv_marketplace_publication.sql`.
2. Publicar o frontend novo, que condiciona o selo a `document_verified === true`.
3. Executar uma vez `supabase/publicar_lojas_pdv_existentes.sql`: Renato Pescados
   em Peixarias e Asvluth em Restaurantes. A Condera permanece como rascunho em
   Conveniências, pois o responsável informou que essa loja não existe.

O script verifica os IDs e slugs das duas empresas numa transação e cancela se
alguma não corresponder. Não exclui registros. Para retirar uma publicação, use a
ação de suspensão na administração; não remova o tenant nem os produtos.

Verificação: testes de banco cobrem autorização, selo documental positivo e
negativo, suspensão, auditoria e fluxo de pedido/cozinha em dois tenants. Testes
de navegador verificam ausência do selo indevido em cards e perfis no desktop e
em telas de 390/320 px.
