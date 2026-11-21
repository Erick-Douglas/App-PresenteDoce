# Referências — Micro-SaaS de confeitaria

**Pesquisa de 20/11/2026.** Fontes públicas, sem criar contas, ativar planos ou testar áreas autenticadas. Descrições de fornecedores não comprovam desempenho, segurança ou qualidade de uso. As decisões da última coluna são propostas para o nosso produto.

| Referência | Evidência pública consultada | Aplicação proposta |
| --- | --- | --- |
| [Gestly no Google Play](https://play.google.com/store/apps/details?id=com.gestly.erp&hl=pt_PT) | A descrição apresenta receitas, precificação, orçamentos por WhatsApp, clientes, ingredientes e indicadores. | Aproximar custo, preço aprovado e orçamento; rótulos curtos e informação de estado. Capturas estavam ligadas na página, mas a ferramenta não conseguiu carregá-las: não foi feita auditoria visual dos ecrãs do app. |
| [Gestly — site oficial](https://www.gestly.com.br/) | Apresenta catálogo, pedidos, estoque, agenda e finanças na mesma oferta; mostra exemplos de telas. | Usar entidades partilhadas entre módulos, evitando recadastro de pedido/cliente. Não adotar alegações de lucro garantido como requisito ou promessa nossa. |
| [Bake That Batter](https://www.bakethatbatter.com/pt-PT) | A página anuncia pedidos, clientes, receitas, formulários, agenda e relatórios. A seção comercial ainda mostra lista de espera e planos Em breve. | Referência de organização funcional, não comprovação de que todas as integrações anunciadas estão disponíveis. Organizar a operação em módulos que partem do pedido. |
| [Bakesy](https://www.bakesy.app/) e [guia](https://www.bakesy.app/helpguide) | Vitrine própria, etapas de encomenda, datas bloqueadas e temas. O guia descreve limites de pedidos por dia e antecedência. | Regras visíveis antes de pedir; calendário simples e capacidade verificável. O nosso modelo de reserva concorrente é uma decisão de arquitetura própria. |
| [BakeGenie](https://www.bakegenie.co/) | Anuncia gestão de pedidos, calendário, custos de receitas e registro de depósitos/pagamentos. | Dar visibilidade separada a sinal, saldo, produção e custo, sem apresentar o estado de pagamento como estado de produção. |
| [Doocake no Google Play](https://play.google.com/store/apps/details?id=br.com.doocake.app) | A ficha apresenta agenda, catálogo compartilhável, pedidos, financeiro e calculadora de custos. | Referência de pedido estruturado para confirmação e continuidade entre atendimento e gestão. O domínio do app foi identificado pela ficha; não assumir que doocake.com é o site correto. |
| Confeitaria Pro | A pesquisa encontrou produtos diferentes usando esse nome, inclusive confeitariapro.com.br e confeitariabr.pro. | Referência informada por Erick para fichas e compras. Não atribuir funcionalidades específicas a um fornecedor sem confirmar o link correto. Isso não impede especificar nossos requisitos. |

## Síntese para o design

Clean White & Warm Craft é a direção fornecida por Erick, não uma conclusão de teste comparativo. Branco e neutros quentes devem reduzir a competição com as fotos; bordô/dourado identificam a Presente Doce. A legibilidade, o espaço e a hierarquia serão avaliados com protótipo e uso real.

A estrutura proposta reaproveita o que a loja já possui: categoria/tópico, produto, ficha e controles contextuais. A evolução inclui estado Pronta entrega/Encomenda, estoque, resumo de pedido e navegação lateral. Live Mode com prévia de cliente é a hipótese de diferenciação do nosso produto; não se afirma exclusividade ou ausência desse padrão em concorrentes.

Não copiar marca, textos comerciais, fotografias nem telas completas. Examinar futuramente com Gabriela: tempo para novo orçamento, clareza do sinal/saldo, criação de receita, agendamento e erro de estoque. Não registrar ganhos de conversão sem medir.

## Correções ao briefing de arquitetura

- Stack atual conferida no package.json: React/Vite. Next.js é uma opção de destino a confirmar, não estado atual.
- URL pública inicial proposta: /lojas/[slug]. Subdomínios e domínio próprio precisam de resolução e validação próprias.
- A chave publicável do Supabase pode estar no cliente; chaves secret/service_role ficam no servidor e ignoram RLS. Acesso de usuário continua com JWT e políticas. [Chaves](https://supabase.com/docs/guides/getting-started/api-keys).
- Redirecionar no Proxy não substitui autorização junto do dado e das ações. [Next.js](https://nextjs.org/docs/app/guides/data-security).
- Estoque, capacidade, idempotência e snapshots de preço exigem regras além de adicionar store_id.
- Assinatura mensal da plataforma, recebimento de sinal e pagamento do consumidor são modelos diferentes.

[PRD](PRD.md) · [Arquitetura e segurança](ARQUITETURA.md) · [Roadmap](ROADMAP.md).

## Conferência visual na implementação · 20/11/2026

Duas capturas públicas do Gestly foram abertas e inspecionadas: cabeçalho compacto, filtros/atalhos em pílula, cards claros de métricas, navegação inferior e cálculo com resumo separado dos campos. A implementação usa essa organização como referência e preserva a marca bordô/dourado da Presente Doce. Não reutiliza fotografias, código ou identidade do concorrente. As capturas ficaram apenas no cache local de pesquisa.
