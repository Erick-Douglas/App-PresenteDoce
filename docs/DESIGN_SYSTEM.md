# Design System da Presente Doce

A loja e o painel usam o mesmo tema. A edição dos valores centrais afeta os componentes que usam essas cores e os papéis tipográficos.

## Onde editar

| Arquivo | O que controla |
| --- | --- |
| [Tokens e fontes](../src/design-system/tokens.css) | Paleta, fontes, pesos, escala de texto, largura, espaçamento e transparência da busca |
| [Papéis tipográficos](../src/design-system/typography.css) | Aparência de saudação, título de página, título de seção, nome de item, rótulo e preço |
| [Componentes compartilhados](../src/design-system/components.css) | Cabeçalho, busca, filtros em pílula, grade, cartões, campos e botões |
| [Estilos globais](../src/index.css) | Marca e regras básicas do documento |
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
| `type-section` | Títulos de categorias, seções e diálogos |
| `type-item` | Títulos de itens e subseções de formulário |
| `type-label` | Nome curto de produto ou ação em destaque |
| `type-price` | Preços compactos com algarismos tabulares |

Os títulos de categoria usam o mesmo papel na vitrine e na gestão. A home usa topo bordô sólido, busca translúcida com contorno claro, fundo neutro e filtros em pílulas. A home lista os produtos logo abaixo dos filtros. **Ver todas as categorias** leva às seções empilhadas, com grade de duas colunas no celular. O painel usa os mesmos papéis tipográficos e componentes de formulário.

## Validar uma alteração

1. Abra a home, uma categoria, os detalhes de um produto, o carrinho, o menu e a gestão no preview.
2. Confira as fontes carregadas, a hierarquia dos títulos, o contraste e a quebra de títulos longos em tela estreita.
3. Confira contraste da busca, rolagem dos filtros e leitura dos cartões em tela estreita.
4. Execute os checks e publique pela `main` após validar o preview. [Publicação e reversão](DEPLOY.md)

## Evolução por loja

O tema padrão usa propriedades CSS que podem ser sobrescritas no contêiner da loja. A Presente Doce mantém o tema no repositório. No painel, **Textos da loja** edita a saudação pública, a descrição da home, o nome na saudação administrativa e o texto de **Sobre nós**. A configuração visual por conta, o isolamento entre lojas e o plano Pro pertencem às etapas seguintes. [PRD](PRD.md#plataforma-por-assinatura-para-outros-negócios)

Referências. [Kopi Kap no Figma](https://www.figma.com/design/kwaIAoWW1V3sIdVNXqGlLl/?node-id=17-4341) · [Listagens móveis da Baymard](https://baymard.com/mcommerce-usability/benchmark/mobile-page-types/product-list) · [Ação Ver todas na navegação móvel](https://baymard.com/research-articles/mobile-main-nav-view-all)
