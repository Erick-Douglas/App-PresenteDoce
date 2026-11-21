# Design System — Aplicativo Presente Doce

**Versão 2.0 · consolidada em 21/11/2026**  
**Estado:** referência da base existente para o trabalho no Figma; nova composição visual ainda será aprovada por Erick.

[Índice](README.md) · [PRD](PRD.md) · [Briefing Figma](BRIEFING-FIGMA.md) · [Mapa](MAPA-DE-TELAS.md) · [SRS](SRS.md)

## 1. Propósito e fonte única

A linguagem visual combina confeitaria artesanal refinada, leitura simples e autonomia de uso pelo celular. A regra nova definida por Erick é experimentar e aprovar o design no Figma antes de retomar as alterações de interface.

A fonte de tokens implementados é [tokens.css](../src/design-system/tokens.css). O Figma deve mapear seus estilos/variáveis a esses conceitos e registrar mudanças propostas. Após aprovação, ajustar tokens e componentes compartilhados; cores e medidas soltas por tela tornam a manutenção inconsistente.

Este documento descreve a base do código e os critérios de revisão. Não afirma que todos os detalhes atuais tenham sido aceitos. O [histórico anterior](https://github.com/Erick-Douglas/App-PresenteDoce/blob/e79ff700e168527f28f9b5534e9de91e42e2ad3a/docs/DESIGN_SYSTEM.md) permanece no GitHub.

## 2. Identidade e tipografia

| Função                              | Base                                                               |
| ----------------------------------- | ------------------------------------------------------------------ |
| Marca                               | Presente Doce; assinatura clara com presente dourado no topo bordô |
| Bordô                               | #800000                                                            |
| Dourado                             | #FBCE00                                                            |
| Creme de apoio                      | #FFF6DB                                                            |
| Leitura, campos, navegação, títulos | Lato 400 e 700                                                     |
| Assinatura/saudação                 | Great Vibes 400, uso restrito                                      |
| Corpo                               | 1rem; entrelinha 1,5 na base                                       |
| Secundário/legenda                  | 0,875rem / 0,75rem                                                 |
| Escalas fluidas                     | Display, página, módulo e seção definidos em tokens.css            |

Usar pesos da família disponível; títulos se distinguem por hierarquia e espaçamento, não por aumentar tudo. Figma deve mostrar título de página, card, produto, valor, informação secundária e aviso em contexto.

## 3. Superfícies e semânticas

| Papel               | Claro   | Escuro  |
| ------------------- | ------- | ------- |
| Canvas              | #F7F5F3 | #151519 |
| Superfície          | #FFFFFF | #1E1E22 |
| Sutil               | #FAFAF9 | #242428 |
| Preenchimento suave | #F5F5F4 | #2C2C31 |
| Texto principal     | #1A1A1A | #F3F1ED |
| Texto secundário    | #57534E | #AAA6AD |
| Borda               | #E7E5E4 | #34343B |
| Sucesso             | #2D6446 | #91D4A6 |
| Atenção             | #855B1E | #EBC47C |
| Destrutivo/erro     | #A13B2E | #F4A69B |

As cores são os valores atuais, não aprovação definitiva do desenho. Tokens de fills, bordas e texto semântico acompanham cada tema. A cor da marca pode variar por loja; texto sobre a marca exige contraste verificado. O coração de favorito usa vermelho próprio #E6384B. Fotografias/logos não devem ser invertidos com filtro CSS.

## 4. Dimensões e componentes

Base: controle de toque 44 px, card 14 px de raio, campo 10 px, largura de página até 72rem e de formulário administrativo até 52rem; gutters/paddings fluidos. Um ícone compacto pode ocupar área de toque maior que sua parte visível.

Componentes do código: Header, AdminPage, Sidebar, ManagementNav, CatalogCard/Grid, CategoryEditButton, ProductEditButton, ProductChoices, OptionGroupsEditor, FloatingCart, StoreDialog, AppSelect e os blocos Panel/Field/Metrics/Empty/ActionForm. Mapear equivalentes editáveis no Figma, incluindo foco, hover, pressionado, ocupado, desativado e erro.

CSS de composição:

- [components.css](../src/design-system/components.css): elementos comuns e vitrine.
- [platform.css](../src/design-system/platform.css): módulos/gestão.
- [journey.css](../src/design-system/journey.css): jornada compartilhada.
- [modifiers.css](../src/design-system/modifiers.css): grupos e edição.
- [appearance.css](../src/design-system/appearance.css): perfil, menu e aparência.
- [cart.css](../src/design-system/cart.css): ficha/carrinho/checkout.
- [typography.css](../src/design-system/typography.css): papéis de texto.

O índice de importação é [src/index.css](../src/index.css). Nenhum arquivo de estilos é alterado nesta consolidação documental.

## 5. Composição vigente a levar para revisão

Home: marca em linha própria, saudação/busca no bordô, catálogo em neutro; Todos primeiro e selecionado; categoria individual sem repetir o título abaixo. Fotos, nome, descrição breve, preço e +. Produto configurável abre grupos; simples pode adicionar. Retorno +1 local e sacola com quantidade/total.

Ficha: voltar e coração separados sobre a foto, com vidro branco a 7%, borda translúcida e blur. Retorno claro, coração vermelho, aviso de guardar/remover. Sem badge Personalizável, assistente flutuante ou entrega no produto. Categorias e produtos recebem lápis apenas em gestão; categoria tem alvo 48 px/ícone 26 px, produto 44 px/ícone 19 px na base.

Checkout: cabeçalho compacto; títulos de card distinguíveis, sacola e contagem de unidades, editar/apagar no topo direito, valor sobre quantidade à direita, subtotal após os itens. Dados pessoais com título e ícone à direita. Formulários e resumo compartilham tokens.

Gestão: título do módulo no cabeçalho, ações principais à direita, cancelar e excluir com hierarquia própria. Seletores em lista ancorada; seções secundárias recolhíveis; guardas de gravação/falha e versão. As posições finais serão aprovadas nos frames e definidas na SRS.

## 6. Navegação, perfil e tema

Avatar à esquerda e hambúrguer à direita na base. Visitante usa menu compacto; gestão abre viewport completo, com títulos de grupo externos e módulos em pílulas. Preservar uma entrada de menu por contexto, navegação inferior/rail administrativa e prévia do cliente.

Claro/Escuro/Sistema são escolhas persistidas no aparelho; Sistema acompanha a preferência do ambiente. Perfil da própria conta permite foto/nome; apresentação não concede papel administrativo.

Área segura faz parte da página, sem pseudo-elemento fixo pintando a área da hora/Wi-Fi e sem mudança de cor por scroll. Meta solicita transparent; aparência física depende do navegador/SO. Figma deve indicar essas limitações em vez de simular capacidades nativas como entregues.

## 7. Regras de UX para todos os módulos

- Usar o mesmo vocabulário e padrão de ação para guardar, cancelar, editar, excluir e voltar.
- Distinguir adicionar nova personalização de editar uma linha existente.
- Dar feedback local e acessível sem cobrir a sacola ou a confirmação.
- Preservar formulário ao falhar/voltar; seletores, teclado e diálogos mantêm foco/scroll.
- Diferenciar estado vazio, carregando, sem resultado, erro e sem permissão.
- Tema escuro deve manter texto, bordas, avisos e controles legíveis em todos os módulos.
- Validar celular/tablet/desktop; ações fixas não sobrepõem conteúdo ou teclado.

## 8. Critério da próxima revisão

Cobertura de todas as TEL/INT/CTX, componentes reutilizáveis, links de protótipo e matriz de estados. Os ensaios da base não substituem aprovação visual de Erick ou validação operacional de Gabriela. Frame aprovado + requisito SRS + teste de aceite formam a referência de implementação. [Passagem para Figma](BRIEFING-FIGMA.md).
