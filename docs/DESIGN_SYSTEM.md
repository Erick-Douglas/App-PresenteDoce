# Design System da Presente Doce

A loja e o painel usam o mesmo tema. A edição dos valores centrais afeta os componentes que usam essas cores e os papéis tipográficos.

## Onde editar

| Arquivo | O que controla |
| --- | --- |
| [Tokens e fontes](../src/design-system/tokens.css) | Paleta, fontes, pesos, escala de texto, largura, espaçamento e transparência da busca |
| [Papéis tipográficos](../src/design-system/typography.css) | Aparência de saudação, título de página, título de seção, nome de item, rótulo e preço |
| [Componentes compartilhados](../src/design-system/components.css) | Cabeçalho, busca, filtros em pílula, grade, cartões, campos e botões |
| [Estilos globais](../src/index.css) | Regras básicas do documento |
| [Fontes locais e licenças](../public/fonts) | Lato 400 e 700, Great Vibes 400 e suas licenças |

Edite os valores `--pd-*` em `tokens.css`. As classes Tailwind de cor e peso referenciam esses valores. Use os papéis de tipografia quando criar componentes. Os controles de formulário usam 16 px no tema da Presente Doce.

## Identidade

| Papel | Presente Doce | Aplicação |
| --- | --- | --- |
| Marca | Bordô Absoluto `#800000` | Marca, títulos, ações primárias e contornos de foco |
| Creme | Cream Dream `#FFF6DB` | Texto sobre o bordô e detalhes de marca |
| Acento | Ouro Vivo `#FBCE00` | Realces e detalhes nos atalhos |
| Superfícies | Neutro claro e branco | Fundo da vitrine e do painel, cartões e formulários |
| Texto | Lato 400 e 700 | Vitrine, categorias, formulários, painel e checkout |
| Saudação | Great Vibes 400 | Saudação da home |

| Classe | Uso |
| --- | --- |
| `type-display` | Saudação em Great Vibes |
| `type-page` | Título principal de uma tela |
| `type-module` | Título compacto de módulos da vitrine e da gestão |
| `type-section` | Títulos de categorias, seções e diálogos |
| `type-item` | Títulos de itens e subseções de formulário |
| `type-label` | Nome curto de produto ou ação em destaque |
| `type-price` | Preços compactos com algarismos tabulares |

## Vitrine e merchandising digital

A home usa o logotipo principal, com assinatura em creme claro e presente dourado, e ícones brancos. A marca tem uma linha própria acima da saudação. O fundo bordô termina pouco antes de **Categorias**, com uma margem interna abaixo da busca translúcida.

- **Ordem comercial das categorias.** Merchandising digital é a prática de decidir o que recebe visibilidade na vitrine. Na Presente Doce, Gabriela ordena manualmente os três primeiros lugares em **Editar categoria → Ordem das categorias**. Primeiro as categorias com maior volume de vendas, depois as com maior margem de contribuição, depois as novidades. Use as próximas posições para as demais categorias. A aplicação respeita essa ordem e seleciona a primeira na abertura. Uma categoria selecionada exibe diretamente os produtos. **Todos** fica no fim da lista e exibe os produtos agrupados com títulos. A busca inicial pesquisa o catálogo todo, até que a pessoa escolha uma categoria. [Gestão de categorias da Shopify](https://www.shopify.com/enterprise/blog/category-management)
- **Cartões de produto.** Foto livre de ícones, nome, início da descrição em até duas linhas e preço em negrito com o euro antes do valor. O preço mínimo de uma opção usa **A partir de**. As ações de adicionar, configurar e editar ficam abaixo da foto. O ícone compacto tem área de toque de 44 px. Os favoritos são geridos nos detalhes. [Pesquisa de listagens da Baymard](https://baymard.com/research-articles/product-listing-information)
- **Mapa do catálogo.** **Menu → Todas as categorias** mantém a grade pública de duas colunas no celular. A administração vê quatro contagens acima da grade, total de categorias, categorias com publicados, categorias só com rascunhos e categorias sem produtos. Os grupos são calculados pelos produtos associados. O indicador de exclusões e a evolução para gráficos dependem de um histórico de eventos no catálogo. [Painéis no Carbon Design System](https://www.carbondesignsystem.com/building-blocks/data-visualization/dashboards)

## Gestão e atendimento

- **Formulários da gestão.** Separe responsabilidades em painéis translúcidos leves com `ui-glass-panel`. Reserve o botão preenchido para a confirmação principal e use `ui-quiet-action` ou `ui-icon-action` para ações auxiliares. Em categoria, separe nome e tópicos, permita confirmar ou cancelar na própria linha e preserve as abas de ordenação. No catálogo, abra **Nova categoria** junto ao botão e mantenha o cabeçalho com menu hambúrguer. Em produto, separe dados, tópicos, opções e publicação. Em precificação, separe receita, custos e resultado. Em Textos da loja, separe a home de **Sobre nós**.
- **Páginas administrativas.** Gerir catálogo, Novo produto, Editar produto, Editar categoria, Precificação e Textos da loja usam páginas próprias protegidas pela sessão do app. O cabeçalho, a hierarquia dos títulos, os painéis, a largura e as ações dos formulários são compartilhados. A ação principal usa bordô preenchido. Cancelar e ações de apoio usam texto ou contorno leve. O fluxo de login usa diálogo.
- **Contactos.** O item fica após **Sobre nós** e abre a página com WhatsApp, telefone, e-mail, Instagram e Facebook. Acrescente TikTok quando o endereço oficial for confirmado. O assistente é exclusivo da vitrine pública. **Precisa de ajuda?** aparece uma vez por sessão da aba e recolhe para o retrato após toque, clique, teclado ou rolagem. O retrato abre o compositor sem bloquear a página. O link preenche a conversa no WhatsApp e o cliente confirma o envio por lá. [Clique para conversa do WhatsApp](https://faq.whatsapp.com/5913398998672934)
- **Atendimento dentro da loja.** Para envio sem sair da vitrine, o próximo passo é um chat web com backend, caixa de atendimento e notificação à equipe. A integração com a plataforma da Meta usa um número empresarial remetente e credenciais do servidor. Antes de ativar o canal, valide destinatário, consentimento, retenção e limites antispam. [WhatsApp Business Platform](https://developers.facebook.com/documentation/business-messaging/whatsapp/overview)

## Validar uma alteração

1. Abra a home, uma categoria, os detalhes de um produto, o carrinho, o menu e a gestão no preview.
2. Confira as fontes carregadas, a hierarquia dos títulos, o contraste e a quebra de títulos longos em tela estreita.
3. Confira contraste da busca, rolagem dos filtros e leitura dos cartões em tela estreita.
4. Execute os checks e publique pela `main` após validar o preview. [Publicação e reversão](DEPLOY.md)

## Evolução por loja

O tema padrão usa propriedades CSS que podem ser sobrescritas no contêiner da loja. A Presente Doce mantém o tema no repositório. No painel, **Textos da loja** edita a saudação pública, a descrição da home, o nome na saudação administrativa e o texto de **Sobre nós**. A configuração visual por conta, o isolamento entre lojas e o plano Pro pertencem às etapas seguintes. [PRD](PRD.md#plataforma-por-assinatura-para-outros-negócios)

Referências. [Kopi Kap no Figma](https://www.figma.com/design/kwaIAoWW1V3sIdVNXqGlLl/?node-id=17-4341) · [Listagens móveis da Baymard](https://baymard.com/mcommerce-usability/benchmark/mobile-page-types/product-list) · [Ação Ver todas na navegação móvel](https://baymard.com/research-articles/mobile-main-nav-view-all)
