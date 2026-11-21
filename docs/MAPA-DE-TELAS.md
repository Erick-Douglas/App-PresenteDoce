# Mapa de telas e estados — Base para o Figma

**21/11/2026 · Base funcional e79ff700 · Estado: inventário para levantamento, não design aprovado.**  
[PRD](PRD.md) · [Briefing](BRIEFING-FIGMA.md) · [Modelo SRS](SRS.md)

Os IDs TEL/INT/CTX são referências de documentação; não mudam o roteamento do app. O próximo agente deve conservar esses IDs nos frames e preencher os links Figma. **Figma de trabalho: ainda não criado.**

## 1. Vistas existentes

O código usa vistas React e navegação por hash. Nem toda vista é uma URL independente recarregável. A ficha depende do produto selecionado em memória; recarregar um hash isolado não garante reabertura. O levantamento deve registrar essa diferença; melhorias de deep link pertencem à futura SRS.

| ID     | Vista atual     | Público/acesso              | O que desenhar e conferir                                                                                                         | Fonte                                     |
| ------ | --------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| TEL-01 | welcome         | Auxiliar pública            | Abertura/boas-vindas; confirmar uso no fluxo final                                                                                | src/pages/WelcomeScreen.tsx               |
| TEL-02 | home            | Visitante e gestão          | Avatar, marca, menu, saudação, busca, categorias, cards, +, sacola, edição e prévia                                               | src/pages/HomeScreen.tsx                  |
| TEL-03 | product-list    | Pública                     | Lista de produtos por categoria/busca e filtros; retorno/contexto                                                                 | src/pages/ProductListScreen.tsx           |
| TEL-04 | product-details | Pública e edição autorizada | Simples/bolo/caixa/grupos, foto, favorito, observações, quantidade, adicionar/atualizar/adicionar outro                           | src/pages/ProductDetailScreen.tsx         |
| TEL-05 | cart            | Pública                     | Itens, duas configurações do mesmo bolo, editar/apagar, subtotal, dados, entrega/recolha, data/hora, pagamento, resumo e WhatsApp | src/pages/CartScreen.tsx                  |
| TEL-06 | saved           | Pública                     | Favoritos com produtos, vazio, remover e abrir ficha                                                                              | src/pages/SavedScreen.tsx                 |
| TEL-07 | categories-list | Pública e gestão            | Grupos de produtos e títulos; visão geral de categorias e edição autorizada                                                       | src/pages/CategoriesScreen.tsx            |
| TEL-08 | settings        | Pública; rótulo Sobre nós   | Conteúdo institucional, cabeçalho e retorno/menu                                                                                  | src/pages/SettingsScreen.tsx              |
| TEL-09 | contact         | Pública                     | WhatsApp/telefone, e-mail, redes com URL validada; sem assistente flutuante                                                       | src/pages/SettingsScreen.tsx              |
| TEL-10 | catalog-admin   | Gestão                      | Lista agrupada, filtros publicados/rascunhos, busca, nova categoria próxima à ação, criar/editar/ordenar/excluir                  | src/pages/CatalogManagement.tsx           |
| TEL-11 | product-editor  | Gestão                      | Novo e editar; dados, preço, imagem, categoria, grupos herdados/próprios, rascunho/publicação, excluir                            | src/pages/AdminScreen.tsx                 |
| TEL-12 | category-editor | Gestão                      | Dados/grupos, ordem dos produtos, ordem das categorias, capa, transferência/exclusão                                              | src/pages/CategoryEditor.tsx              |
| TEL-13 | pricing         | Gestão                      | Nova ficha/ficha guardada/produto/opção, rendimento, custos, ingredientes/sub-receitas, resultado, guardar e aplicar preço        | src/pages/PricingScreen.tsx               |
| TEL-14 | store-texts     | Gestão                      | Saudação, descrição, nome administrativo, Sobre nós, gravação/versão                                                              | src/pages/StorePresentationEditor.tsx     |
| TEL-15 | dashboard       | Gestão; Visão geral         | Indicadores e entregas, acessos, período e estados sem dados                                                                      | src/pages/OperationsScreen.tsx            |
| TEL-16 | orders          | Gestão; Encomendas          | Lista/filtro, detalhe, nova encomenda/orçamento, itens/grupos, data/hora, cliente, status/taxa                                    | src/pages/modules/OrdersModule.tsx        |
| TEL-17 | agenda          | Gestão; Agenda e produção   | Calendário, dia/período, bloqueio/capacidade, produção consolidada, ingredientes/compras                                          | src/pages/modules/OrdersModule.tsx        |
| TEL-18 | finance         | Gestão; Financeiro          | Indicadores, sinal/saldo, novo/editar/excluir movimento, encomendas elegíveis, histórico e resultado                              | src/pages/modules/FinanceModule.tsx       |
| TEL-19 | customers       | Gestão; Clientes            | Buscar, lista, novo/editar, nascimento opcional, histórico, notas, arquivar e unir contatos                                       | src/pages/modules/RecordsModule.tsx       |
| TEL-20 | inventory       | Gestão; Pronta entrega      | Existente em standby; registrar desativado, não promover no fluxo atual                                                           | src/pages/modules/RecordsModule.tsx       |
| TEL-21 | ingredients     | Gestão; Ingredientes        | Lista, novo/editar, embalagem, unidade, preço, saldo e vínculos                                                                   | src/pages/modules/RecordsModule.tsx       |
| TEL-22 | store-settings  | Gestão; Configurações       | Marca/moeda/fuso, contatos, entrega, prazo/capacidade, sinal, massas/recheios e galeria                                           | src/pages/modules/StoreSettingsModule.tsx |

A camada comum é App.tsx, AdminPage, Header, Sidebar e ManagementNav. Um cliente futuro autenticado não deve herdar a interface da operadora.

## 2. Elementos transversais e variantes

| ID     | Componente/fluxo               | Variantes obrigatórias no levantamento                                                                                    |
| ------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| INT-01 | Menu/Sidebar                   | Visitante compacto à direita; administrador ocupa viewport; grupos, ativo, fechar/Esc e retorno de foco                   |
| INT-02 | Entrar                         | E-mail/senha, mostrar senha, lembrar, gravando, inválido, limite/429 e sessão expirada                                    |
| INT-03 | Recuperação                    | Pedir e-mail, envio informado, link válido/expirado/usado, nova senha/confirmar e retorno ao login; não copiar token real |
| INT-04 | Perfil e aparência             | Visitante escolhe tema; conta com nome/foto, upload/troca/remover, erro/repetir, claro/escuro/sistema                     |
| INT-05 | Card do produto                | Simples/personalizado, inicial, +1, já na sacola, gestão com lápis; estado/quantidade interna sem tags de pronta entrega  |
| INT-06 | Grupos de compra               | Obrigatório/opcional, uma/múltiplas escolhas, grátis/pago, limite e erro; categoria vs definição do produto               |
| INT-07 | Sacola e barra da ficha        | Vazia/itens, quantidade/total, adicionado/atualizado, coexistência com navegação de gestão e teclado                      |
| INT-08 | Seletor, confirmações e avisos | Lista ancorada, teclado, vazio, seleção; cancelar/excluir/guardar; sucesso/erro/conflito de versão                        |
| INT-09 | Imagem                         | Sem foto, existente, escolher, cancelar, rejeitar tamanho/tipo, processando, falha de upload/repetir, troca/remoção       |
| INT-10 | Instalar/partilhar             | Prompt nativo disponível, instruções do navegador, já instalado, menu admin sem instalar, partilha/copiar/cancelar        |
| INT-11 | Formulários de módulo          | Novo/editar, preencher, inválido, ocupado, erro preservando campos, sucesso, alteração concorrente e voltar/cancelar      |

## 3. Estados de contexto fora da lista de vistas

| ID     | Contexto                   | Estado e tratamento a representar                                                                                               |
| ------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| CTX-01 | Loja/carregamento          | A carregar configuração/catálogo, falha e tentar novamente                                                                      |
| CTX-02 | Loja inválida/indisponível | Slug inexistente, loja que não recebe pedidos; não mostrar dados de outra loja                                                  |
| CTX-03 | Gestão                     | Não autenticado, sessão expirada, sem associação e escrita restringida pelo direito de uso                                      |
| CTX-04 | Checkout                   | Sem itens; morada incompleta; data com menos de 48h, bloqueada/lotada; falha de API; janela externa não abriu; repetição segura |

## 4. Entradas externas

| Entrada                                    | Comportamento existente / cuidado                                             |
| ------------------------------------------ | ----------------------------------------------------------------------------- |
| /                                          | Loja piloto                                                                   |
| /#vista                                    | Navegação interna; regras de memória/retorno em App.tsx                       |
| /#product-editor/id e /#category-editor/id | Edição protegida; validar recurso e associação                                |
| /admin                                     | Atalho do login/recuperação do app; não é login obrigatório na Vercel         |
| /precificacao                              | Entrada autenticada para precificação                                         |
| /lojas/slug                                | Contexto de loja isolado; não é liberação comercial de terceiros              |
| /criar-loja                                | Fluxo preparado com gate comercial fechado; desenhar na página Futuro/standby |

## 5. Conteúdo futuro separado

Criar uma área Futuro/standby no Figma para pronta entrega, cadastro/perfil de clientes, moradas/histórico de cliente, onboarding de loja e assinatura Stripe. Ainda precisam de requisitos e aceite; não são telas ativas a implementar por este briefing. Pagamento da encomenda e mensalidade do lojista são fluxos separados.

## 6. Matriz de cobertura a preencher pelo próximo agente

Uma linha por TEL/INT/CTX e por variante aplicável:

| ID     | Perfil    | Estado                     | Mobile/tablet/desktop | Claro/escuro | Frame com node-id | Requisito SRS       | Situação     | Validador/data |
| ------ | --------- | -------------------------- | --------------------- | ------------ | ----------------- | ------------------- | ------------ | -------------- |
| TEL-04 | Visitante | Duas configurações de bolo | A preencher           | A preencher  | A criar           | A definir por Erick | Levantamento | Pendente       |

Marcar N/A com motivo quando um estado não se aplicar. Evitar multiplicar frames idênticos: componentes/variantes podem cobrir estados compartilhados, desde que a matriz aponte para eles. Este mapa cobre as 22 vistas declaradas no tipo View; contagem de frames depende dos estados e responsividade, não só da quantidade de páginas.
