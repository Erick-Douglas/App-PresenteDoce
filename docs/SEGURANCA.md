# Segurança e estado da configuração

Revisão de 21/11/2026. Nenhuma proteção elimina todo o risco. Os testes abaixo distinguem código aplicado, serviço hospedado e configuração ainda dependente de acesso.

| Camada | Estado verificado |
| --- | --- |
| Aplicação | HTTPS, CSP, bloqueio de frames/objetos, nosniff, política de referência e permissões; HSTS e isolamento de janela na publicação desta revisão. |
| Gestão | JWT validado pelo Auth, associação owner/manager e escopo de loja conferidos; mutações encaminham o JWT do utilizador e mantêm RLS. |
| Dados | RLS em 17 tabelas públicas, relações por loja, grants explícitos e funções privilegiadas com search_path vazio. Sem leitura pública de CRM, financeiro ou fichas. |
| Checkout | Contratos Zod, corpo até 64 KiB, preço no servidor, reserva concorrente, idempotência e quota distribuída: 20 tentativas por IP/loja e 300 por loja em 10 minutos. |
| Financeiro | Correção/exclusão lógica com versão, bloqueio da encomenda, trilha de auditoria e recálculo de saldo; sem DELETE/UPDATE direto do cliente. |
| Fotografias | Validação e reprocessamento, limite final de 2 MiB e Storage separado por pasta da loja. |
| Sessão | Renovação, saída, opção de persistência e bloqueio de submissão simultânea; tratamento de 429/Retry-After. Não guardar senhas. |
| Dependências | Auditoria npm desta revisão: nenhuma vulnerabilidade conhecida reportada. Resultado não equivale a auditoria independente. |
| Senhas vazadas | Indisponível no plano gratuito. Erick decidiu mantê-lo nesta etapa; não houve contratação nem ativação declarada. |
| CAPTCHA | Componente preparado, sem widget/chaves do provedor. Não ativado no Auth. |
| Política nativa de Auth | Arquivo parcial supabase/config.jsonc validado localmente. Aplicação hospedada depende de sessão administrativa da CLI; o conector atual não oferece escrita de Auth e a CLI retornou AccessTokenRequiredError. |

A recuperação pela interface já exige ao menos 12 caracteres. Isso não prova que o mesmo mínimo esteja configurado no provedor. O arquivo preparado define esse mínimo no Auth, fecha novos cadastros/logins anônimos, conserva renovação, usa o domínio oficial na recuperação e define limites explícitos de autenticação. Exige a senha atual para mudanças normais; o fluxo de recuperação permanece previsto pelo provedor. Não altera SMTP ou habilita um recurso pago.

Com a CLI autenticada, revisar primeiro o diff do projeto dedicado; publicar somente os campos esperados e conferir login, recuperação e respostas do provedor. CLI 3.1+ lê JSONC e preserva recursos não declarados. Nenhuma chave privada deve entrar no arquivo. O estado preparado não deve ser descrito como configuração já ativa.

## Verificação

A suíte de contratos testa ausência de autenticação/permissão, origem indevida, preço inserido pelo navegador, payload inválido, corpo excedido e rate limit. PostgreSQL isolado aplica as migrações completas e testa isolamento de lojas, planos, histórico e concorrência. O ensaio buyer-admin-flows executa o código real da Edge Function e SQL; somente a identidade Auth é simulada.

No banco hospedado, uma transação descartável conferiu criação canônica, correção/exclusão financeira, conclusão simplificada e bloqueio do contador após o limite. Todas as escritas de teste foram revertidas. Não foram usados dados reais de clientes ou enviados e-mails/WhatsApps.

Os avisos de SECURITY DEFINER das projeções públicas de configuração/disponibilidade são intencionais: retornam apenas campos da vitrine. As RPCs de gestão verificam associação/escopo. Tabelas do esquema privado sem políticas do cliente permanecem inacessíveis por padrão. Esses avisos continuam documentados; não foram silenciados com permissões amplas.

[Senhas no Supabase](https://supabase.com/docs/guides/auth/password-security) · [CAPTCHA](https://supabase.com/docs/guides/auth/auth-captcha) · [Configuração da CLI](https://supabase.com/docs/guides/local-development/cli/config) · [Formato e aplicação parcial](https://supabase.com/docs/guides/local-development/cli/config-formats) · [Avisos de funções públicas](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable) · [Funções autenticadas](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).

## Limite de entrada e relay · 21/11/2026

O teste hospedado identificou timeout de resposta ao recusar corpos grandes no relay de Edge Functions, semelhante ao [relato upstream](https://github.com/supabase/edge-runtime/issues/737). O handler mantém teto de bytes e prazo de leitura de dez segundos; não aguarda cancelamento indefinido. Essa correção local não provou corrigir o transporte gerenciado.

O web app passa suas mutações por /api/store na Vercel: limite de 64 KiB antes do encaminhamento, prazo de leitura, origem, encaminhamento do JWT e IP controlado pela Vercel, timeout do upstream e erros sem detalhes privados. Continua sem service_role na Vercel ou no navegador. A autorização, os preços e as quotas continuam no backend/RLS. Clientes locais/nativos preservam o caminho direto com limite no cliente. O endpoint direto do Supabase ainda depende do relay do provedor para entregar a resposta de rejeição; não alegar que o transporte upstream foi corrigido.

A API hospedada também recusou leitura anônima de clientes, pedidos, movimentos e fichas, JWT inválido, origem externa e preço inserido no payload. A consulta pública de Auth confirmou cadastro nativo ainda habilitado: desativá-lo depende da conexão administrativa solicitada. O onboarding comercial do aplicativo segue fechado no frontend e no banco.


## Avatar da conta · 21/11/2026

Bucket account-avatars separado do catálogo, 2 MB, JPEG/PNG/WebP, caminho por auth.uid() e UUID. Políticas de escrita/remoção limitadas ao dono, upload de conta anônima recusado. Metadados de perfil servem somente à apresentação; não concedem papel. [Segurança, limpeza e limites de evidência](PERFIL-E-APARENCIA.md).
