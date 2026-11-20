# Ensaios da fiscalização · 20/11/2026

## Regressão rápida

```sh
npm run lint
npm test
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

Com o preview aberto, execute em outro terminal:

```sh
node tests/admin-workflows.mjs
node tests/public-layout.mjs
```

O teste usa Playwright disponível no ambiente (pacote playwright, ou a biblioteca do runtime Codex). Defina PD_CHROME_PATH se o Chrome não estiver no caminho padrão do Windows ou se usar outro executável Chromium. Em ambientes com Playwright e os navegadores instalados, a biblioteca também usa seu Chromium no Linux/macOS. PD_BASE_URL pode indicar outro endereço para verificar a build publicada.

## Isolamento e cobertura

O ensaio intercepta todas as chamadas de Supabase e usa apenas dados fictícios em memória. Outros destinos externos são bloqueados. Não cria contas reais, não escreve no catálogo de operação e não envia mensagens.

Cobre proteção de ficha após limpar o rascunho, rejeição de gravação incompleta, confirmação de preço, prévia/arquivo de fotografia, substituição acima de 20 MB, cancelamento, reabertura, erro/reenvio, criação e associação de tópico, filtro público, sessão e páginas a 320, 390, 768, 1024, 1440 e 1920 px. Aguarda o fim da animação antes de medir as páginas. A página de categorias usa seu botão Voltar à vitrine.

O relatório é gravado em node_modules/.cache/pd-review/evidence.json. A evidência versionada desta entrega fica em validation/2026-11-20-review.json.

## Regras reais do banco

tests/database-regression.sql confere a restrição de fichas, controle de versão, associação/renomeação/exclusão de tópicos pelos triggers/RPCs, leitura pública de tópicos e bloqueio de rascunhos e fichas para visitante. Usa fixtures dentro de uma transação com ROLLBACK. Execute o arquivo completo num ambiente autorizado; se uma asserção falhar, encerre a transação com rollback antes de repetir. Não execute apenas os comandos de preparação.

Esse teste não substitui o fluxo de autenticação real no provedor, a validação das receitas com Gabriela nem o ensaio em aparelho físico. O parecer da liderança continua separado da execução.

O ensaio public-layout lê o catálogo público e confere detalhes de produto, carrinho preenchido e login nas seis larguras. Não faz login, não submete checkout e não envia mensagens. A evidência versionada é validation/2026-11-20-public-layout.json.
