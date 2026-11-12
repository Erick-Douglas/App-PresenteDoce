# Presente Doce

Loja online de encomendas de confeitaria artesanal, com catálogo, carrinho, confirmação pelo WhatsApp e gestão móvel do catálogo.

[App público](https://presente-doce.vercel.app/) · [PRD](docs/PRD.md) · [Pesquisa](docs/pesquisa.md)

## Desenvolvimento

Use Node.js 24 e npm.

~~~sh
npm ci
npm run dev
npm run lint
npm test
npm run build
~~~

A raiz abre o catálogo. A rota /admin abre o painel. O catálogo inicial em código fica ativo até selecionar explicitamente o catálogo do Supabase no ambiente. A rota administrativa indica quando precisa de configuração. Com o catálogo Supabase ativo, erros de carregamento aparecem na loja para evitar voltar a apresentar produtos que Gabriela retirou do catálogo.

A rota /precificacao abre o simulador de receitas. O cálculo reproduz custo, rendimento, lucro, markup e margem da planilha. O rascunho é guardado apenas no navegador se a pessoa usar a opção de guardar. O simulador é independente do login e do catálogo.

## Conectar o catálogo persistente

1. Use um projeto Supabase dedicado à Presente Doce. Faça a primeira aplicação das duas migrações de supabase/migrations, em ordem, em um projeto de teste. A segunda migração importa os produtos existentes e preserva linhas que já tenham o mesmo ID.
2. No Supabase Auth, desative o cadastro público e crie a conta administrativa de Gabriela por um canal gerenciado. Use uma palavra-passe única e forte. Copie o UUID dessa conta do painel do Supabase e autorize-o no SQL Editor do projeto com este comando, substituindo o marcador pelo UUID verificado.
   
   ~~~sql
   insert into presente_doce_private.catalog_admins (user_id)
   values ('UUID_DA_CONTA_AUTORIZADA'::uuid)
   on conflict do nothing;
   ~~~
3. Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY conforme .env.example. A URL é a do projeto em supabase.co e a chave começa com sb_publishable_. O navegador recebe somente essa chave pública. Chaves secretas, service-role e dados de clientes ficam fora do frontend e do repositório. Depois de aplicar as migrações e conferir os dados, defina VITE_CATALOG_SOURCE=supabase no ambiente correspondente.
4. Configure o ambiente Preview da Vercel com o projeto de teste e faça uma nova build. Confira leitura anônima de produtos publicados, escrita com a conta administrativa e ausência de acesso administrativo para uma conta comum. Teste criar, editar, fotografar, publicar e despublicar um produto fictício pelo celular. Confira o catálogo em outra sessão.
5. Depois da validação, configure o ambiente Production com o projeto de produção, aplique as migrações nele e confira o catálogo antes de publicar. A Vercel roda TypeScript, testes de checkout e build no deploy. Registre a versão e a cópia de recuperação da base antes da migração.

## Operação

- No primeiro acesso, abra /admin e selecione Ativar acesso. Copie o endereço do convite do Supabase sem abri-lo. Cole-o no painel e defina a palavra-passe. O painel valida o convite no Supabase e verifica a autorização antes de aceitar a nova palavra-passe.
- A lista privada de administradores controla gravação no Postgres e upload no Storage por RLS. Para remover o acesso de uma conta, retire seu UUID da lista e encerre suas sessões no Supabase Auth.
- O painel guarda a sessão em memória. Recarregar a página exige entrar novamente. Use a opção Sair ao terminar. Uma publicação concorre com outras edições por versão do registro.
- Fotos de produto são públicas por URL. O painel reprocessa JPG, PNG e WebP para WebP e limita o tamanho. Envie somente imagens de catálogo. Preserve as imagens antigas até conferir referências e backups antes de removê-las no Storage.
- No checkout, o cliente envia a mensagem e recebe confirmação da loja pelo WhatsApp. A taxa de entrega é combinada com a Gabriela. O app mantém a seleção ao abrir o WhatsApp em outra aba e permite copiar a mensagem. A seleção e os dados são descartados ao recarregar.
- Para reverter o frontend, use o deploy anterior no projeto Vercel. Trate reversão de dados como uma operação independente. Preserve as edições feitas no catálogo e confirme a versão de recuperação antes de qualquer alteração na base.
