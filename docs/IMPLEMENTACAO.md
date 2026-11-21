# Implementação da plataforma · 20/11/2026

Esta entrega mantém React 19 + Vite 6, GitHub, Vercel e o projeto Supabase existente. A loja piloto continua no domínio oficial. O código local é a cópia de desenvolvimento; o GitHub recebe a versão revisada e a Vercel publica a build desse commit. Não são duas lojas.

## Funcionalidades implementadas

| Requisito | Entrega |
| --- | --- |
| PD-SAS-01/02/03 | Tema branco e neutro quente, bordô da marca, componentes comuns, menu de gestão, atalhos no celular, edição contextual e prévia de cliente. Disponibilidade e estoque ajustáveis no card da vitrine. |
| PD-SAS-04/05 | Modalidades por item, estoque por opção, pedidos e orçamentos persistentes, totais calculados no servidor, referência e mensagem WhatsApp, idempotência e custo histórico. |
| PD-SAS-06 | Calendário, bloqueio de datas, capacidade diária, unidades por produto, produção diária/semanal e demanda consolidada de ingredientes/compras. |
| PD-SAS-07 | Sinal configurável, saldo, recebimento, estorno, despesa, caixa mensal e margem estimada com custo conhecido. Não apresenta lucro completo quando faltam custos. |
| PD-SAS-08 | Clientes, notas, morada, histórico, WhatsApp, arquivamento e união explícita de duplicados. Snapshots dos pedidos são preservados. |
| PD-SAS-09 | Nome, logótipo, cor, moeda, fuso, contactos, horários, antecedência, capacidade, sinal e entrega; opções de massas/recheios e galeria ordenada por categoria. |
| PD-SAS-10 | stores/membros/entitlements, store_id obrigatório, relações compostas, RLS, Storage por pasta de loja e rota /lojas/slug. A conta existente foi preservada. |
| PD-GAB-03/04/05 | Galeria por categoria, massas/recheios gerenciáveis com acréscimos, criação de produto na categoria e transferência de produto existente. |
| PD-GAB-06 | Ingredientes e sub-receitas vinculados às fichas, recálculo de custos, proteção contra ciclos, aplicação de preço confirmada e lista de compras. Importação antiga permanece uma etapa de conferência. |

## Uso inicial por Gabriela

1. Entrar pelo menu com a conta habitual.
2. Em Configurações da loja, conferir antecedência, capacidade diária, sinal e taxa de entrega. Os valores iniciais de capacidade/antecedência são padrões editáveis; não representam uma medição da operação.
3. Em cada produto, escolher Encomenda e/ou Pronta entrega. Ajustar unidades disponíveis na vitrine ou no módulo Pronta entrega.
4. Pedidos enviados pela vitrine ficam A confirmar. Conferir data, disponibilidade e eventual taxa de entrega antes de confirmar.
5. Registrar recebimentos efetivos no Financeiro, diferenciando sinal, saldo e estorno. Abrir o WhatsApp não registra pagamento.
6. Cadastrar insumos e vincular nas fichas. A produção e a lista de compras indicam fichas ausentes em vez de inventar custos.

O orçamento não reserva capacidade/estoque até a confirmação. Solicitações públicas reservam por 30 minutos; expiração libera uma vez. A confirmação deve reconferir disponibilidade. Produtos concluídos continuam contando na produção daquele dia. Cancelamento não devolve dinheiro automaticamente. Um pedido com taxa desconhecida mostra subtotal e exige definir a taxa antes de confirmar a entrega. Pronta entrega é para o dia corrente; quando houver antecedência, combine-a em pedido separado.

## Arquitetura e segurança

- API de mutações em supabase/functions/store-api. A Edge Function verifica o JWT junto ao Auth e a função de gestão da loja. Mutações administrativas usam o JWT do utilizador, preservando RLS. A chave service_role existe apenas no runtime gerenciado, nunca no bundle.
- O pedido público passa por validação Zod, limite de corpo/tempo/origem e contador distribuído no Postgres. Limites iniciais: 20 tentativas por IP/loja e 300 por loja em 10 minutos. A RPC pública de checkout só concede EXECUTE ao service_role; o visitante não contorna a API.
- Preços, acréscimos, estoque e capacidade são conferidos no banco, com locks e idempotência. Histórico financeiro é imutável; estorno é novo lançamento. Relações compostas impedem referências entre lojas.
- Todas as 17 tabelas públicas têm RLS. Funções privilegiadas têm search_path vazio, permissões explícitas e validação da associação/plano.
- Uploads reprocessados para WebP/JPEG, máximo final de 2 MiB; origem pode ter até 20 MiB para compressão. Storage exige pasta da loja. Caminhos legados catalog/ continuam exclusivos do piloto.
- Configuração pública e disponibilidade são projeções intencionais, sem CRM, finanças ou receitas. Os avisos de SECURITY DEFINER dessas projeções/RPCs são documentados; não se remove autorização para silenciar o linter.
- Autenticação continua com limites do Supabase, renovação de sessão e opção de lembrar a conta. A proteção contra senhas vazadas continua desativada no provedor e o Turnstile depende da configuração do serviço. Não foram declarados ativos.

As tabelas privadas de administradores legados e contadores não têm política de acesso do cliente de propósito. [Aviso de RLS sem política](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [RPC pública privilegiada](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [RPC autenticada](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable) e [proteção de palavras-passe](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Preparado para a próxima etapa

Erick confirmou Stripe para Portugal/Europa, ainda sem conta ou preços. Não há cobrança ativa. Entitlements internos preservam o piloto; trial/active permitem escrita, past_due/canceled/expirado preservam consulta e exportação, bloqueando mutações.

O onboarding está implementado em /criar-loja e fica desativado por padrão (VITE_ENABLE_ONBOARDING=false e bloqueio no banco (presente_doce_private.platform_config.onboarding_enabled=false)). Liberar somente com cadastro/retorno de e-mail conferidos, segunda loja aceita e condições comerciais definidas. A função create_store exige autenticação, limita três lojas por conta e cria avaliação de 14 dias. Não concede acesso à loja piloto.

A automação futura usa os contratos de store-api, incluindo report.daily com sessão autenticada e escopo de loja. Não existe provedor WhatsApp/n8n conectado. Nenhuma mensagem automática foi enviada e nenhum segredo novo foi criado. [Plano de conexão](INTEGRACOES.md).

## Validação e limites

Ensaios de Postgres local aplicam todas as migrações do zero, com usuários/lojas fictícios. Testam preços, reserva, capacidade, ledger, links/ciclos de fichas, isolamento e acesso anônimo. A API real e o Postgres hospedado passaram em testes de última unidade e capacidade simultâneas, preço canônico, idempotência, fronteira entre lojas e JWT inválido. Fixtures remotas foram removidas: a base voltou a uma loja, 15 produtos, zero pedidos e zero clientes de teste.

A suíte de navegador usa API isolada para criação, reabertura, imagens, tópicos, login e gravações dos módulos. Seis larguras de 320 a 1920 px. Esses ensaios não equivalem à operação física por Gabriela. A conferência dos dados antigos da planilha e o aceite da operadora permanecem separados.

As bases Capacitor continuam compatíveis com o frontend estático/API. Não há APK/IPA assinado nem publicação em loja de apps nesta entrega. São necessários SDKs, conta de distribuição e teste em aparelho. O snapshot de gestão atende o piloto; paginação de grandes históricos, métricas e políticas de retenção devem ser dimensionadas antes do lançamento comercial em volume.

## Recuperação

Backup privado anterior à migração em .local-backups/20261120-before-stores, ignorado pelo Git. Aplicação completa das migrações testada em banco local independente. Para falha de UI, voltar ao deploy anterior; migrations e novos registros exigem recuperação própria. Não apagar tabelas ou restaurar dados antigos por cima de encomendas novas. O frontend anterior continua lendo a loja piloto sem x-store-id.

Recebimentos exigem encomenda confirmada: uma reserva pública temporária não pode receber sinal e depois expirar. O seed versionado contém campos de contacto vazios; o projeto operacional foi configurado privadamente. O arquivo SQL aplicado com os valores de operação fica apenas no backup local ignorado.

A gestão atualiza ao abrir um módulo, ao recuperar a ligação/visibilidade e a cada minuto enquanto visível. Há Atualizar manual. Respostas de sessões anteriores são descartadas. Versão esperada é obrigatória nas alterações transacionais.
