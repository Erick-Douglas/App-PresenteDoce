# Perfil, navegação e modo escuro · 21/11/2026

## Decisões aprovadas por Erick

- Avatar circular de 40 px à esquerda do cabeçalho, menu à direita. Ícone UserRound quando não há foto ou sessão. A fotografia pertence à conta, não à marca da loja.
- Visitante mantém painel compacto de 300 px à direita; gestão abre um menu que ocupa o viewport. Em tablet/desktop, os grupos distribuem-se em colunas. Voltar continua no cabeçalho dos módulos, antes do menu.
- Títulos de grupo fora dos cartões. Cada módulo usa uma pílula com ícone em superfície suave e texto, cerca de 52 px de altura em celular. Alvo de toque preservado. Partilhar catálogo passa ao menu. Ao fechar perfil/menu com Esc ou o botão de fechar, o foco retorna ao controle que abriu o diálogo; fechar nativamente antes de desmontar o componente.
- Edição de categoria: alvo 48 px, ícone 26 px, maior que o produto (44 px/19 px). Ambos usam fundo translúcido, blur e contorno de vidro.
- Perfil e aparência oferece Claro, Escuro e Sistema. Sistema é o padrão. A escolha é guardada neste navegador/dispositivo; não altera o tema de outros utilizadores nem as cores gravadas da loja.

## Referências locais

IMG_2468.jpg, IMG_2469.PNG e IMG_2470.PNG, recebidos durante esta sessão: Mobius como referência de avatar, fundo grafite, superfícies por níveis e contraste. Prints Gestly como referência de títulos de grupo, ícones e módulos. Coffee mantém a composição da vitrine. Somente a composição visual foi utilizada; fotografias pessoais, valores e dados das capturas não foram copiados para o produto ou repositório.

## Um tema em todo o aplicativo

A paleta de ambos os modos está em src/design-system/tokens.css. appearance.css define composição do perfil, menu e tratamentos compartilhados. As demais folhas usam tokens para superfícies, bordas, texto, vidro, estados de sucesso/aviso/erro. Manter fotografias sem filtros de inversão. O bordô de ação permanece a cor da loja; o texto de destaque usa brand-ink para legibilidade no fundo escuro.

public/theme-init.js aplica a preferência antes do React e das folhas de estilo; usa somente armazenamento local e a preferência do dispositivo. AppearanceProvider acompanha alterações do sistema e de outras abas e aplica color-scheme aos campos nativos. Funciona também com armazenamento bloqueado (preferência em memória). A cor de navegação considera o tema e a posição da página.

## Conta e proteção da fotografia

Clique no avatar ou em Perfil e aparência. Na conta autenticada: nome do perfil, selecionar/remover foto e Guardar perfil. O arquivo é decodificado, convertido em JPEG/WebP e reduzido a até 512 px antes de enviar; nenhuma imagem SVG é aceita. O bucket dedicado account-avatars limita 2 MB e tipos de imagem. Objetos usam auth.uid()/UUID.webp ou .jpg. Cada conta só grava, lê metadados e apaga na própria pasta. Tokens de utilizadores anônimos são recusados no upload. A URL da imagem é pública, com nome aleatório; e-mail e dados da conta continuam privados.

Nome e avatar_path ficam nos metadados da própria conta pelo endpoint de Auth, com JWT do utilizador. Metadados de perfil **não concedem administração**, não mudam store_members nem o escopo da loja. O cliente só exibe caminhos da pasta da própria identidade verificada. Ao falhar a gravação dos metadados, tenta remover o novo arquivo; ao substituir/remover foto, tenta limpar o arquivo anterior. Uma falha de limpeza não desfaz um perfil já gravado; eventual objeto órfão deve ser removido pelo proprietário/rotina autorizada, sem ampliar permissões.

A estrutura do perfil é genérica para futuros clientes autenticados. Nesta etapa, o fluxo de entrada continua reservado aos administradores existentes; cadastro de clientes, onboarding comercial e assinaturas não foram ativados. Não confundir clientes do CRM com contas Auth cadastradas.

## Evidências e limites

Migração aditiva account_avatars, versão 20261121164842. Não modifica produtos, pedidos, preços, prazos ou dados de clientes. Mantidas encomendas com 48 horas, grupos de opções e checkout.

66 testes Node/SQL aprovados, incluindo isolamento de avatar, conta permanente, tipos/tamanho de bucket e impossibilidade de promover acesso à loja. A jornada appearance-journey usa navegador, processamento real da imagem e regras de Storage em PostgreSQL isolado; identidade/metadados Auth e transporte são simulados. Confere upload, troca, remoção, persistência, recuperação após falha e estado inicial escuro antes do React. Dez módulos administrativos em dois temas e quatro larguras; textos essenciais, estados e botões conferidos por contraste. public-layout acrescenta produto, carrinho, login e guardas em seis larguras; modifier-journey valida compra/checkout em tema escuro, além da regressão clara.

Fotos/capturas de ensaio ficam no cache ignorado. Não houve troca da foto da conta real, upload de teste em produção nem encomenda/mensagem de teste. Auth real/SMTP/CAPTCHA, proteção nativa de senhas vazadas Pro, receitas comerciais e testes físicos mantêm as dependências registradas. Evidência do executor não substitui aceite visual/liderança.

[Preferência de cor no navegador](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-color-scheme) · [Dados do utilizador no Supabase](https://supabase.com/docs/reference/javascript/auth-updateuser) · [Controle de acesso no Storage](https://supabase.com/docs/guides/storage/security/access-control).
