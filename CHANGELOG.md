# Changelog da Presente Doce

## 20/11/2026 · Correções após fiscalização

- Limpar o rascunho abre uma nova ficha e preserva a ficha já guardada. Receitas incompletas são recusadas pelo app e pelo banco. A confirmação de preço continua separada.
- A fotografia selecionada é a mesma fonte da prévia e do upload. Rejeitar uma substituição acima do limite mantém a foto anterior com aviso explícito.
- Tópicos públicos são carregados e filtram produtos da categoria. Criar um tópico dentro da edição também o associa ao produto ao guardar. IDs estáveis preservam renomeações.
- Campos e painéis se adaptam às telas estreitas; em 320 px os produtos e resultados usam uma coluna.
- Ensaios reproduzíveis de navegador e banco com dados fictícios, limites e evidência estão em [Testes](docs/TESTES.md).

## 20/11/2026

### Correções operacionais

- Todos passa a ser a primeira categoria e a seleção da abertura. O catálogo inicial mostra grupos de produtos das várias categorias.
- Login por e-mail com mostrar senha, e-mail lembrado e opção de manter sessão. A sessão é restaurada e renovada pelo Supabase, com tratamento de expiração, falha de rede e logout.
- Upload com prévia, compressão para WebP ou JPEG, limite de tamanho, progresso e erro visível. Uma falha preserva os dados do formulário para nova tentativa. Políticas de armazenamento e validação de caminhos foram normalizadas.
- Precificação permite associar produto e opção, guardar várias fichas na conta e aplicar um preço ao catálogo mediante confirmação e controle de versão.
- Planilha analisada em leitura: 26 abas, 62 ingredientes e 21 fichas. Inconsistências registradas em [Precificação](docs/PRECIFICACAO.md); dados existentes ainda não importados.
- Bases Android/iOS, ícones da marca e comandos de sincronização adicionados. [Compilação e pendências nativas](docs/NATIVE.md).

### Verificação

- TypeScript, build e 18 testes automatizados aprovados.
- Fluxo real em navegador a 390 px e 1440 px: autenticação, renovação após recarga, criação/edição de rascunho com fotografia, erro de upload e nova tentativa, isolamento de rascunhos, persistência da ficha e aplicação de preço.
- Dados e imagens de teste removidos após o ensaio. Produtos publicados existentes preservados.
- HEIC em iPhone físico, retorno de autenticação no app nativo e binários assinados continuam pendentes. Galeria de bolos, gestão completa de massas/recheios e associações contextuais de categorias seguem no backlog.


## 13/11/2026

### Entregas da sessão

- Vitrine com topo bordô, busca translúcida, marca principal, cartões de produto mais compactos e categorias na ordem da gestão. A primeira categoria abre selecionada. **Todos** agrupa os produtos por categoria.
- **Todas as categorias** mostra um mapa administrativo. Gerir catálogo, Novo produto, editores, Precificação e Textos da loja têm páginas próprias e componentes do mesmo tema.
- **Contactos** fica abaixo de **Sobre nós**. O assistente aparece para visitantes, recolhe para a foto na primeira interação e permite preparar uma mensagem para confirmar no WhatsApp.
- Presente dourado sobre fundo bordô opaco no favicon, no ícone de instalação e na imagem Open Graph. O compartilhamento usa o título Presente Doce, uma descrição da confeitaria artesanal e o link oficial.
- **Menu → Instalar app** abre o pedido nativo quando disponível e mostra os passos do navegador nos demais casos. A instalação usa o nome **Presente Doce** e abre em modo independente. A área de status começa em bordô na home e passa a translúcida durante a rolagem no modo instalado compatível.
- Botões de edição, quantidade, carrinho, precificação, navegação e formulários usam o tema compartilhado. Os cálculos e a confirmação da encomenda pelo WhatsApp continuam a usar o fluxo existente.

### Ajuste final de instalação

- O menu público mostra **Instalar app** quando o navegador pode abrir a confirmação nativa e **Como instalar** quando o processo depende do menu do navegador. A opção fica oculta na sessão administrativa e no app instalado.

### Pendências para a próxima sessão

- Conferir a instalação e a aparência da área de status num iPhone e num Android físicos. Confirmar também a prévia ao partilhar no WhatsApp e a operação com a conta real de Gabriela.
- Confirmar o endereço oficial do TikTok, a regra de entrega e a configuração de cadastro público, recuperação de senha e Turnstile.
- O chat dentro da loja e o indicador de categorias excluídas dependem, respectivamente, de um canal de atendimento próprio e do histórico de exclusões.
- A precificação guarda o rascunho no navegador. A validação com a planilha e o armazenamento compartilhado de receitas continuam no escopo de evolução.
