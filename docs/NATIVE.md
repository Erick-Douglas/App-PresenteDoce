# Android e iOS

O mesmo projeto web tem bases Android e iOS em Capacitor 8.6.2. O conteúdo é compilado em dist e copiado para os projetos nativos; a aplicação instalada não depende de carregar o site remoto numa janela.

## Preparação executada em 20/11/2026

- Projetos Android e iOS gerados e sincronizados com a build web.
- Nome Presente Doce e ícones e abertura gerados a partir de resources/icon.png, com presente dourado sobre bordô.
- Identificador provisório pt.presentedoce.app. Confirmar propriedade e disponibilidade antes de registrar nas lojas; mudar antes de assinar a primeira versão.
- Android com backup automático desativado para evitar cópia da sessão administrativa.
- SDKs de sistema, certificados e senhas não entram no repositório.

## Compilar e abrir

Use Node 24, npm ci e as variáveis públicas do arquivo .env.example para o projeto Supabase da loja. Nunca colocar uma chave de serviço na build. Depois:

```sh
npm run native:sync
npm run native:android
npm run native:ios
```

O primeiro comando compila a interface e sincroniza as plataformas. Android exige Android Studio, JDK e SDK compatíveis com Capacitor 8. iOS exige macOS com Xcode e os requisitos da documentação oficial. O ambiente Windows desta sessão não tinha JDK/SDK Android nem Xcode. Não foi gerado, assinado ou distribuído APK, AAB ou IPA.

Os ícones podem ser regenerados com a versão fixada do gerador:

```sh
npx @capacitor/assets@4.0.0 generate --android --ios --assetPath resources --iconBackgroundColor "#800000" --iconBackgroundColorDark "#800000" --splashBackgroundColor "#800000" --splashBackgroundColorDark "#800000"
```

## Antes da distribuição

1. Confirmar identificador, contas de desenvolvedor, política de privacidade e informações das lojas.
2. Compilar e testar nos aparelhos reais, incluindo seleção/cancelamento de fotografias, HEIC, teclado, áreas seguras, botão voltar, WhatsApp e partilha.
3. Adaptar e testar o retorno de recuperação de senha com links associados ao app. A recuperação pelo domínio web continua disponível.
4. Rever persistência de credenciais em Keychain/Keystore antes da distribuição, além da renovação existente no navegador.
5. Validar comportamento sem rede e atualização da versão. Preparar assinatura fora do repositório e gerar AAB/IPA.
6. Rever as diretrizes das lojas. O empacotamento não garante aprovação e a futura plataforma para várias lojas requer isolamento próprio dos dados.

[Documentação do Capacitor](https://capacitorjs.com/docs) · [Ambiente de desenvolvimento](https://capacitorjs.com/docs/getting-started/environment-setup) · [Publicação web](DEPLOY.md)
