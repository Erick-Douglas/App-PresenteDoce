# Próxima etapa: assinaturas e automação

> **Leitura em 21/11/2026.** Referência técnica da base existente. O [PRD](PRD.md) consolida o escopo atual; o novo design e comportamento serão definidos no [Figma](BRIEFING-FIGMA.md) e na [ERS/SRS](SRS.md), com aprovação. Procedimentos históricos abaixo não são instrução para reaplicar migrações ou ativar integrações. [Índice](README.md).

Decisão de Erick em 20/11/2026: Stripe para Portugal/Europa. Conta, produtos/preços e cobrança ficam para a próxima etapa. Não existe provedor WhatsApp Business API ou n8n conectado.

## Stripe

| Dependência | Estado |
| --- | --- |
| Conta Stripe e modo de teste | A criar pelo responsável da plataforma |
| Preços mensais/anuais e políticas comerciais | A definir por Erick |
| stores/store_entitlements e bloqueio de escrita por plano | Implementados no banco |
| Campos externos únicos de customer/subscription | Preparados, sem preenchimento fictício |
| Checkout de assinatura, portal e webhook Stripe | Próxima etapa, sem rota ativa nem cobrança |
| Cadastro em três passos | Implementado e desativado por padrão |

O fluxo futuro cria Checkout no servidor, a partir de price_id permitido e owner autenticado. Não aceita preço, store_id de terceiros ou customer_id fornecido pelo browser como autorização. O vínculo externo da loja é registrado pelo servidor.

O webhook precisa do corpo original, Stripe-Signature e verificação pelo SDK oficial (constructEventAsync em Deno). Evento externo único para deduplicação, atualização sob lock por assinatura e reconciliação com o estado atual da Stripe para eventos fora de ordem. O redirecionamento de sucesso não ativa plano. Testar duplicata, retry, atraso, inadimplência e cancelamento em modo de teste antes de produção.

Credenciais futuras somente no runtime gerenciado: STRIPE_SECRET_KEY e STRIPE_WEBHOOK_SECRET. Price IDs permitidos e origem canônica são configuração do servidor. Nunca inserir valores secretos neste documento, Git, VITE_* ou logs. A assinatura do lojista não é pagamento de encomenda.

[Webhooks oficiais](https://docs.stripe.com/webhooks) · [Ciclo da assinatura](https://docs.stripe.com/billing/subscriptions/webhooks) · [Exemplo Supabase/Deno](https://supabase.com/docs/guides/functions/examples/stripe-webhooks).

## Contratos de gestão e automação

POST /functions/v1/store-api, envelope {store_id, action, payload}. Versão inicial 1, com schemas Zod e lista fechada de ações:

| Ação | Uso |
| --- | --- |
| checkout | Pedido público validado, quota por IP/loja, mensagem WhatsApp |
| product.save | Produto com versão esperada |
| order.create / order.status / order.delivery_fee | Encomenda, orçamento, transição e taxa combinada |
| stock.adjust | Delta, opção, motivo e idempotency_key |
| finance.record | Recibo, estorno ou despesa com idempotency_key |
| customer.save / customer.merge | CRM e duplicados conferidos |
| ingredient.save | Insumos e atualização das fichas vinculadas |
| calendar.save | Capacidade/bloqueio de uma data |
| settings.save | Marca e operação, versão esperada |
| report.daily | Entregas, sinais pendentes e produção de um dia |

Com exceção de checkout, exige Bearer JWT válido, utilizador confirmado pelo Supabase e gestão da loja. Não compartilhar JWT pessoal de Gabriela com um robô. O futuro canal recebe identidade verificada do provedor, resolve associação no servidor e usa credencial própria de escopo mínimo, revogável e auditada.

Para WhatsApp/n8n, definir provedor oficial, remetente, consentimento, templates, destinos de teste e confirmação de ações comerciais antes de ligar o webhook. Relatórios e envios devem ter chave única por loja/dia/canal. Atualizar estoque exige motivo; cancelar pedido/registrar pagamento exige confirmação compatível com o risco. Texto ou áudio do utilizador é dado, não instrução para ampliar permissões.

O atendimento atual continua por link wa.me. Não existe incorporação do WhatsApp pessoal do visitante como chat interno. Nenhuma automação ou envio proativo está ativo.
