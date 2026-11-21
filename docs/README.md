# Documentação do aplicativo

**Índice consolidado em 21/11/2026.** Próxima fase: design no Figma e especificação funcional por Erick. A base publicada é referência de levantamento; o novo design ainda não tem aceite.

## Começar aqui

1. [PRD](PRD.md): o que é o app, por que existe, público, regras, módulos, limites e evolução.
2. [Briefing Figma](BRIEFING-FIGMA.md) e [mapa de telas](MAPA-DE-TELAS.md): passagem para o próximo agente, páginas/estados e critérios de entrega.
3. [Design System](DESIGN_SYSTEM.md): identidade, tokens e componentes existentes a revisar.
4. [ERS/SRS](SRS.md): modelo para Erick escrever o comportamento depois do Figma.
5. [Roadmap](ROADMAP.md): pendências, responsável e ordem de retomada.

## Guias técnicos e contratos da base

São referências da implementação existente; não representam aprovação final da interface. Decisões novas devem ser versionadas no PRD/SRS e refletidas no guia correspondente.

| Documento                                     | Uso                                                                |
| --------------------------------------------- | ------------------------------------------------------------------ |
| [Arquitetura](ARQUITETURA.md)                 | Camadas, multi-loja, dados, rotas e transações                     |
| [Grupos e encomendas](GRUPOS-E-ENCOMENDAS.md) | Herança de opções, adicionais, mínimos/máximos e 48 horas          |
| [Carrinho e checkout](CARRINHO-E-CHECKOUT.md) | Linhas por configuração, favoritos, checkout e nascimento opcional |
| [Perfil e aparência](PERFIL-E-APARENCIA.md)   | Avatar, menu, temas e limites de segurança                         |
| [Precificação](PRECIFICACAO.md)               | Fórmulas, ficha guardada, publicação e dados antigos pendentes     |
| [Segurança](SEGURANCA.md)                     | Controles configurados/testados e dependências ainda abertas       |
| [Deploy e reversão](DEPLOY.md)                | Ambientes, configuração e histórico de publicação                  |
| [Testes](TESTES.md)                           | Suítes, execução e limites de evidência                            |
| [Nativo](NATIVE.md)                           | Capacitor e etapas de distribuição ainda necessárias               |
| [Integrações](INTEGRACOES.md)                 | Stripe/WhatsApp/IA; preparação separada de ativação                |

## Registros históricos e pesquisas

Preservados no caminho original para manter links e rastreabilidade. Descrevem o estado observado na data; adendos antigos podem ter sido substituídos pelas decisões consolidadas.

| Documento                                               | Data/escopo                                              |
| ------------------------------------------------------- | -------------------------------------------------------- |
| [Implementação](IMPLEMENTACAO.md)                       | Entregas operacionais e limites registrados nas revisões |
| [Pesquisa inicial](pesquisa.md)                         | Diagnóstico e pesquisa de 11/11; contexto original       |
| [Referências SaaS](REFERENCIAS-SAAS.md)                 | Pesquisa de mercado e propostas de 20/11                 |
| [Revisão](REVISAO-2026-11-21.md)                        | Achados e entrega da revisão PD-REV                      |
| [Correções de jornada](CORRECOES-JORNADA-2026-11-21.md) | Registro de correções antes dos grupos atuais            |
| [Evidências sanitizadas](validation/)                   | JSON de cada entrega, com escopo, base e resultados      |
| [Changelog](../CHANGELOG.md)                            | Histórico do que foi alterado por versão                 |

## Organização e precedência

PRD: produto/escopo. Figma aprovado: composição visual. SRS aprovada: comportamento verificável. Código/migrações: implementação existente. Daily Log: execução/parecer. Em divergências, registrar a decisão de Erick e atualizar as fontes afetadas; a ordem de edição de um arquivo não decide o requisito.

O par departamental fica na raiz da empresa. O Word original de Gabriela e dados da planilha permanecem no diretório privado; não copiar dados operacionais/credenciais para este repositório público.

Nenhum arquivo foi removido para esta consolidação. Fontes anteriores substituídas no PRD/Design System/Roadmap permanecem no histórico Git. O novo Figma e a SRS preenchida serão entregas posteriores, não concluídas por este índice.
