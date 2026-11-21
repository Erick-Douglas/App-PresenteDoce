# PRD — Plataforma de confeitaria híbrida

**Versão 1.1 · 20/11/2026 · Europe/Lisbon**  
**Solicitante:** Erick · **Loja piloto:** Presente Doce · **Revisão:** liderança e Gabriela  
**Natureza:** direção de produto fornecida por Erick, detalhada em requisitos executáveis. A operação inicial está implementada; a ativação comercial e integrações externas ficam nas dependências descritas em IMPLEMENTACAO.md.

Substitui a versão 0.5. O histórico da versão anterior permanece no GitHub. [Base funcional conferida](https://github.com/Erick-Douglas/App-PresenteDoce/tree/63e5c4420449fd8bd9a0eed6b843e30bfee33506) · [Arquitetura](ARQUITETURA.md) · [Pesquisa das referências](REFERENCIAS-SAAS.md) · [Backlog](ROADMAP.md)

## 1. Produto e resultado esperado

Micro-SaaS vertical B2B de operação e vendas para confeitarias e pastelarias artesanais. Cada loja vende por encomenda agendada e/ou pronta entrega, com marca própria, gestão pelo celular e assinatura mensal/anual. A Presente Doce valida primeiro a operação real; o nome comercial da plataforma e os preços dos planos ainda serão definidos.

O diferencial proposto é a gestão na mesma vitrine vista pelo cliente: Live Mode com edição contextual e opção de pré-visualização. Agenda, produção, precificação, financeiro e clientes são módulos da mesma aplicação. Não haverá uma segunda loja ou um portal administrativo independente.

O checkout do consumidor e a assinatura do lojista são fluxos distintos. Encomendas continuam a ser concluídas no WhatsApp na transição. Cobrança online de encomendas não entra automaticamente junto da cobrança da assinatura.

## 2. Estado real e diferença para o briefing técnico

| Componente | Confirmado hoje | Destino |
| --- | --- | --- |
| Interface | React 19, TypeScript, Vite 6, Tailwind; tokens de tema | React/Vite mantido por decisão de Erick; API Edge segura |
| Hospedagem e histórico | Vercel; GitHub Erick-Douglas/App-PresenteDoce | Mesmo projeto/histórico; publicar por commit, preview e reversão |
| Dados e identidade | Supabase dedicado; store_id/RLS, membros, catálogo, pedidos, clientes, agenda e finanças | Isolamento por store_id, membros, pedidos e demais módulos |
| Edição contextual | Edição de produto/categoria a partir da vitrine, além dos módulos de gestão | Edição contextual, estoque no card e prévia implementados |
| Precificação | Fichas ligadas ao catálogo e validação; importação antiga pendente | Ingredientes, sub-receitas, fichas versionadas, compras e produção |
| Encomenda | Carrinho em memória; pedido persistente validado e mensagem WhatsApp | Pedido validado no servidor e reserva antes dos módulos operacionais |
| Agenda, CRM e financeiro | Implementados em torno do mesmo pedido | Aceite da operadora e escala comercial |
| Nativo | Bases Capacitor Android/iOS; sem distribuição assinada | Preservar reutilização; testar API, autenticação e aparelhos antes das lojas |

O projeto atual não usa Next.js. Erick confirmou React/Vite para esta evolução. A API segura foi adicionada em Supabase Edge Functions, preservando compatibilidade com Capacitor. Os testes e correções anteriores continuam sendo a base de regressão. [Ensaios atuais](TESTES.md) · [Precificação](PRECIFICACAO.md) · [Nativo](NATIVE.md).

[Estado implementado, testes e limites](IMPLEMENTACAO.md) · [Stripe e automação na próxima etapa](INTEGRACOES.md).

## 3. Perfis e permissões

Visitante consulta o catálogo publicado e prepara uma encomenda sem cadastro obrigatório. Conta de cliente com histórico próprio é posterior. Dados de um cliente da loja A não ficam automaticamente disponíveis à loja B.

Dona da loja gerencia catálogo, pedidos, capacidade, pagamentos registrados e marca. O modelo admite membros com funções owner, manager e staff; a lista de ações de cada função será conferida antes de liberar equipes. O acesso atual da Presente Doce será migrado preservando a conta da confeitaria.

Administrador da plataforma é um papel separado do dono de uma loja. A conta administradora da Presente Doce não recebe acesso global às futuras assinantes. Mudanças de associação e função não podem ser feitas pelo próprio usuário sem autorização apropriada.

## 4. UX/UI e Live Mode

### PD-SAS-01 — Clean White & Warm Craft

Predomínio de branco e neutros quentes, fotografias como foco, espaço entre seções, tipografia legível e ações compactas. Manter o bordô, o dourado e a marca da Presente Doce como identidade da loja piloto. Lato continua na leitura; a fonte decorativa fica restrita à assinatura/saudação. A nova direção não autoriza trocar a marca por identidade de concorrentes.

Os tokens de cor, tipografia, espaçamento, raio, foco e estados são a fonte única. Definir componentes comuns para cartões, formulários, estados vazios e mensagens de erro. Configuração de marca futura usa valores validados e contraste adequado, sem CSS arbitrário.

**Aceite:** vitrine, login, editor, precificação e um módulo operacional usam os mesmos componentes em 320, 390, 768, 1024, 1440 e 1920 px; imagens livres de controles sobrepostos; teclado e foco utilizáveis. Validar protótipo com Gabriela/Erick antes da revisão visual completa.

### PD-SAS-02 — Edição na vitrine e pré-visualização

Visitante vê apenas compra e atendimento. Membro autorizado tem editar produto/categoria, adicionar item no contexto, mudar disponibilidade e ajustar estoque. Manter editor completo quando a tarefa exigir várias informações; ele pertence à mesma aplicação.

Pré-visualizar como cliente oculta controles e mostra somente o catálogo publicado, inclusive para o administrador. Um indicador discreto permite voltar à gestão. É uma simulação visual, não logout nem alteração de papel. As permissões continuam sendo verificadas no servidor.

**Aceite:** voltar da prévia preserva navegação/carrinho, rascunhos não aparecem na prévia, edição não é acionada por visitante e mutação sem permissão é recusada pela API.

### PD-SAS-03 — Navegação unificada

Sidebar recolhível em mobile e desktop, com Vitrine, Agenda & Produção, Financeiro, Clientes e Configurações. Catálogo e Precificação continuam acessíveis na gestão, como destinos ou subseções coerentes. Preservar Sobre nós, Contactos e entrada pelo menu para o visitante.

Não disponibilizar botões que aparentem executar módulos ainda inexistentes. No planejamento eles são futuros; quando houver interface inicial, apresentar estado claro e preservar acesso às funções prontas.

**Aceite:** um login, uma loja e um estado de navegação; menu utilizável por teclado e toque; nenhum dado privado carregado só para ocultar por CSS.

## 5. Operação híbrida

### PD-SAS-04 — Pronta entrega e encomenda

Uma publicação pode aceitar pronta entrega, encomenda ou ambas. São modalidades de venda, distintas de publicado/rascunho e de produto simples/configurável. A modalidade é escolhida por item, com estoque por produto/opção quando aplicável.

Pronta entrega apresenta quantidade disponível e janela de recolha/entrega. Encomenda apresenta antecedência e datas elegíveis. O servidor verifica tudo novamente na reserva. Alteração de estoque exige motivo e movimento de auditoria; nunca permitir saldo negativo.

**Aceite:** com uma unidade restante e duas compras concorrentes, apenas uma reserva é aceita; abandonar/expirar reserva devolve disponibilidade uma vez. Alternar modalidade não apaga os preços, as opções ou a ficha do produto.

### PD-SAS-05 — Pedido persistente e orçamento

Base única para pedido manual da confeiteira e solicitação da vitrine. Guardar cliente, itens/opções, modalidade, data, preços e custos históricos relevantes, entrega e estado. O servidor consulta os valores atuais e devolve o resumo validado; o navegador não determina o total final.

Estados iniciais propostos: rascunho, aguardando confirmação, confirmado, em produção, pronto, concluído e cancelado. Pagamento tem estado separado. Orçamento tem validade e só ocupa capacidade conforme política explicitamente configurada.

Na transição, registrar a solicitação e depois abrir o WhatsApp com referência do pedido. Abrir a conversa não confirma encomenda nem pagamento. Reenvio do mesmo pedido não duplica registro ou reserva.

**Aceite:** alterar preço no navegador é rejeitado/recalculado; duplo clique gera um pedido; produto indisponível devolve orientação; pedidos antigos mantêm o preço acordado após editar o catálogo.

### PD-SAS-06 — Agenda & Produção

Calendário com datas bloqueadas, antecedência mínima, capacidade e pedidos. Diferenciar data de produção e de entrega quando necessário. Iniciar com capacidade configurada em unidades por grupo de produção, por exemplo bolos/dia, sem inferir capacidade a partir de faturamento.

Resumo diário/semanal soma itens e opções das encomendas confirmadas. Receitas vinculadas podem gerar demanda de ingredientes e lista de compras; conversões precisam de unidade compatível. Não converter massa em volume sem fator específico do ingrediente.

**Aceite:** reservas concorrentes não excedem capacidade; cancelamento/expiração libera uma única vez; bloqueio novo informa encomendas afetadas; resumo não duplica itens e separa pendentes de confirmados.

### PD-SAS-07 — Financeiro com sinal e restante

Sinal inicial de 50% como padrão configurável por loja; permitir alteração autorizada com histórico. Registrar recebimentos parciais, método, data, responsável, ajustes e estornos. Saldo = total acordado menos recebimentos líquidos confirmados, com valores em cêntimos.

Exemplo de aceite: pedido de €100, sinal de €50 e pagamento posterior de €50 deixam saldo zero; estorno de €10 reabre €10 sem apagar movimentos. Repetir a mesma confirmação não conta duas vezes.

Separar fluxo de caixa de resultado estimado. Compra de insumos, consumo na receita, despesas e custo do produto não podem ser contados duas vezes. O módulo não será apresentado como faturação fiscal certificada nem lucro líquido confiável enquanto custos e despesas necessários estiverem incompletos.

### PD-SAS-08 — Clientes

Nome, contato, moradas necessárias, pedidos da própria loja, preferências e notas com acesso controlado. WhatsApp em um clique, mediante ação da operadora. Consolidar duplicados com conferência; não unir pessoas entre lojas pelo telefone.

**Aceite:** cliente e pedidos da loja A são inacessíveis à B; editar contato não altera o registro histórico do pedido; exportação e eliminação observam a política de retenção definida para a operação.

### PD-SAS-09 — Configurações

Marca, logótipo, cor de destaque, moeda, fuso horário, contatos, horários, recolha/entrega, taxas, antecedência, capacidade e sinal. Padrão do piloto: EUR e Europe/Lisbon. Mudanças de moeda não convertem silenciosamente pedidos existentes.

**Aceite:** apenas função autorizada altera regras; valores inválidos são rejeitados; configurações refletem na vitrine e nas novas reservas sem reescrever pedidos anteriores.

## 6. Precificação e dados existentes

PD-GAB-06 permanece prioridade operacional. Manter fórmulas aprovadas e correções de ficha/rascunho. Modelar ingredientes, embalagens, despesas atribuídas, sub-receitas e rendimento com revisões; qualquer extensão de perda, trabalho ou impostos deve ser nomeada e validada com Gabriela.

A importação de dados comerciais exige conferência privada de origem, vínculos, unidades e valores. Apresentar prévia e permitir repetição sem duplicações, preservando os dados originais.

**Aceite:** casos reais representativos coincidem ao cêntimo; uma sub-receita não pode conter ciclo; alterações de custo atualizam estimativas, não preços de venda aprovados nem pedidos antigos sem confirmação.

<a id="plataforma-por-assinatura-para-outros-negócios"></a>

## 7. Isolamento e assinatura

### PD-SAS-10 — Fundação por loja

stores, membros e store_id obrigatório em dados operacionais. A URL pública inicial será /lojas/[slug]; subdomínios/domínios próprios são extensão posterior. Não aceitar uma loja apenas porque o usuário enviou seu ID ou porque o slug existe.

**Aceite de liberação para terceiros:** duas lojas fictícias; membro da A não lê nem altera produtos privados, receitas, clientes, pedidos, financeiro ou arquivos da B, inclusive por ID conhecido, API direta ou RPC. Relações entre registros de lojas diferentes são rejeitadas pelo banco.

### PD-SAS-11 — Assinaturas

Onboarding em três passos: conta, dados/marca da loja, primeiro produto/configuração de operação. Plano mensal/anual e direitos de uso mantidos no servidor. Stripe é candidato para a fase comercial europeia; Asaas/Mercado Pago permanecem alternativas para Brasil, sujeitas à região e ao escopo definido na integração.

Estado da assinatura não fica em coluna publicamente editável. Pagamento da mensalidade nunca registra um sinal de encomenda. Regras para teste, ativo, atraso e cancelamento precisam de transição, eventual carência e recuperação. Ao expirar, restringir escrita no Live Mode conforme regra definida; preservar leitura/exportação autorizada e dados existentes. A loja piloto pode ter direito interno explicitamente concedido no servidor.

**Aceite:** evento repetido ou fora de ordem não duplica cobrança/direito; retorno de checkout não ativa plano sozinho; uma loja não altera sua própria assinatura pela API; reativação preserva dados.

## 8. Automação futura

### PD-SAS-12 — WhatsApp e IA

Endpoints versionados e ferramentas com escopo de loja. Planejar áudio/texto da operadora para consultar faturamento, registrar encomenda ou ajustar estoque e relatório matinal com entregas, sinais e produção.

Vincular identidade da operadora por processo verificado. Texto de cliente não é comando administrativo. A IA não recebe chaves privilegiadas nem acesso SQL irrestrito; propõe ações validadas pelas mesmas regras dos módulos. Mudanças financeiras, exclusões e ações ambíguas exigem confirmação adequada.

**Aceite futuro:** repetição de mensagem não repete estoque/pagamento; loja e papel são verificados; comando de cliente é negado; falha de provedor não altera pedido; logs não expõem segredos ou dados pessoais desnecessários. Usar canal oficial como primeira opção de avaliação. n8n, OpenAI e Evolution API são referências possíveis, não integrações ativas ou já escolhidas.

## 9. Liberação e métricas

Etapa imediata é uma sequência de entregas pequenas: concluir validação operacional; Live Mode; decisão de framework e contexto por loja; pedidos; agenda; financeiro; CRM/configurações. Dependências em [Roadmap](ROADMAP.md). Implementar campos store_id antes de persistir os novos módulos e só vender a assinatura após comprovar o isolamento.

Medir tempo para cadastrar produto/produzir orçamento, pedidos confirmados por semana, erros de cadastro, reservas recusadas por falta de capacidade e saldo pendente. Levantar a linha de base; não inventar metas de conversão ou faturamento.

Critérios comuns: proteção no servidor e no banco, acessibilidade, seis larguras de tela, testes de concorrência e regressão, migração ensaiada, backup/restauração conferidos e evidências por ID. Execução do agente e aceite de Erick/liderança permanecem estados separados.

## Decisão de Erick · 20/11/2026 · Implementação autorizada

Manter React + Vite. A hipótese de migrar para Next.js fica encerrada: adicionar API segura compatível com Vercel e regras transacionais/RLS no Supabase. Gestly é a referência principal para distribuição de elementos, cartões, botões, ícones e navegação, preservando a identidade da Presente Doce. Erick autorizou executar o PRD e o backlog anterior. A referência deve ser verificada visualmente; não copiar ativos ou alegar integração sem teste. Acompanhar os IDs na Jornada de implementação integral do Daily Log.
