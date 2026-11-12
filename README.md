# Presente Doce

Loja online de encomendas de confeitaria artesanal, com catálogo, carrinho, confirmação pelo WhatsApp e gestão móvel do catálogo.

[Loja](https://presente-doce.vercel.app/) · [Painel da confeitaria](https://presente-doce.vercel.app/admin) · [PRD](docs/PRD.md) · [Deploy e reversão](docs/DEPLOY.md) · [Pesquisa](docs/pesquisa.md)

## Arquitetura

O app web usa React, TypeScript e Vite. A Vercel publica o frontend. O Supabase guarda produtos e imagens e autentica a conta administrativa. O painel e a loja consultam o mesmo catálogo em produção. O checkout encaminha os dados da encomenda para o WhatsApp.

| Rota | Uso |
| --- | --- |
| `/` | Catálogo, encomendas por WhatsApp e acesso pelo menu **Entrar**. A conta administrativa recebe ferramentas de gestão na loja. |
| `/admin` | Atalho para abrir o acesso na própria loja, incluindo os links de recuperação já usados. |
| `/precificacao` | Atalho autenticado para o simulador de custo e margem com rascunho local. |

A produção fica em `presente-doce.vercel.app`. A Vercel protege os endereços de preview para revisão. Na loja oficial, use **Menu → Entrar** e a conta da confeitaria. A página inicial saúda Gabriela após a autenticação. **Gerir catálogo** abre uma página com produtos agrupados por categoria e filtros de estado. O editor de categoria gerencia o nome, os tópicos e a ordem da vitrine. A conta administradora também pode editar produtos e categorias diretamente na vitrine.

## Desenvolvimento

Use Node.js 24 e npm.

~~~sh
npm ci
npm run dev
npm run lint
npm test
npm run check:catalog
npm run build
~~~

A raiz abre o catálogo. O formulário de entrada informa quando falta configurar o Supabase. O catálogo inicial em código fica ativo até selecionar explicitamente o catálogo do Supabase no ambiente. Com o catálogo Supabase ativo, erros de carregamento aparecem na loja para evitar voltar a apresentar produtos que Gabriela retirou do catálogo.

A rota /precificacao abre o simulador de receitas. O cálculo reproduz custo, rendimento, lucro, markup e margem da planilha. O rascunho é guardado apenas no navegador se a pessoa usar a opção de guardar. O simulador é independente do login e do catálogo.

## Design System

O [Design System](docs/DESIGN_SYSTEM.md) documenta o tema usado pela vitrine e pelo painel. Edite a paleta, as fontes e a escala em [tokens.css](src/design-system/tokens.css).

## Conectar o catálogo persistente

1. Use um projeto Supabase dedicado à Presente Doce. Faça a primeira aplicação das duas migrações de supabase/migrations, em ordem, em um projeto de teste. A segunda migração importa os produtos existentes e preserva linhas que já tenham o mesmo ID.
2. No Supabase Auth, desative o cadastro público e crie a conta administrativa de Gabriela por um canal gerenciado. Use uma palavra-passe única e forte. Copie o UUID dessa conta do painel do Supabase e autorize-o no SQL Editor do projeto com este comando, substituindo o marcador pelo UUID verificado.
   
   ~~~sql
   insert into presente_doce_private.catalog_admins (user_id)
   values ('UUID_DA_CONTA_AUTORIZADA'::uuid)
   on conflict do nothing;
   ~~~
3. Configure `VITE_CATALOG_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` conforme `.env.example`. A URL é a do projeto em `supabase.co` e a chave começa com `sb_publishable_`. O navegador recebe somente essa chave pública. Chaves secretas, service-role e dados de clientes ficam fora do frontend e do repositório. Depois de aplicar as migrações e conferir os dados, defina `VITE_CATALOG_SOURCE=supabase` no ambiente correspondente.
4. Valide leitura de produtos publicados, escrita com a conta administrativa e recusa de escrita para uma conta comum. Use fixtures em ambiente de teste para criar, editar, fotografar, publicar e despublicar pelo celular.
5. Siga [Deploy e reversão](docs/DEPLOY.md) para promover a versão do frontend. As migrações e a recuperação de dados têm procedimento próprio.

## Operação

- Use **Menu → Entrar → Esqueci a senha** e solicite o e-mail de recuperação. Com o redirecionamento confirmado no Supabase, o botão do e-mail abre a nova senha. Durante a configuração do redirecionamento, **Usar link manualmente** aparece depois do pedido e aceita o endereço do botão do e-mail antes de o abrir. [Configuração](docs/DEPLOY.md#recuperação-de-senha)
- A lista privada de administradores controla gravação no Postgres e upload no Storage por RLS. Para remover o acesso de uma conta, retire seu UUID da lista e encerre suas sessões no Supabase Auth.
- A sessão fica em memória enquanto a pessoa navega pela loja. Recarregar a página exige entrar novamente. Use **Sair da conta** ao terminar. Edição e exclusão conferem a versão do registro antes de gravar. **Excluir produto** exige confirmação. Para ocultar temporariamente, desmarque **Mostrar no catálogo público** e guarde.
- Fotos de produto são públicas por URL. O painel reprocessa JPG, PNG e WebP para WebP e limita o tamanho. Envie somente imagens de catálogo. Preserve as imagens antigas até conferir referências e backups antes de removê-las no Storage.
- No checkout, o cliente envia a mensagem e recebe confirmação da loja pelo WhatsApp. A taxa de entrega é combinada com a Gabriela. O app mantém a seleção ao abrir o WhatsApp em outra aba e permite copiar a mensagem. A seleção e os dados são descartados ao recarregar.
- Para reverter o frontend, use o deploy anterior no projeto Vercel. Trate reversão de dados como uma operação independente. Preserve as edições feitas no catálogo e confirme a versão de recuperação antes de qualquer alteração na base.
