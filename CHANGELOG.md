# Changelog

## 21/11/2026 · Consolidação documental e passagem para design

- PRD 2.0 consolida produto, escopo, papéis, módulos, regras atuais, arquitetura e etapas futuras.
- Mapa das 22 vistas, estados transversais e briefing para criação do Figma.
- Modelo ERS/SRS a preencher por Erick após o design; sem aprovação funcional presumida.
- Índice de fontes, Design System e roadmap organizados; relatórios históricos preservados e identificados.
- Código, migrações e dados não são alterados nesta entrega. O fechamento e o aceite separado ficam no Daily Log da empresa.


## 21/11/2026 · Personalizações independentes e checkout

- + inicia outro bolo; lápis edita a linha escolhida; combinações iguais somam e diferentes ficam separadas.
- Favoritos com guardar/remover, vidro transparente e retorno local no +; retirada a assistente e o badge Personalizável.
- Checkout compacto, ações superiores direitas, preço/quantidade e subtotal; nome, WhatsApp e nascimento opcional, editável no CRM.
- Retirada pintura da área superior e fundos de cabeçalhos no scroll; temas e área segura preservados.
- Migração aditiva de nascimento/RLS e Edge v7. 68 testes + jornadas reais de navegador em banco isolado.

[Critérios, evidência e limites](docs/CARRINHO-E-CHECKOUT.md).

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


## 21/11/2026 · Jornada e catálogo

Tópicos com criação/seleção direta e indicação do vínculo; ficha exibe os associados. Checkout preservado ao editar itens, endereço em campos próprios, agenda/capacidade agregada e cópia sem reserva. Compra/sacola compactas, navegação sem menu duplicado, retorno separado do favorito e módulos com hierarquia comum. Precificação em etapas. Índices para relações por loja. Testes integrados de persistência e compra. Limites/pendências em docs/CORRECOES-JORNADA-2026-11-21.md.



## 21/11/2026 · Grupos de escolha e encomendas

- Tópicos passam a grupos de compra com opções incluídas ou pagas, limites e herança de categoria/edição por produto. Preço recalculado no banco, rótulos históricos e compatibilidade dos produtos anteriores.
- Produto recupera escolhas/observações/quantidade da sacola e permite atualizar a mesma linha. Ficha sem disponibilidade/agendamento; checkout com data/hora, morada/recolha e mínimo de 48 horas. Pronta entrega preservada em standby.
- Menu no topo, ícones + consistentes, sacola compacta com ícone amarelo, feedback integrado, edição sobre a foto, títulos superiores e ações de edição padronizadas.
- Testes e detalhes em [Grupos e encomendas](docs/GRUPOS-E-ENCOMENDAS.md). Mantidas pendências de aceite visual, Auth nativo/CAPTCHA, receitas comerciais e teste físico.


## 21/11/2026 · Perfil, menu e modo escuro

- Avatar de conta no topo esquerdo, com escolha/troca/remoção de foto; menu no topo direito. Visitantes usam ícone e painel compacto, administração menu em viewport completo.
- Grupos com títulos externos, módulos em pílulas compactas, ícones suaves e edição de categoria maior com vidro. Partilha transferida para o menu.
- Claro/Escuro/Sistema em todas as páginas, preferência persistida, início sem clarão e tokens sem inversão de fotografias.
- Bucket próprio com RLS por utilizador, testes de perfil, modos e regressões de compra/gestão. [Detalhes](docs/PERFIL-E-APARENCIA.md).
