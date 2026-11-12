# Deploy e reversão

## Ambientes

- **GitHub.** `Erick-Douglas/App-PresenteDoce`. Pull requests geram previews, e o merge em `main` inicia o deploy de produção no projeto vinculado.
- **Vercel.** Um projeto `app-presente-doce` hospeda a [loja](https://presente-doce.vercel.app/) e o [painel](https://presente-doce.vercel.app/admin). As URLs geradas para previews ficam disponíveis para revisão com acesso à Vercel. O endereço oficial usa somente a autenticação do aplicativo para entrar no painel.
- **Supabase.** O projeto dedicado `gpwcuuqsvnsqudghkylb` guarda o catálogo, as imagens e a conta administrativa. A build de validação de 12/11/2026 e a produção usam essa mesma base para aproveitar as edições já feitas no painel. Alterações nela afetam o catálogo publicado. Para testes de escrita futuros, use dados fictícios em um ambiente separado.
- **Exclusão.** Antes de liberar a edição integrada, confira a migração `20261112124748_presente_doce_catalog_delete.sql`. Ela restringe a exclusão pela API à conta que consta na lista privada de administradores. A interface pede confirmação e compara a versão atual do registro.

## Configuração do frontend

Configure `VITE_CATALOG_SOURCE=supabase`, `VITE_CATALOG_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` no ambiente da Vercel. A variável antiga `VITE_SUPABASE_URL` é lida como fallback para previews já configurados. Use somente a chave publicável do projeto correto. A autorização de escrita fica no Supabase, com RLS no catálogo e no Storage.

## Recuperação de senha

1. Em **Supabase → Authentication → URL Configuration**, adicione `https://presente-doce.vercel.app/admin?recuperar=1` às URLs permitidas.
2. Confirme que o e-mail de recuperação usa o endereço de confirmação do Supabase e que o destino é o domínio oficial. Ative `VITE_DIRECT_RECOVERY=true` em produção na Vercel e gere a nova build para apresentar a instrução de abrir o botão do e-mail. Durante a configuração, a loja oferece **Usar link manualmente** após o pedido.
3. Valide com conta de teste o retorno para a loja e a mensagem de link expirado. A aplicação remove o fragmento da barra de endereço, mantém a sessão de recuperação em memória e verifica a permissão de administrador antes de alterar a senha. [Recuperação do Supabase](https://supabase.com/docs/guides/auth/passwords#resetting-a-password) · [URLs permitidas](https://supabase.com/docs/guides/auth/redirect-urls)

## Publicação

1. Confirme o repositório, a branch e o projeto Vercel. Identifique o deploy ativo e a versão de retorno.
2. Abra o pull request e confira a build do commit que será publicado. O comando de build executa TypeScript, testes, leitura anônima da API de catálogo e Vite. O teste de conexão falha quando produção está sem catálogo Supabase ou quando a API não responde como esperado.
3. Faça merge para `main` quando o preview estiver validado. Aguarde o deploy de produção ficar `READY` e confira o domínio oficial.
4. Abra a loja em uma sessão anônima e confira um produto publicado. Use **Menu → Entrar** e confira os controles de gestão na mesma loja. Valide edição direta, criação, rascunhos, exclusão e saída com produtos fictícios em um ambiente de teste. Confira também o atalho `/admin` e o checkout com dados fictícios.
5. Registre o commit, o deploy, a verificação e qualquer pendência no Daily Log.

## Reversão

- A versão anterior ao refinamento do acesso corresponde ao commit `8185522`. [Deploy anterior](https://vercel.com/erick-douglas-projects-c8717cab/app-presente-doce/6c4oYD2EYyNpJhh6im5PoMXh7DNF)
- Em caso de problema de frontend, faça rollback para a última versão estável no mesmo projeto Vercel. Confirme que o domínio oficial serve o deploy esperado.
- Preserve as edições do Supabase durante a reversão de frontend. Aplique migrações de dados em uma operação separada, com cópia de recuperação e aceite próprio. As versões aplicadas estão em `supabase/migrations`.
