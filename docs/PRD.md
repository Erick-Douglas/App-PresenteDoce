# PRD — Presente Doce

**Versão 0.3 · 12/11/2026**

## Produto

A Presente Doce é uma **loja online de encomendas de confeitaria artesanal**. A arquitetura é de **loja de vendedor único** com catálogo, carrinho e encaminhamento para o WhatsApp. O app é o destino principal do link da bio. O cliente escolhe produtos e envia o pedido. Gabriela confirma disponibilidade, entrega e pagamento no atendimento.

**Link oficial da bio:** [presente-doce.vercel.app](https://presente-doce.vercel.app/)  
**Texto sugerido:** Confeitaria artesanal por encomenda. Consulte o catálogo e faça o pedido pelo WhatsApp.

## Objetivo e público

Diminuir o retrabalho de atendimento e dar autonomia à Gabriela para manter o catálogo pelo celular. A loja atende encomendas de pessoas e pequenos eventos. Nesta entrega, a prioridade é editar produtos e publicar o catálogo no endereço oficial.

| Frente | Requisitos desta entrega | Aceite |
| --- | --- | --- |
| Loja | Abrir o catálogo Supabase no domínio oficial. | Alterações de um produto publicado aparecem ao recarregar a loja. Rascunhos e produtos retirados ficam fora da consulta pública. |
| Checkout | Manter recolha, entrega e preferência de pagamento. Resumir itens, personalizações, contacto e subtotal. Informar quando entrega e total dependem de confirmação. Abrir o WhatsApp sem apagar o pedido e oferecer cópia da mensagem. | Pedidos de recolha e entrega são preparados sem conta. Voltar do WhatsApp permite retomar o carrinho. O app informa que o pedido só é confirmado no atendimento. |
| Gestão na loja | Mostrar **Entrar** na navegação pública. Na sessão administrativa, oferecer gestão de produtos e rascunhos pelo menu e edição direta nos cartões e detalhes. Permitir criação, publicação, retirada temporária e exclusão com confirmação. | Gabriela permanece na loja após entrar. A vitrine reflete a gravação na sessão atual. Visitantes veem o catálogo público e a entrada. O Supabase exige autorização para escrita e a versão atual para edição e exclusão. |
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

## Referências

[Pesquisa de produto e segurança](pesquisa.md) · [Configuração e operação](../README.md) · [Deploy e reversão](DEPLOY.md)
