# Changelog

## 21/11/2026 · Compra, gestão e refinamento visual

- Sacola fixa restaurada no Live Mode e compra no produto acima da navegação inferior. Botões explícitos, unidades acrescentadas e opções/sabores validados.
- Menu em grupos, cabeçalhos/ações à direita, ícones neutros e cores semânticas compartilhadas.
- Faixa pública de tópicos removida; associações de gestão preservadas.
- Financeiro com descrição livre, encomendas elegíveis, edição e exclusão auditadas, sem checkbox.
- Encomendas com estados agrupados, pronta entrega compacta e configurações expansíveis.
- Seletores ancorados e prévia/validação de cor da loja.
- Headers e testes de segurança; auditoria de dependências sem achados conhecidos. Plano gratuito mantido; configuração nativa Auth preparada, pendente da sessão administrativa da CLI.

[Revisão e validação](docs/REVISAO-2026-11-21.md) · [Segurança](docs/SEGURANCA.md).


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
