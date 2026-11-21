# Presente Doce

Plataforma de operação e vendas para confeitaria artesanal, com vitrine, encomendas pelo WhatsApp e gestão pelo celular. A Presente Doce é a loja piloto da evolução para Micro-SaaS vertical B2B.

[Loja](https://presente-doce.vercel.app/) · [Changelog](CHANGELOG.md) · [PRD](docs/PRD.md) · [Implementação](docs/IMPLEMENTACAO.md) · [Design System](docs/DESIGN_SYSTEM.md) · [Arquitetura](docs/ARQUITETURA.md) · [Testes](docs/TESTES.md) · [Segurança](docs/SEGURANCA.md)

React 19, TypeScript e Vite 6 no frontend; Vercel publica a build do GitHub. Supabase fornece Postgres, Auth, Storage e Edge Functions. A cópia local é o ambiente de desenvolvimento, sincronizado por commits com o repositório. React/Vite foi confirmado por Erick; não há migração para Next.js.

## Etapa vigente · 21/11/2026

Erick vai definir todas as páginas no Figma e escrever a especificação funcional antes da retomada do desenvolvimento. A base publicada serve ao levantamento; o novo desenho ainda requer aprovação. Comece pelo [índice dos documentos](docs/README.md), [briefing Figma](docs/BRIEFING-FIGMA.md), [mapa de telas](docs/MAPA-DE-TELAS.md) e [modelo ERS/SRS](docs/SRS.md).

## Operação

Entre pelo menu com a conta habitual. A vitrine ganha edição de produtos e categorias. A operação atual é somente por encomenda, com 48 horas de antecedência e data/hora no checkout. Pronta entrega fica em standby, com dados preservados. Pré-visualizar como cliente oculta a gestão sem encerrar a sessão. Pelo menu e atalhos, acesse Visão geral, Encomendas, Agenda e produção, Financeiro, Clientes, Catálogo, Precificação, Pronta entrega, Ingredientes e Configurações.

Pedidos públicos são registrados e validados antes de abrir o WhatsApp; aguardam confirmação da loja. Orçamento não reserva até ser confirmado. Pagamento é registro separado. Taxa de entrega não definida aparece como valor a combinar.

Grupos de escolha são geridos na categoria ou personalizados por produto, com opções gratuitas/pagas e limites. [Funcionamento e critérios atuais](docs/GRUPOS-E-ENCOMENDAS.md).

## Rotas

| Rota | Uso |
| --- | --- |
| / | Loja piloto e entrada pelo menu |
| /admin | Atalho de acesso/recuperação existente |
| /precificacao | Precificação autenticada |
| /lojas/slug | Vitrine e gestão isoladas por loja |
| /criar-loja | Onboarding preparado; desativado até a etapa comercial |

## Desenvolvimento e publicação

Node.js 24 e npm. Execute npm ci, npm run dev, npm run lint, npm test, npm run check:catalog e npm run build. Para navegador: npm run preview e, noutro terminal, node tests/admin-workflows.mjs, node tests/public-layout.mjs e node tests/buyer-admin-flows.mjs. Chrome/Playwright são necessários nos ensaios de UI; leia [TESTES](docs/TESTES.md).

Copie .env.example para o ambiente local ignorado. O browser recebe somente URL/chave publicável do Supabase. Nunca use service_role ou secrets em VITE_* ou no Git. As migrações em supabase/migrations devem ser aplicadas em ordem a um banco de teste antes do projeto de operação. Depois publique store-api com os arquivos Deno; ela faz autenticação própria e admite o checkout público.

A associação atual de gestão é store_members, com owner/manager e entitlement. catalog_admins foi preservada apenas como legado da migração. Não a use como fonte para conceder novos acessos. O cliente não pode promover seu papel.

A instalação PWA segue as permissões do navegador. As bases [Capacitor](docs/NATIVE.md) permitem continuar para Android/iOS, com build assinada e teste físico em etapa própria.

## Próxima etapa

Stripe Portugal/Europa confirmada, sem conta/preços configurados e sem cobrança ativa. WhatsApp/n8n ainda sem provedor. [Integrações](docs/INTEGRACOES.md). A importação da planilha antiga depende de conferir dados comerciais; nenhuma fórmula financeira foi substituída por suposição. [Precificação](docs/PRECIFICACAO.md).

[Deploy e reversão](docs/DEPLOY.md) · [Roadmap e pendências](docs/ROADMAP.md) · [Referências](docs/REFERENCIAS-SAAS.md).


## Perfil e aparência

O avatar fica à esquerda e o menu à direita. Em Perfil e aparência, escolha Claro, Escuro ou Sistema; a conta autenticada pode configurar sua fotografia. [Contrato e segurança](docs/PERFIL-E-APARENCIA.md).
