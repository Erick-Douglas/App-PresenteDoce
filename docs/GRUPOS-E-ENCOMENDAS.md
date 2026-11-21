# Grupos de opções e encomendas — 21/11/2026

## Correção do requisito

Tópicos são **modificadores de compra**, agrupados por título, e não etiquetas/filtros. Esta especificação substitui a interpretação anterior para PD-OPT-01 a PD-OPT-06. Preserva os registros e pareceres anteriores.

## Gestão e compra

- Categoria: grupos com título, opções, acréscimo em cêntimos (0 = incluído), obrigatório/opcional, mínimo e máximo de escolhas. Até 10 grupos e 30 opções por grupo. Ordem dos grupos editável.
- Produto: usa os grupos da categoria por padrão. Desmarcar **Usar os grupos da categoria** cria opções próprias. O banco propaga alterações aos produtos que herdam; opções próprias ficam independentes. Cada grupo e opção tem UUID estável.
- Ficha: foto, título, descrição, preço, grupos, observações, quantidade e adicionar/atualizar. Sem disponibilidade, endereço, data ou horário na ficha. Ícones de compra sempre +; produtos com grupos abrem a ficha.
- Reabrir o produto recupera a última linha desse produto na sacola. Atualizar substitui essa linha; preserva quantidade, observações e escolhas. O retorno leva ao contexto anterior. Escolhas removidas do catálogo são descartadas ao reabrir; as escolhas obrigatórias precisam ser refeitas.
- O servidor resolve os IDs contra o catálogo atual, valida obrigatoriedade/limites/duplicações e recalcula **(base + adicionais selecionados) × quantidade**. A encomenda guarda rótulos e preços históricos. Preço do navegador não é autoridade.
- Tópicos antigos de produtos simples passam a um grupo opcional gratuito **Opções**, conservando os IDs. O produto/categoria **Teste** de Erick foi preservado. Não se inventaram custos. Bolos/caixas legados continuam funcionais; o editor converte seus tamanhos, massas, recheios e sabores em grupos ao guardar, com compatibilidade dos campos antigos e limites de sabores por tamanho.

## Operação atual

Somente encomendas. Prazo mínimo de **48 horas reais**, no fuso da loja. Checkout solicita data, horário e entrega com morada ou recolha. Agenda, bloqueios e capacidade continuam validados no banco. A criação administrativa usa os mesmos grupos e o horário. Pedidos antigos conservam horário nulo; não se inventa informação histórica.

Pronta entrega, saldos e modalidades anteriores ficam preservados e desativados na interface. O sinalizador preorder_only permite uma etapa futura; nenhum produto nem estoque é apagado. A política da loja piloto é ativada após frontend/backend compatíveis. As configurações são mescladas no banco para um cliente antigo não apagar novos campos.

## Interface e referências

Menu hambúrguer no topo esquerdo; retirado Mais inferior. Título administrativo no lugar da logo, retorno no cabeçalho, atualização secundária à direita. Abas de categoria em trilho horizontal de pílulas. Editar produto maior no canto superior direito da foto; editar categoria com alvo de toque de 44 px e ícone de 21 px.

Guardar mantém o bordô; cancelar usa superfície neutra; excluir usa fundo destrutivo claro. Em celular, excluir fica separado da dupla cancelar/guardar. Sacola tem largura máxima de 18 rem, altura mínima de 58 px, ícone amarelo e feedback integrado, sem toast sobreposto.

A referência Coffee orienta a composição e os controles compactos; Gestly orienta agrupamento e hierarquia dos módulos. As regras de grupos, opções, limites e preços seguem o padrão de [modificadores da Square](https://squareup.com/help/us/en/article/5119-create-and-manage-item-modifiers). A diferenciação de ação principal, secundária e destrutiva segue os [botões da Shopify](https://shopify.dev/docs/api/app-home/latest/web-components/actions/button), adaptada à paleta da marca. Não copiaram ativos externos.

## Arquitetura, implantação e evidências

catalog_categories.option_groups define os padrões. catalog_products.details contém optionGroupsMode e o snapshot optionGroups sincronizado por triggers. save_catalog_configuration preserva revisão, ordem, associação e escopo da RPC anterior. RLS continua obrigatório; leituras públicas só de catálogo publicado. create_order resolve opções e grava snapshots sem confiar em preços recebidos. orders passa a ter delivery_time e delivery_at.

Migrações aditivas: 20261121132314_configurable_product_groups e 20261121132356_preorder_delivery_slots. store-api v6. Aplicação em fases, com configuração de encomendas ativada por último. Reversão do frontend deve manter as migrações/dados; se necessário, rever o sinalizador de encomendas antes de usar um checkout antigo sem hora.

65 testes Node passaram, incluindo regras SQL de opções gratuitas/pagas, herança/override, histórico, isolamento de loja, limites, 48h e migração de Teste. Jornadas de navegador passam por gateway, handler Edge e PostgreSQL isolado: criação de categoria/produto/foto/grupos; edição e retorno; checkout/endereço/hora; encomenda administrativa; ordenação/renomeação/transferência; falha/reenvio de imagem; conflito entre sessões; login/logout; financeiro, marca e precificação. Capturas e medidas em 320/390/768/1440 px, regressões públicas/checkout em seis larguras.

Limites: Auth e transporte do provedor são simulados nessas jornadas; SQL, gateway, handler e processamento de imagem são reais isolados. Não se criaram pedidos/clientes de teste em operação, não se enviou WhatsApp e não se declarou teste físico/assinatura nativa. A comparação de receitas comerciais com a planilha e as dependências anteriores de Auth/CAPTCHA continuam separadas. Aceite visual e parecer da liderança permanecem pendentes.
