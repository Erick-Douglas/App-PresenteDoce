# PRD — Presente Doce e evolução da plataforma

**Versão 2.0 · 21/11/2026 · Europe/Lisbon**  
**Direção do produto:** Erick. **Operação e validação:** Gabriela. **Execução técnica:** agente do app.  
**Estado:** base publicada; revisão visual e de comportamento pendente de aprovação. A próxima etapa definida por Erick é desenhar o app no Figma e escrever a especificação funcional antes de retomar a implementação.

[Índice dos documentos](README.md) · [Mapa de telas](MAPA-DE-TELAS.md) · [Briefing Figma](BRIEFING-FIGMA.md) · [Modelo ERS/SRS](SRS.md) · [Design System](DESIGN_SYSTEM.md) · [Roadmap](ROADMAP.md)

## 1. O que é o produto

A Presente Doce é uma confeitaria artesanal em Portugal. O app é a sua loja online de encomendas e o seu sistema de gestão: apresenta produtos, permite personalizar um pedido, organiza entrega/recolha e encaminha o atendimento para o WhatsApp. A mesma aplicação oferece ferramentas internas para catálogo, fichas técnicas, preços, encomendas, produção, clientes e financeiro.

Para o cliente, a descrição é **loja online de confeitaria artesanal por encomenda**. Tecnicamente, a versão atual é um **web app de comércio direto de uma loja, com checkout assistido por WhatsApp**, instalável como PWA nos navegadores compatíveis. Cada loja é uma vendedora; não há um marketplace reunindo vendedores na mesma sacola.

A evolução pretendida é um **Micro-SaaS vertical B2B**, com assinatura para outros pequenos negócios de alimentação. A Presente Doce é a loja piloto. A infraestrutura já tem contexto por loja e controles de isolamento; isso ainda não representa lançamento comercial, cobrança ativa ou operação validada para terceiros.

React/Vite permanece por decisão de Erick. As bases Capacitor permitem continuar para aplicativos Android/iOS. Compilar, assinar, testar em aparelhos e publicar nas lojas são etapas próprias.

## 2. Por que existe

Gabriela concentra atendimento, catálogo, precificação e operação. Erick atua em tecnologia e soluções. O produto deve reduzir tarefas repetitivas e a dependência da presença de Erick, dar autonomia à operadora pelo celular e ajudar a manter constância nas encomendas.

O posicionamento da confeitaria combina apresentação refinada, ingredientes de qualidade e atendimento acessível a clientes pequenos e médios. Encomendas para empresas são uma oportunidade comercial, não uma obrigação de destacar essa mensagem na home.

Resultados a medir após estabelecer a linha de base: tempo para cadastrar produto e preparar orçamento; erros de personalização/preenchimento; pedidos confirmados; sinais pendentes; tempo dedicado à gestão. Não atribuir aumento de vendas ou redução de trabalho a funcionalidades sem medição.

## 3. Etapa atual e fontes de verdade

| Artefato                 | Responsabilidade                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------- |
| Este PRD                 | Propósito, público, escopo, módulos, regras e critérios de produto                                |
| Figma aprovado por Erick | Aparência, composição, componentes e estados visuais, com versão e links por frame                |
| ERS/SRS aprovada         | Comportamento de cada interação, validações, permissões, persistência, erros e critérios de teste |
| Código e migrações       | Implementação existente; base para levantamento, não aprovação automática de UX                   |
| Daily Log da empresa     | Execução, versão, evidência, pendências e parecer por ID                                          |
| Relatórios datados       | Evidência da entrega em questão; não requisitos automaticamente vigentes                          |

O arquivo Figma de trabalho ainda será criado pelo próximo agente. [SRS.md](SRS.md) é somente um modelo a preencher por Erick, sem aprovação funcional final. Uma decisão nova e explícita de Erick atualiza os documentos afetados. Se o Figma aprovado, a SRS e o PRD divergirem, registrar a divergência e resolvê-la com Erick antes de implementar a parte afetada.

A última base funcional conferida é [main e79ff700](https://github.com/Erick-Douglas/App-PresenteDoce/commit/e79ff700e168527f28f9b5534e9de91e42e2ad3a), [PR #27](https://github.com/Erick-Douglas/App-PresenteDoce/pull/27). Ela foi publicada e ensaiada; Erick informou que ainda há pontos a resolver. **Publicado, testado, aprovado visualmente e aceito operacionalmente são estados diferentes.**

## 4. Pessoas, acesso e limites

| Perfil                 | Necessidade e acesso                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- |
| Visitante/comprador    | Navegar, pesquisar, escolher opções, guardar favoritos, usar carrinho e checkout; ver apenas dados públicos   |
| Operadora da loja      | Mesma vitrine com edição contextual e acesso aos módulos internos, conforme associação e papel verificados    |
| Dono da loja           | Gestão autorizada da sua loja; o termo superadmin usado no briefing não concede acesso global às outras lojas |
| Cliente com conta      | Evolução futura para perfil, moradas e histórico próprios; cadastro de clientes não foi aberto nesta etapa    |
| Operador da plataforma | Papel futuro de suporte/comercial, a especificar e proteger; não disponível por inferência de metadados       |

Login usa Supabase Auth. A autorização depende da associação em store_members, do contexto da loja e dos direitos verificados no servidor/banco. Avatar, nome e outros metadados editáveis de perfil servem à apresentação. Pré-visualizar como cliente oculta controles sem alterar a autorização real.

## 5. Decisões operacionais vigentes

| ID de referência         | Regra                                                                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PD-OPT / encomenda       | Somente produtos por encomenda, com antecedência mínima de 48 horas reais. Data e hora são escolhidas no checkout, no fuso da loja                     |
| PD-OPT / standby         | Pronta entrega/estoque por disponibilidade permanece preservada e desativada na jornada atual                                                          |
| PD-OPT / grupos          | Tópicos são grupos de escolha com título, opções, mínimo/máximo, obrigatoriedade e acréscimo zero ou positivo; não são uma faixa de etiquetas públicas |
| PD-CART / linhas         | O mesmo produto com escolhas/observações diferentes gera linhas independentes; configurações iguais somam quantidade                                   |
| PD-CART / novo ou editar | + inicia outra personalização; lápis do carrinho edita a linha exata. A ficha retomada oferece adicionar outro com novas escolhas                      |
| PD-CART / atendimento    | Assistente flutuante retirada. Contactos e o encaminhamento para WhatsApp continuam                                                                    |
| PD-DARK / apresentação   | Avatar à esquerda, menu à direita; Claro/Escuro/Sistema. Desenho final de todas as páginas será validado no Figma                                      |
| PD-GAB-01 / categorias   | Todos no início e selecionado inicialmente. Categoria individual mostra produtos; Todos agrupa pelos títulos                                           |
| Checkout                 | Recolha ou entrega, conforme configuração. Taxa de entrega desconhecida é a combinar; não presumir gratuidade                                          |
| Pagamentos               | MB WAY, Wise e dinheiro são preferências de atendimento. Não há cobrança de encomenda por gateway nesta etapa                                          |
| Comercial                | Stripe para Portugal/Europa fica para depois: conta, valores, checkout, portal e webhooks ainda pendentes                                              |
| Automação                | Não existe provedor de WhatsApp Business API/n8n conectado. Abrir conversa não comprova envio nem confirmação do pedido                                |

As definições anteriores de operação híbrida ativa, assistente flutuante, barra artificial no topo e tópicos como etiquetas foram substituídas. Permanecem no histórico e não devem orientar o novo desenho.

## 6. Jornada do comprador

### 6.1 Descobrir e escolher

A home apresenta marca, saudação, pesquisa e categorias com rolagem. A categoria Todos lista grupos de produtos por categoria. Busca e categorias devem funcionar em conjunto sem ocultar o caminho de retorno. Catálogo sem produtos, pesquisa sem resultado e falha de leitura exigem estados distintos.

Cada card apresenta foto, nome, descrição curta, preço ou preço inicial e +. O produto com opções abre a ficha; o simples pode entrar diretamente na sacola. Fotografias ficam livres de controles promocionais redundantes. Edição aparece apenas para a gestão autorizada. A ordem editorial das categorias pode priorizar vendas, margem e novidades; não há classificação automática comprovada por análise comercial.

### 6.2 Personalizar

A ficha contém foto, título, descrição, preço, grupos, observações, quantidade e ação de adicionar/atualizar. Entrega e recolha pertencem ao checkout. Categorias fornecem grupos padrão e cada produto pode herdar ou ter definição própria. A escolha precisa respeitar limites e IDs válidos.

Na base atual, o + da vitrine inicia outra configuração; clicar no título/imagem pode retomar a última configuração do produto. Adicionar outro com novas escolhas preserva a linha anterior e limpa o formulário. A SRS final deve confirmar essa distinção, inclusive como tratar várias linhas do mesmo produto.

O preço resulta da base/opção e dos adicionais, multiplicado pela quantidade. O servidor recalcula o valor canônico e conserva as escolhas no snapshot. Não confiar no total calculado pelo navegador.

### 6.3 Guardar e revisar

O favorito alterna guardar/remover com retorno acessível. A preferência atual é local ao navegador e à loja; sincronização entre aparelhos exige conta/escopo futuro.

A sacola fixa permite continuar a navegar e abrir o checkout. Cada linha distingue suas escolhas, quantidade e preço. Editar uma linha não altera outra. A volta da ficha conserva preenchimento e contexto da compra. Escolhas idênticas podem reunir quantidade; a regra deve ficar explícita na SRS.

### 6.4 Checkout e atendimento

Blocos: produtos e subtotal; dados do cliente; entrega/recolha e horário; preferência de pagamento; resumo e encaminhamento. Dados atuais: nome e WhatsApp obrigatórios; e-mail e nascimento opcionais. Morada estruturada quando houver entrega, sem integração Google exigida. Nascimento fica no CRM privado e não é acrescentado à mensagem do WhatsApp.

Validar data/hora com 48 horas reais, bloqueios e capacidade. Preservar o rascunho ao editar itens ou em caso de erro. O rascunho/carrinho atuais ficam na memória da aplicação; persistência após fechar/recarregar precisa ser especificada e não pode ser presumida.

Copiar mensagem não cria pedido. Continuar no WhatsApp valida e registra uma solicitação com repetição segura e reserva temporária de 30 minutos; confirmação final da loja é separada. Se a janela externa não abrir, apresentar o caminho alternativo e preservar os dados. Não limpar a sacola por supor que a mensagem foi enviada.

## 7. Gestão e módulos

A edição contextual é um diferencial: a operadora vê a mesma loja com controles extras. Tarefas prolongadas usam páginas de módulo, com cabeçalho e navegação comuns. O menu agrupa vitrine, negócio, produtos/produção, loja e conta. O Figma deve cobrir todos os módulos, formulários e estados do [mapa](MAPA-DE-TELAS.md).

| Módulo                    | Comportamento e dados essenciais                                                            | Critério de produto                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Vitrine em gestão         | Editar produto/categoria; criar; alternar prévia                                            | Contexto preservado; controles internos não aparecem ao visitante                                                  |
| Catálogo                  | Produtos por categoria, publicados/rascunhos, pesquisa, ordenação e transferência           | Renomear/ordenar mantém relações; exclusão de categoria com itens exige destino válido                             |
| Produto                   | Foto, nome, descrição, categoria, preço, estado, opções próprias/herdadas, vínculo de ficha | Erro não perde dados; cancelar seletor de imagem não fecha editor; versão evita sobrescrita concorrente            |
| Categoria                 | Nome/capa, grupos de opções e ordem de produtos/categorias                                  | IDs estáveis; opções gratuitas/pagas; impactos da alteração visíveis; pedidos antigos preservados                  |
| Precificação              | Rascunho, ficha guardada, produto/opção, rendimento, custos, simulação e publicação         | Guardar ficha e aplicar preço são separados; publicação exige confirmação; limpar rascunho preserva ficha anterior |
| Ingredientes/sub-receitas | Unidade, embalagem, preço, quantidades e dependências                                       | Unidades compatíveis, recálculo canônico e bloqueio de ciclos                                                      |
| Encomendas/orçamentos     | Criar, consultar itens e cliente, data/hora, valores, status e taxa combinada               | Orçamento não reserva até confirmação; transições válidas; não confundir pagamento com status de produção          |
| Agenda e produção         | Calendário, bloqueios, capacidade especial, produção consolidada e compras                  | Pedido confirmado participa conforme regra; ficha/custo ausente aparece como pendência                             |
| Financeiro                | Sinal, saldo, recebimento, devolução, despesa, histórico                                    | Sem dupla contagem; edição/exclusão corrigem/anulam com auditoria; somente encomendas elegíveis                    |
| Clientes                  | Histórico, contactos, morada, nascimento opcional, notas, arquivo/união                     | Acesso da própria loja; contacto público novo não sobrescreve notas privadas existentes                            |
| Visão geral               | Encomendas, entregas e sinais pendentes; acesso aos módulos                                 | Indicadores definidos, origem e período claros; sem inventar dados ou gráficos                                     |
| Textos da loja            | Saudação, descrição, nome de apresentação e Sobre nós                                       | Mudança refletida na vitrine e protegida por versão                                                                |
| Configurações             | Marca, moeda, fuso, contactos, capacidade, prazo, sinal, entrega, massas/recheios e galeria | Validação, contraste e permissão; preservar pedidos antigos                                                        |
| Perfil/aparência          | Nome/foto da própria conta; claro/escuro/sistema                                            | Foto validada e limpeza proporcional; nenhuma promoção de papel                                                    |
| Pronta entrega            | Estoque, ajustes e opções de disponibilidade já modelados                                   | Standby nesta etapa; não oferecer compra dessa modalidade                                                          |

Os controles atuais não cobrem toda configuração imaginável do produto. O objetivo de autonomia pelo painel precisa ser convertido em campos/regras explícitos na SRS, sem prometer edição arbitrária do código.

## 8. Precificação e dados da planilha

Preservar o fluxo PD-GAB-06 / PD-REV-08. Custo de linha = preço da embalagem ÷ quantidade da embalagem × quantidade usada; custo unitário = custo total ÷ rendimento. Markup e margem têm bases diferentes. Rendimentos, unidades e custos incompletos devem impedir uma gravação apresentada como válida.

Fichas podem vincular produto e variante, ingredientes e sub-receitas. Atualizar custo não altera silenciosamente preço aprovado nem histórico da encomenda. Importação da planilha e comparação privada ao cêntimo com Gabriela continuam pendentes; os arquivos e dados originais devem ser preservados. A descrição de cálculos não comprova migração de dados comerciais. [Detalhes](PRECIFICACAO.md).

## 9. Arquitetura e limites de segurança

| Camada      | Base existente                                                                   |
| ----------- | -------------------------------------------------------------------------------- |
| Interface   | React 19 + TypeScript + Vite 6 + Tailwind; componentes e tokens comuns           |
| Publicação  | GitHub → Vercel no projeto existente; domínio oficial da Presente Doce           |
| Gateway web | /api/store na Vercel: tamanho/prazo/origem e encaminhamento controlado de JWT/IP |
| Backend     | Supabase Edge Function store-api; schemas Zod, identidade e escopo verificados   |
| Dados       | PostgreSQL com stores/store_members/store_id, RLS e operações transacionais      |
| Fotos       | Storage com pastas por loja e bucket de avatar por conta; validação e limite     |
| Mobilidade  | PWA e bases Capacitor sincronizadas; publicação nativa ainda não executada       |

Preço, extras, reserva/capacidade, idempotência e financeiro são garantidos no backend/banco. A visibilidade no frontend não concede acesso. Snapshots preservam dados do pedido. service_role e segredos permanecem no runtime gerenciado; só URL/chave publicável podem ir ao cliente.

O plano gratuito foi mantido. CAPTCHA e política nativa de Auth não estão comprovadamente ativos; a aplicação administrativa da configuração preparada continua pendente. A proteção nativa contra senhas vazadas depende de plano pago. Onboarding comercial fechado no app/banco não comprova que signup nativo do Auth esteja desativado. [Estado dos controles](SEGURANCA.md). Não preencher esses estados como resolvidos por ter criado um desenho no Figma.

## 10. Qualidade, interface e acessibilidade

O produto deve funcionar no celular, tablet e desktop. Validar 320, 390, 768, 1024, 1440 e 1920 px sem overflow, sobreposição da ação por barra fixa ou perda de formulário. Usar contraste adequado, foco visível, labels e tamanho de toque confortável. Movimento reduzido deve ser respeitado.

A identidade parte do manual da marca: bordô, dourado, creme como apoio; Lato para leitura e Great Vibes em assinatura/saudação. Superfícies claras neutras e modo escuro sem inverter fotos. Tokens de cor, fonte, escala, borda, sombra e espaçamento são centrais. [Design System](DESIGN_SYSTEM.md).

O Figma definirá composição final de títulos, cards, menus, botões, separação de ações e comportamento responsivo. O desenho deve mostrar estados vazio, carregando, erro, preenchido, gravando, sucesso, permissão insuficiente, sessão expirada e conflito de versão. Um print isolado não cobre todos esses estados.

A meta transparente e a retirada da camada própria do topo eliminam a pintura do app; hora/Wi-Fi e instalação seguem capacidades do sistema/navegador. Pagamentos, notificações, envio de mensagens e segurança não surgem do protótipo visual.

<a id="plataforma-por-assinatura-para-outros-negócios"></a>

## 11. Evolução comercial e itens futuros

| Frente                 | Preparado ou desejado                                     | Dependência antes de ativar                                                                            |
| ---------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Multi-loja             | Contexto /lojas/slug, marca, membros e RLS                | Revisão de isolamento, operação de terceiros, suporte/exportação e recuperação                         |
| Assinatura SaaS        | Direitos de plano modelados; Stripe escolhida para Europa | Conta, preços e regras por Erick; checkout/portal/webhooks testados, sem ativar por retorno de browser |
| Clientes autenticados  | Avatar/conta como fundação                                | Cadastro, consentimentos, moradas, histórico próprio e autorização por cliente                         |
| Pronta entrega         | Código/modelo preservados                                 | Regra operacional, estoque e reserva próprios, nova autorização                                        |
| Pagamento da encomenda | Evolução desejada                                         | Escolha e contrato próprios; independente da mensalidade SaaS                                          |
| WhatsApp/IA            | Contratos de ações limitadas por loja                     | Provedor/canal oficial, identidade, reenvio seguro, custos e autorização                               |
| Android/iOS            | Projeto Capacitor                                         | Assinatura, aparelho, permissões, testes e publicação nas lojas                                        |

Não priorizar essas ativações antes da definição/validação da operação piloto. Sushi, tapiocaria e outras lojas podem ser próximos segmentos; necessidades e taxonomia exigem validação, não somente trocar o logótipo.

## 12. Próxima sequência e aceite

1. Próximo agente lê PRD, Design System, mapa e briefing; levanta a interface atual e cria componentes/páginas no Figma.
2. Erick experimenta e aprova frames/variantes; Gabriela confere a operação. Registro de aprovação inclui versão, data e links.
3. Erick preenche a ERS/SRS por tela/ação, com eventos, transições, permissões, dados, erros e testes. Decisões abertas ficam explícitas.
4. Agente executor cruza PRD + frames aprovados + SRS. Abre checklist de implementação por ID com lacunas e impactos, antes de alterar a parte afetada.
5. Implementa, testa jornadas completas e publica com preview, evidência e possibilidade de reversão. Mudanças de banco preservam dados e histórico.

Critério de pronto da próxima entrega: cada requisito ligado a um frame e a um teste de aceite, escopo implementado no repositório, fluxo real verificado, pendências registradas e aceite de Erick/Gabriela separado dos testes. A clareza reduz interpretações; a validação continua necessária.

## 13. Evidência, pendências e histórico

A base e79ff700 registrou 68 testes Node/SQL e jornadas em claro/escuro, checkout em seis larguras, tipagem/build e sincronização Capacitor. Gravações dos ensaios usaram PostgreSQL isolado; Auth/transporte do provedor são simulados nesses cenários. O smoke público real não fez gravações. Essa evidência descreve a base testada, não aprovação do novo desenho ou ausência de todos os defeitos. [Evidência de carrinho](validation/2026-11-21-cart-checkout.json) · [Testes](TESTES.md).

Pendências prioritárias: design completo aprovado; SRS preenchida; retorno real de Gabriela na precificação/fotografias e comparação ao cêntimo; Auth/CAPTCHA conforme acessos/plano; teste físico e integração comercial somente nas etapas próprias. [Roadmap e responsáveis](ROADMAP.md).

O PRD 2.0 consolida as decisões que estavam distribuídas em adendos das versões 0.x/1.x. Preserva a direção do PRD fornecido por Erick e os IDs PD-GAB, PD-ADM, PD-SAS, PD-REV, PD-OPT, PD-DARK e PD-CART. O histórico anterior está no [GitHub antes da consolidação](https://github.com/Erick-Douglas/App-PresenteDoce/blob/e79ff700e168527f28f9b5534e9de91e42e2ad3a/docs/PRD.md). Relatórios datados continuam acessíveis pelo índice.
