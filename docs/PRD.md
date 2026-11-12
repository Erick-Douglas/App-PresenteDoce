# PRD — Presente Doce

**Versão 0.5 · 12/11/2026**

## Produto

A Presente Doce é uma **loja online de encomendas de confeitaria artesanal**. A arquitetura é de **loja de vendedor único** com catálogo, carrinho e encaminhamento para o WhatsApp. O app é o destino principal do link da bio. O cliente escolhe produtos e envia o pedido. Gabriela confirma disponibilidade, entrega e pagamento no atendimento.

A classificação técnica atual é **web app de encomendas diretas para negócios de alimentação**, na categoria de e-commerce alimentar. A Presente Doce usa checkout assistido via WhatsApp, com recolha ou entrega. A classificação segue o uso de *online ordering* para pedidos pelo canal próprio do negócio. [Square Online Ordering](https://squareup.com/us/en/online-ordering)

**Link oficial da bio:** [presente-doce.vercel.app](https://presente-doce.vercel.app/)  
**Texto sugerido:** Confeitaria artesanal por encomenda. Consulte o catálogo e faça o pedido pelo WhatsApp.

## Objetivo e público

Diminuir o retrabalho de atendimento e dar autonomia à Gabriela para manter o catálogo pelo celular. A loja atende encomendas de pessoas e pequenos eventos. Nesta entrega, a prioridade é editar produtos e publicar o catálogo no endereço oficial.

| Frente | Requisitos desta entrega | Aceite |
| --- | --- | --- |
| Loja | Abrir o catálogo Supabase no domínio oficial. | Alterações de um produto publicado aparecem ao recarregar a loja. Rascunhos e produtos retirados ficam fora da consulta pública. |
| Checkout | Manter recolha, entrega e preferência de pagamento. Resumir itens, personalizações, contacto e subtotal. Informar quando entrega e total dependem de confirmação. Abrir o WhatsApp sem apagar o pedido e oferecer cópia da mensagem. | Pedidos de recolha e entrega são preparados sem conta. Voltar do WhatsApp permite retomar o carrinho. O app informa que o pedido só é confirmado no atendimento. |
| Gestão na loja | Mostrar **Entrar** no menu. Na sessão administrativa, saudar Gabriela na vitrine e oferecer gestão de produtos e rascunhos pelo menu e edição direta nos cartões e detalhes. Permitir criação, publicação, retirada temporária e exclusão com confirmação. | Gabriela vê a saudação ao entrar e a vitrine reflete a gravação na sessão atual. Visitantes veem o catálogo público. O Supabase exige autorização para escrita e a versão atual para edição e exclusão. |
| Atendimento | Dar acesso discreto ao WhatsApp no fim do menu. | O contacto aparece com retrato ilustrativo, nome do canal e link acionado pela pessoa. |
| Backend | Supabase Auth, Postgres e Storage. Catálogo público em leitura e autorização de escrita pelo banco. Preservar os identificadores e a configuração dos produtos na migração. | Usuários anônimos leem apenas produtos publicados. Contas sem autorização de catálogo não gravam. A migração pode ser aplicada e os dados iniciais conferidos em uma base isolada. |
| Entrega técnica | Limpar módulos e dependências órfãos, documentar configuração, rodar lint, testes de regressão e build, e validar a jornada em preview. | A branch de trabalho tem evidência dos checks e instruções para configurar o ambiente. A publicação ocorre depois da validação do checkout e do painel conectado. |

## Limites e sequência

1. Limpar o código legado, manter o fluxo de encomendas, acertar o destino da bio e aplicar controles de segurança.
2. Preparar catálogo e painel, conectar uma base isolada, importar os produtos e validar a operação da Gabriela.
3. O simulador de precificação reproduz as fórmulas de custo, lucro, markup e margem no menu administrativo e pelo atalho `/precificacao`. Usa preenchimento manual e um rascunho local no navegador. A importação de ingredientes e receitas e o armazenamento compartilhado ficam para uma próxima entrega. O campo de preço do catálogo é o valor de venda aprovado por Gabriela.
4. Planejar contas de clientes com e-mail, morada e histórico de pedidos próprio. Abrir cadastro quando o modelo de pedidos e o acesso aos dados de cada cliente estiverem definidos e verificados. Planejar agenda, estoque, pagamentos e faturas conforme o uso.

O app coleta dados de contacto para compor a mensagem. Carrinho e dados pessoais do checkout ficam em memória durante a sessão. A loja não registra pedidos no banco nesta versão.

## Verificação e operação

- Validar carrinho vazio, produto simples e configurável, recolha, entrega, retorno do WhatsApp, cópia de mensagem e teclado em tela estreita.
- Validar RLS e Storage em base de teste com papéis anônimo, autenticado sem autorização e administrador. Testar consulta de rascunho, alteração não autorizada, MIME e tamanho de arquivo, publicação e conflito de atualização.
- Acompanhar pedidos confirmados por semana e tempo gasto por Gabriela com atualizações e correções de pedido. Definir a linha de base junto com ela.
- Conferir preço, opções, disponibilidade e imagens com Gabriela antes do primeiro catálogo publicado via banco. Registrar o commit e o plano de reversão do frontend. Para dados, manter cópia antes de migrar produção.

## Plataforma por assinatura para outros negócios

Erick pretende oferecer a vitrine e o painel por mensalidade a confeitarias, tapiocarias e outros pequenos negócios de alimentação. A Presente Doce serve de piloto. A vitrine e o catálogo compartilham componentes, e o código concentra a configuração inicial de nome, descrição e contacto. A base e as permissões da produção atual atendem uma loja.

A oferta futura é um **SaaS vertical de encomendas diretas para negócios de alimentação**, com marca própria por loja. O modelo vende a assinatura ao lojista, que opera sua vitrine para os clientes. Flipdish é uma referência de mercado para site com marca própria, gestão de menu e pedidos diretos por assinatura. [Flipdish Online Ordering](https://www.flipdish.com/gb/best-online-ordering)

O tema da Presente Doce é editável pelo código. A etapa de personalização no painel pode reutilizar os tokens para cores e tipografia, com valores validados e escopo por loja. [Design System](DESIGN_SYSTEM.md)

| Etapa | Entrega | Verificação |
| --- | --- | --- |
| Piloto com duas lojas | Modelar lojas, membros e papéis. Resolver a loja por identificador público validado no servidor. Permitir configuração de marca, catálogo, categorias, contacto e disponibilidade por loja. Migrar a Presente Doce com cópia de recuperação. | Produtos, rascunhos, imagens e contas da loja A ficam fora das permissões da loja B. Testar leitura e escrita com visitante, operador e proprietário de cada loja. A segunda loja do piloto usa dados fictícios. |
| Operação do lojista | Criar onboarding, convites geridos, gestão de catálogo, preferências de entrega e retirada, além de ativação e desativação de loja. Registrar ações administrativas com loja, ação e horário. | Medir tempo para publicar a primeira vitrine e atualizar um produto. Validar categorias e adicionais num negócio fora da confeitaria. Exigir segundo fator para acessos administrativos antes de abrir a operação a terceiros. |
| Assinatura mensal | Associar plano e assinatura à loja. Usar checkout e portal de cobrança geridos. Conferir a assinatura de webhooks, registrar IDs de evento e aplicar permissões de plano no servidor. Definir estados de teste, ativo, atraso e cancelamento. | Reenvio e chegada fora de ordem de eventos convergem para o estado correto. A política de atraso e cancelamento preserva os dados e é comunicada ao lojista. [Stripe Billing](https://docs.stripe.com/billing/subscriptions/webhooks) |

Cada tabela de dados de negócio e os caminhos de imagens precisam de escopo de loja. O banco deve verificar o vínculo ativo do usuário e a função em cada escrita. Rascunhos e dados pessoais exigem autorização por loja. A cobrança mensal da plataforma é independente do fluxo de encomenda do cliente. [Políticas no Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security)

## Referências

[Pesquisa de produto e segurança](pesquisa.md) · [Configuração e operação](../README.md) · [Deploy e reversão](DEPLOY.md)
