# Roadmap e pendências — Presente Doce

**Revisão de 21/11/2026 · Decisão de Erick: definir design e comportamento antes de retomar o desenvolvimento.**  
[PRD](PRD.md) · [Briefing Figma](BRIEFING-FIGMA.md) · [Mapa](MAPA-DE-TELAS.md) · [SRS](SRS.md)

## 1. Próxima sequência

| ID            | Entrega                                                | Responsável                                  | Estado / critério                                                                    |
| ------------- | ------------------------------------------------------ | -------------------------------------------- | ------------------------------------------------------------------------------------ |
| PD-DES-01     | Levantamento de telas/estados e arquivo Figma editável | Próximo agente de design, a ativar por Erick | Pendente; cobrir TEL/INT/CTX e ligar frames à matriz                                 |
| PD-DES-02     | Design aprovado de todas as páginas                    | Erick, com revisão operacional de Gabriela   | Pendente; componentes, variantes e fluxos, versão/data/links de aprovação            |
| PD-SPEC-01    | ERS/SRS de comportamento e interação                   | Erick                                        | Pendente; cada ação, dados, permissão, erro e aceite ligados a frames                |
| PD-DEV-RET-01 | Cruzamento PRD + Figma aprovado + SRS                  | Agente executor, na retomada                 | Aguardar novo comando; checklist por requisito, divergências e impactos              |
| PD-DEV-RET-02 | Implementação e validação da nova versão               | Executor, depois da definição do lote        | Testes completos de compra/gestão, preview, validação de Erick/Gabriela e publicação |

Esses IDs organizam a etapa nova; não substituem os IDs históricos de execução/correção. O app publicado permanece disponível. Não fazer novas mudanças funcionais apenas para cumprir uma proposta de Figma ainda em revisão.

## 2. Validações operacionais mantidas

| Referência                        | O que permanece aberto                                                                   | Próxima ação / responsável                                                                                         |
| --------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| PD-GAB-06 / PD-REV-08             | Comparação da precificação real ao cêntimo, qualidade dos dados e importação da planilha | Gabriela e Erick definem amostra privada; executor documenta diferenças, prévia/importação repetível após conferir |
| PD-ADM-01 / PD-GAB-02 a 05        | Aceite no aparelho e retorno operacional de cadastro/fotos/sessão/catálogo               | Gabriela usa os fluxos reais; registrar divergências com tela, ação, resultado esperado e observado                |
| PD-REV-02 / 03 / PD-OPT / PD-CART | Design e jornada ainda sem aceite final global                                           | Incorporar na revisão Figma/SRS, preservar testes e IDs anteriores                                                 |
| PD-REV-01                         | Auth nativo/CAPTCHA/configuração remota; dependências de acesso/plano                    | Erick disponibiliza o acesso necessário quando retomado; executor verifica diff e aplica somente escopo aprovado   |

Implementações e ensaios anteriores continuam registrados; uma caixa de execução concluída não equivale a aceite operacional. A nova UI não elimina a necessidade de conferir fórmulas, dados e permissões.

## 3. Base existente, sem nova ativação

Na base e79ff700: vitrine/edição contextual, grupos grátis/pagos, carrinho por configuração, checkout/WhatsApp, encomendas, agenda/produção, financeiro, CRM, fichas/ingredientes, configurações, perfil/temas e fundação por loja. Pronta entrega está preservada em standby. Há 68 testes da base e jornadas documentadas, com limites em [TESTES](TESTES.md).

A cobertura de arquitetura e código não autoriza declarar todos os módulos aceitos, ativar cadastro de terceiros ou vender assinaturas.

## 4. Etapas posteriores

| Referência              | Frente                                               | Dependência                                                                    |
| ----------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------ |
| PD-SAS-10               | Liberação multi-loja                                 | Isolamento/relações/API/Storage revisados, recuperação e operação de terceiros |
| PD-SAS-11               | Stripe Portugal/Europa e assinaturas                 | Conta, preços/regras, checkout/portal/webhooks e testes; nada cobrado agora    |
| PD-SAS-12               | WhatsApp Business/IA/n8n                             | Provedor/canal, identidade, regras, tratamento de dados, custos e autorização  |
| Contas de clientes      | Perfil, moradas, histórico e favoritos sincronizados | SRS, cadastro e acesso exclusivo aos próprios dados                            |
| Pronta entrega          | Estoque e venda imediata                             | Nova definição operacional antes de sair do standby                            |
| Distribuição nativa     | Android/iOS                                          | Build assinada, aparelho, permissões e publicação nas lojas                    |
| Pagamento de encomendas | Gateway para o consumidor                            | Escopo separado da assinatura; decisão e validação próprias                    |

[Integrações](INTEGRACOES.md) · [Segurança](SEGURANCA.md) · [Nativo](NATIVE.md)

## 5. Regra de retomada

Ler Contexto Geral vigente e o fechamento da empresa. Abrir nova entrada no Daily Log, manter IDs retomados e conferir a versão remota/local antes de editar. Usar somente frames e requisitos aprovados no lote; registrar perguntas abertas, sem preencher o parecer da liderança. A versão anterior deste roadmap permanece no histórico do GitHub.
