# Changelog

## 20/11/2026 · Operação híbrida e módulos de gestão

- React/Vite mantido; tema claro com bordô da marca, componentes compartilhados, sidebar e atalhos móveis.
- Live Mode com edição contextual, disponibilidade/estoque no card e prévia como cliente.
- Encomendas e orçamentos persistentes, modalidades, preço validado no servidor, reserva de estoque/capacidade e resumo para WhatsApp.
- Agenda, produção consolidada, demanda de insumos e lista de compras.
- Financeiro com sinal, saldo, recibos, estornos, despesas e indicação de custos incompletos.
- CRM com histórico, preferências, arquivamento e união de duplicados.
- Configurações de marca/operação, galeria por categoria, massas/recheios e acréscimos.
- Ingredientes e sub-receitas vinculados às fichas, recálculo, proteção contra ciclos e confirmação de preço.
- Base por loja com RLS, relações compostas, Storage por pasta, API autenticada e rate limit no checkout.
- Criação comercial de lojas preparada e bloqueada por padrão na interface e no banco. Stripe Portugal/Europa fica para a próxima etapa, sem conta/preços ou cobrança.
- Sincronização das bases Capacitor Android/iOS; distribuição assinada permanece etapa própria.

Dados antigos da planilha não foram importados por suposição. Turnstile, proteção de senhas vazadas, credenciais Stripe/WhatsApp, aceite físico e lançamento comercial continuam identificados em [Implementação](docs/IMPLEMENTACAO.md) e [Integrações](docs/INTEGRACOES.md). [Evidência sanitizada](docs/validation/2026-11-20-platform.json).

Também foram reforçados: versão obrigatória nas alterações transacionais, sinal somente após confirmar a encomenda e atualização manual/periódica da gestão.
