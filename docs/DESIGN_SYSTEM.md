# Design System da Presente Doce

A loja e o painel usam o mesmo tema. A edição dos valores centrais afeta os componentes que usam essas cores e os papéis tipográficos.

## Onde editar

| Arquivo | O que controla |
| --- | --- |
| [Tokens e fontes](../src/design-system/tokens.css) | Paleta, fontes, pesos, escala de texto, estados de leitura e cores e medidas da transição da home |
| [Papéis tipográficos](../src/design-system/typography.css) | Aparência de saudação, título de página, título de seção, nome de item, rótulo e preço |
| [Estilos globais](../src/index.css) | Composição da home, vidro da busca, marca e regras básicas do documento |
| [Fontes locais e licenças](../public/fonts) | Lato 400 e 700, Great Vibes 400 e suas licenças |

Edite os valores `--pd-*` em `tokens.css`. As classes Tailwind de cor e peso referenciam esses valores. Use os papéis de tipografia quando criar componentes. Os controles de formulário usam 16 px no tema da Presente Doce.

## Identidade

| Papel | Presente Doce | Aplicação |
| --- | --- | --- |
| Marca | Bordô Absoluto `#800000` | Marca, títulos, ações primárias e contornos de foco |
| Creme | Cream Dream `#FFF6DB` | Fundo da home, superfície de marca e texto sobre o bordô |
| Acento | Ouro Vivo `#FBCE00` | Realces e detalhes nos atalhos |
| Superfícies | Porcelana e branco | Fundo de páginas internas e superfícies de leitura, como cartões e formulários |
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

Os títulos de categoria usam o mesmo papel na vitrine e na gestão. A home usa creme contínuo abaixo da transição. O degradê tem uma faixa curta depois da busca, com paragens em tons quentes e o mesmo creme no encontro com as categorias. As cores de estado, incluindo publicação e erro, mantêm significado próprio. O app deixa a barra do sistema com o comportamento padrão do navegador.

## Validar uma alteração

1. Abra a home, uma categoria, os detalhes de um produto, o carrinho, o menu e a gestão no preview.
2. Confira as fontes carregadas, a hierarquia dos títulos, o contraste e a quebra de títulos longos em tela estreita.
3. Revise o degradê no celular. Confirme que a faixa começa depois da busca e termina no mesmo creme do fundo.
4. Execute os checks e publique pela `main` após validar o preview. [Publicação e reversão](DEPLOY.md)

## Evolução por loja

O tema padrão já usa propriedades CSS que podem ser sobrescritas no contêiner de uma loja. O painel de personalização futuro deve usar um conjunto permitido de tokens, com fontes autorizadas e contraste validado antes da publicação. O piloto da Presente Doce define o tema pelo repositório. O isolamento das lojas e o plano Pro pertencem às etapas seguintes do produto. [PRD](PRD.md#plataforma-por-assinatura-para-outros-negócios)

Referências de implementação. [Variáveis de tema do Tailwind](https://tailwindcss.com/docs/theme#referencing-other-variables) · [Interpolação de cor em gradientes CSS](https://www.w3.org/TR/css-images-4/#coloring-gradient-line)
