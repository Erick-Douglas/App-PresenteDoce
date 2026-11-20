# Roadmap — Plataforma híbrida

**20/11/2026 · Planejamento derivado do PRD 1.0.** As caixas abaixo representam implementação, não documentação pronta. Não há prazo de calendário ou preço de assinatura aprovado. O lote anterior publicado é o PR #19; as validações e pendências de operação permanecem no Daily Log da empresa.

## Etapa imediata — Uso próprio

| ID | Entrega verificável | Dependência/gate |
| --- | --- | --- |
| PD-GAB-06 | Validar fichas e fórmulas reais com Gabriela e preparar a importação conferida da planilha | Corrigir os dados incompletos antes de importar; preservar os cálculos e o catálogo |
| PD-ADM-01 / PD-UI-01 | Aceitar as correções web com o líder e conferir fotografia, teclado e navegação no aparelho de uso | Não confundir ensaio com mocks e autenticação real |
| PD-SAS-01 | Protótipo do tema branco/quente e componentes comuns | Preservar identidade e obter retorno de uso antes de revisar todas as páginas |
| PD-SAS-02 | Live Mode completo e Pré-visualizar como cliente | Permissões no servidor; rascunhos fora da prévia |
| PD-SAS-03 | Menu unificado e navegação dos módulos prontos | Evitar atalhos que simulem funções ainda ausentes |
| PD-SAS-10A | Decidir Vite + API versus Next.js por ensaio; migrar apenas se escolhido, preservando contratos/rotas | Preview com regressão, retorno de auth e plano de reversão; resolver cliente Capacitor |
| PD-SAS-10B | stores/membros/store_id, políticas, RPCs, Storage e backfill da Presente Doce | Ensaio com duas lojas e relações compostas antes de abrir qualquer outra loja |
| PD-SAS-04 | Modalidades e movimentos/reservas de estoque por item/opção | Contexto por loja e mutações atômicas |
| PD-SAS-05 | Pedidos/orçamentos persistentes com preço validado e idempotência | Base para agenda, CRM e financeiro |
| PD-SAS-06 | Agenda/capacidade e resumo de produção; demanda de ingredientes depois de fichas conferidas | Datas, fuso e reservas transacionais definidos |
| PD-SAS-07 | Sinal configurável, saldo, recebimentos, despesas e resultado estimado | Pedido e custo histórico; sem dupla contagem de pagamentos/custos |
| PD-SAS-08 / 09 | CRM e configurações de operação/marca | Isolamento por loja e projeção pública mínima |

- [ ] Aceite operacional das correções anteriores.
- [ ] Protótipo e Live Mode com prévia.
- [ ] Decisão de framework e fundação por loja ensaiadas.
- [ ] Pedido, estoque e capacidade concorrentes verificados.
- [ ] Agenda/produção, financeiro e CRM utilizáveis no celular.
- [ ] Importação de dados reais conferida e repetível.

Este encadeamento detalha a Etapa 1 fornecida por Erick. Não presume que ela inteira caiba numa única build. Recursos atuais continuam acessíveis enquanto novos módulos são integrados.

## Etapa comercial — Multi-loja e assinaturas

- [ ] PD-SAS-10: piloto com loja A e loja B fictícias, incluindo acesso direto a banco/RPC/Storage/cache.
- [ ] PD-SAS-11: onboarding em três passos e direitos de uso no servidor.
- [ ] Gateway escolhido para a região, ambiente de teste, webhook verificado, eventos duplicados e fora de ordem.
- [ ] Regras de carência, suspensão, reativação e preservação de dados exercitadas.
- [ ] Marca por loja e URL por slug; domínio próprio em entrega posterior.
- [ ] Backups restaurados em ensaio, privacidade, suporte e exportação definidos antes de vender o plano.

Não ativar cobrança, conectar credenciais novas nem contratar ferramentas com base apenas no PRD. A implementação usa as autorizações vigentes por alvo e os acessos necessários.

## Etapa futura — IA, WhatsApp e distribuição nativa

- [ ] PD-SAS-12: contratos versionados e ações com identidade verificada da operadora.
- [ ] Relatório matinal da loja, sinais e produção sem duplicidade de mensagens.
- [ ] Fluxos de áudio/texto com validação e confirmação proporcional à ação.
- [ ] Provedor/canal e tratamento de dados definidos antes de ativar automação.
- [ ] Android/iOS compilados, assinados e testados; distribuição sujeita às lojas.

## Continuidade do backlog anterior

PD-GAB-03 (galeria de modelos), PD-GAB-04 (massas/recheios) e restante de PD-GAB-05 (associações contextuais de categorias) não foram apagados nem declarados concluídos por esta mudança de visão. Conservar os IDs e priorizar junto do líder quando o lote começar.

## Definição de pronto por entrega

Briefing e critério por ID; implementação no repositório; migração em teste quando aplicável; testes automatizados e de fluxo com escopo explícito; preview; revisão; publicação autorizada; versão e reversão; retorno no Daily Log. A caixa de execução e o parecer Aceito são registros diferentes.

[PRD](PRD.md) · [Arquitetura](ARQUITETURA.md) · [Referências](REFERENCIAS-SAAS.md).
