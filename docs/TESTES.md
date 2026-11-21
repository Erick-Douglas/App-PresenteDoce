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

Cobre proteção de ficha após limpar o rascunho, rejeição de gravação incompleta, confirmação de preço, prévia/arquivo de fotografia, substituição acima de 20 MB, cancelamento, reabertura, erro/reenvio, criação e associação de tópico, ausência da faixa pública de tópicos, sessão e páginas a 320, 390, 768, 1024, 1440 e 1920 px. Aguarda o fim da animação antes de medir as páginas. A página de categorias usa seu botão Voltar à vitrine.

O relatório é gravado em node_modules/.cache/pd-review/evidence.json. A evidência versionada desta entrega fica em validation/2026-11-20-review.json.

## Regras reais do banco

tests/database-regression.sql confere a restrição de fichas, controle de versão, associação/renomeação/exclusão de tópicos pelos triggers/RPCs, leitura pública de tópicos e bloqueio de rascunhos e fichas para visitante. Usa fixtures dentro de uma transação com ROLLBACK. Execute o arquivo completo num ambiente autorizado; se uma asserção falhar, encerre a transação com rollback antes de repetir. Não execute apenas os comandos de preparação.

Esse teste não substitui o fluxo de autenticação real no provedor, a validação das receitas com Gabriela nem o ensaio em aparelho físico. O parecer da liderança continua separado da execução.

O ensaio public-layout lê o catálogo público e confere detalhes de produto, carrinho preenchido e login nas seis larguras. Não faz login, não submete checkout e não envia mensagens. A evidência versionada é validation/2026-11-20-public-layout.json.

## Plataforma híbrida · 20/11/2026

A suíte Node inclui PostgreSQL local por PGlite, aplicando todas as migrações sem contactar produção. Há testes de preço e acréscimos, saldo/idempotência, reserva/capacidade, estados, ingredientes/sub-receitas, ciclos, acesso anônimo, isolamento de lojas, Storage, conta não verificada e plano expirado. O contrato Edge verifica JWT, loja, payload, origem, tamanho, rate limit e preservação do JWT nas escritas.

Os ensaios admin-workflows.mjs também gravam cliente, insumo, encomenda, sinal, estoque e calendário numa API fictícia isolada; testam a prévia de cliente e 102 vistas + 6 editores em seis larguras. public-layout.mjs testa 18 vistas, recusa de slug inexistente e cadastro comercial desativado. Capturas/saídas locais ficam no cache ignorado; o relatório sanitizado é versionado em validation/2026-11-20-platform.json.

Duas lojas descartáveis no projeto hospedado validaram a API real e concorrência de última unidade/capacidade. Nenhum WhatsApp foi enviado; fixtures foram removidas, com contagens de produção preservadas. Esses ensaios não substituem login/uso físico de Gabriela nem comparação dos registros comerciais antigos. [Estado completo](IMPLEMENTACAO.md).

## Revisão de 21/11/2026

Execute também node tests/buyer-admin-flows.mjs com o preview aberto. A identidade do Auth é fictícia; o código da Edge Function e as regras PostgreSQL são reais, aplicadas em PGlite isolado. Todos os pedidos Supabase são interceptados. Testa toque na sacola/barra de compra em seis larguras, configuração de bolo, checkout idempotente, caixa/sabores, última unidade, cliente novo/encomenda, movimentos corrigidos/excluídos e alteração de marca. Evidência em node_modules/.cache/pd-review/buyer-admin-evidence.json. Não substitui a validação da autenticação no provedor.

refinement-db.test.mjs verifica correção, exclusão lógica, rollback, idempotência, versão, saldo, isolamento e contraste. A conferência hospedada das novas regras usa transação integral com rollback, sem deixar fixtures. 54 testes de regras/contratos aprovados nesta revisão. [Estado de segurança](SEGURANCA.md).

Para os controles remotos sem escrita, execute node scripts/check-security.mjs. Defina PD_SITE_URL para incluir a rejeição de corpo excessivo no gateway publicado. O limite no handler Edge é coberto isoladamente; a resposta direta do relay não foi declarada corrigida.


## Suíte da jornada · 21/11/2026

Executar também node tests/catalog-journey.mjs, node tests/checkout-journey.mjs, node tests/pricing-journey.mjs e node tests/review-captures.mjs com preview local ativo. As três jornadas usam banco isolado, gateway/handler reais e identidade simulada. Capturas em node_modules/.cache ficam fora do Git. [Cobertura, resultados e limites](CORRECOES-JORNADA-2026-11-21.md).

